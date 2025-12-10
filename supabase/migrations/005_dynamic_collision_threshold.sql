-- =============================================
-- Dynamic Collision Threshold
-- Rules:
-- - Less than 5 players: 2 players needed to reveal
-- - 5+ players: 1/3 of players needed to reveal (minimum 2)
-- Player count is fixed at game start
-- =============================================

-- Add player_count column to rooms (fixed at start)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS player_count INT;

-- Update start_game to save player count
CREATE OR REPLACE FUNCTION start_game(
  p_room_id UUID,
  p_user_id TEXT
) RETURNS JSON AS $$
DECLARE
  v_is_host BOOLEAN;
  v_room_status TEXT;
  v_game_mode TEXT;
  v_secret_word_id INT;
  v_game_day INT;
  v_player_count INT;
BEGIN
  -- Check if user is host
  SELECT is_host INTO v_is_host 
  FROM room_players 
  WHERE room_id = p_room_id AND user_id = p_user_id;

  IF v_is_host IS NULL OR v_is_host = FALSE THEN
    RETURN json_build_object('error', 'Apenas o host pode iniciar o jogo');
  END IF;

  -- Check room status and get game_mode
  SELECT status, game_mode INTO v_room_status, v_game_mode 
  FROM rooms WHERE id = p_room_id;
  
  IF v_room_status != 'waiting' THEN
    RETURN json_build_object('error', 'O jogo já foi iniciado');
  END IF;

  -- Count players at start (this is fixed for the game)
  SELECT count(*) INTO v_player_count
  FROM room_players
  WHERE room_id = p_room_id;

  -- Handle based on game mode
  IF v_game_mode = 'classic' THEN
    -- Classic mode: select random word from dictionary
    SELECT id INTO v_secret_word_id 
    FROM dictionary 
    ORDER BY random() 
    LIMIT 1;

    IF v_secret_word_id IS NULL THEN
      RETURN json_build_object('error', 'Dicionário vazio. Execute o seed primeiro.');
    END IF;

    UPDATE rooms 
    SET secret_word_id = v_secret_word_id, 
        status = 'playing',
        player_count = v_player_count
    WHERE id = p_room_id;

  ELSIF v_game_mode = 'contexto' THEN
    -- Contexto.me mode: select random game day (1-1386)
    v_game_day := floor(random() * 1386) + 1;

    UPDATE rooms 
    SET game_day = v_game_day, 
        status = 'playing',
        player_count = v_player_count
    WHERE id = p_room_id;

  END IF;

  RETURN json_build_object(
    'success', TRUE, 
    'game_mode', v_game_mode,
    'player_count', v_player_count
  );
END;
$$ LANGUAGE plpgsql;

-- Helper function to calculate collision threshold
CREATE OR REPLACE FUNCTION calculate_collision_threshold(p_player_count INT)
RETURNS INT AS $$
BEGIN
  IF p_player_count < 5 THEN
    RETURN 2;
  ELSE
    RETURN GREATEST(2, CEIL(p_player_count::NUMERIC / 3)::INT);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update save_guess function with dynamic collision threshold
CREATE OR REPLACE FUNCTION save_guess(
  p_room_id UUID, 
  p_user_id TEXT, 
  p_word TEXT,
  p_rank INT
) RETURNS JSON AS $$
DECLARE
  v_own_guess_count INT;
  v_other_users_count INT;
  v_player_count INT;
  v_collision_threshold INT;
  v_room_status TEXT;
  v_game_mode TEXT;
  v_is_winner BOOLEAN := FALSE;
  v_should_reveal BOOLEAN := FALSE;
BEGIN
  -- 1. Normalize word (lowercase, trim)
  p_word := lower(trim(p_word));

  -- 2. Check room status, mode, and get player_count from start
  SELECT status, game_mode, player_count INTO v_room_status, v_game_mode, v_player_count
  FROM rooms WHERE id = p_room_id;
  
  IF v_room_status != 'playing' THEN
    RETURN json_build_object('error', 'O jogo não está em andamento');
  END IF;

  -- Fallback if player_count not set (old rooms)
  IF v_player_count IS NULL THEN
    SELECT count(*) INTO v_player_count
    FROM room_players
    WHERE room_id = p_room_id;
  END IF;

  -- 3. Check if the SAME user already guessed this word
  SELECT count(*) INTO v_own_guess_count
  FROM guesses
  WHERE room_id = p_room_id 
    AND user_id = p_user_id 
    AND word = p_word;

  IF v_own_guess_count > 0 THEN
    RETURN json_build_object('error', 'Você já tentou essa palavra');
  END IF;

  -- 4. Calculate collision threshold based on player count at start
  v_collision_threshold := calculate_collision_threshold(v_player_count);

  -- 5. Count OTHER users who guessed this word
  SELECT count(DISTINCT user_id) INTO v_other_users_count
  FROM guesses
  WHERE room_id = p_room_id 
    AND word = p_word
    AND user_id != p_user_id;

  -- 6. Check if we should reveal (current user + other users >= threshold)
  IF (v_other_users_count + 1) >= v_collision_threshold THEN
    v_should_reveal := TRUE;
    -- Mark ALL guesses with this word as revealed
    UPDATE guesses SET is_revealed = TRUE 
    WHERE room_id = p_room_id AND word = p_word;
  END IF;

  -- 7. Insert the guess
  INSERT INTO guesses (room_id, user_id, word, rank, is_revealed)
  VALUES (p_room_id, p_user_id, p_word, p_rank, v_should_reveal);

  -- 8. Check for winner (rank 1 means correct word)
  IF p_rank = 0 OR p_rank = 1 THEN
    v_is_winner := TRUE;
    UPDATE rooms 
    SET status = 'finished', winner_id = p_user_id
    WHERE id = p_room_id;
  END IF;

  RETURN json_build_object(
    'success', TRUE, 
    'rank', p_rank, 
    'revealed', v_should_reveal,
    'is_winner', v_is_winner,
    'collision_threshold', v_collision_threshold,
    'collision_count', v_other_users_count + 1
  );
END;
$$ LANGUAGE plpgsql;

-- Also update submit_guess for classic mode
CREATE OR REPLACE FUNCTION submit_guess(
  p_room_id UUID, 
  p_user_id TEXT, 
  p_word TEXT
) RETURNS JSON AS $$
DECLARE
  v_secret_word_id INT;
  v_secret_word TEXT;
  v_secret_embedding vector(1536);
  v_word_embedding vector(1536);
  v_own_guess_count INT;
  v_other_users_count INT;
  v_player_count INT;
  v_collision_threshold INT;
  v_room_status TEXT;
  v_rank INT;
  v_is_winner BOOLEAN := FALSE;
  v_should_reveal BOOLEAN := FALSE;
BEGIN
  -- 1. Normalize word
  p_word := lower(trim(p_word));

  -- 2. Check room status and get player_count from start
  SELECT status, secret_word_id, player_count INTO v_room_status, v_secret_word_id, v_player_count
  FROM rooms WHERE id = p_room_id;
  
  IF v_room_status != 'playing' THEN
    RETURN json_build_object('error', 'O jogo não está em andamento');
  END IF;

  IF v_secret_word_id IS NULL THEN
    RETURN json_build_object('error', 'Palavra secreta não definida');
  END IF;

  -- Fallback if player_count not set (old rooms)
  IF v_player_count IS NULL THEN
    SELECT count(*) INTO v_player_count
    FROM room_players
    WHERE room_id = p_room_id;
  END IF;

  -- 3. Check if user already guessed this word
  SELECT count(*) INTO v_own_guess_count
  FROM guesses
  WHERE room_id = p_room_id 
    AND user_id = p_user_id 
    AND word = p_word;

  IF v_own_guess_count > 0 THEN
    RETURN json_build_object('error', 'Você já tentou essa palavra');
  END IF;

  -- 4. Get secret word embedding
  SELECT word, embedding INTO v_secret_word, v_secret_embedding 
  FROM dictionary WHERE id = v_secret_word_id;

  -- 5. Get guessed word embedding
  SELECT embedding INTO v_word_embedding 
  FROM dictionary WHERE word = p_word;

  IF v_word_embedding IS NULL THEN
    RETURN json_build_object('error', 'Palavra não encontrada no dicionário');
  END IF;

  -- 6. Calculate rank based on similarity
  SELECT count(*) + 1 INTO v_rank
  FROM dictionary
  WHERE id != v_secret_word_id
    AND (v_secret_embedding <=> embedding) < (v_secret_embedding <=> v_word_embedding);

  -- 7. Calculate collision threshold based on player count at start
  v_collision_threshold := calculate_collision_threshold(v_player_count);

  -- 8. Count OTHER users who guessed this word
  SELECT count(DISTINCT user_id) INTO v_other_users_count
  FROM guesses
  WHERE room_id = p_room_id 
    AND word = p_word
    AND user_id != p_user_id;

  -- 9. Check if we should reveal
  IF (v_other_users_count + 1) >= v_collision_threshold THEN
    v_should_reveal := TRUE;
    UPDATE guesses SET is_revealed = TRUE 
    WHERE room_id = p_room_id AND word = p_word;
  END IF;

  -- 10. Insert the guess
  INSERT INTO guesses (room_id, user_id, word, rank, is_revealed)
  VALUES (p_room_id, p_user_id, p_word, v_rank, v_should_reveal);

  -- 11. Check for winner
  IF p_word = v_secret_word THEN
    v_is_winner := TRUE;
    UPDATE rooms 
    SET status = 'finished', winner_id = p_user_id
    WHERE id = p_room_id;
  END IF;

  RETURN json_build_object(
    'success', TRUE, 
    'rank', v_rank, 
    'revealed', v_should_reveal,
    'is_winner', v_is_winner,
    'collision_threshold', v_collision_threshold,
    'collision_count', v_other_users_count + 1
  );
END;
$$ LANGUAGE plpgsql;

-- Update get_room_details to include player_count
CREATE OR REPLACE FUNCTION get_room_details(
  p_room_id UUID
) RETURNS JSON AS $$
DECLARE
  v_room JSON;
  v_players JSON;
  v_guesses JSON;
  v_secret_word TEXT;
  v_game_mode TEXT;
  v_status TEXT;
BEGIN
  -- Get game_mode and status first
  SELECT game_mode, status INTO v_game_mode, v_status
  FROM rooms WHERE id = p_room_id;

  -- Determine secret_word based on game mode
  IF v_status = 'finished' THEN
    IF v_game_mode = 'classic' THEN
      -- Classic mode: get from dictionary
      SELECT d.word INTO v_secret_word
      FROM rooms r
      JOIN dictionary d ON r.secret_word_id = d.id
      WHERE r.id = p_room_id;
    ELSIF v_game_mode = 'contexto' THEN
      -- Contexto mode: get the winning guess (rank 1 or 0)
      SELECT g.word INTO v_secret_word
      FROM guesses g
      WHERE g.room_id = p_room_id AND (g.rank = 1 OR g.rank = 0)
      LIMIT 1;
    END IF;
  END IF;

  -- Get room info (including player_count)
  SELECT json_build_object(
    'id', r.id,
    'status', r.status,
    'winner_id', r.winner_id,
    'created_at', r.created_at,
    'game_mode', r.game_mode,
    'game_day', r.game_day,
    'player_count', r.player_count,
    'secret_word', v_secret_word
  ) INTO v_room
  FROM rooms r
  WHERE r.id = p_room_id;

  -- Get players
  SELECT json_agg(json_build_object(
    'user_id', user_id,
    'nickname', nickname,
    'is_host', is_host,
    'joined_at', joined_at
  )) INTO v_players
  FROM room_players
  WHERE room_id = p_room_id;

  -- Get guesses with player nicknames
  SELECT json_agg(json_build_object(
    'id', g.id,
    'user_id', g.user_id,
    'word', g.word,
    'rank', g.rank,
    'is_revealed', g.is_revealed,
    'created_at', g.created_at,
    'nickname', rp.nickname
  ) ORDER BY g.created_at DESC) INTO v_guesses
  FROM guesses g
  JOIN room_players rp ON g.room_id = rp.room_id AND g.user_id = rp.user_id
  WHERE g.room_id = p_room_id;

  RETURN json_build_object(
    'room', v_room,
    'players', COALESCE(v_players, '[]'::JSON),
    'guesses', COALESCE(v_guesses, '[]'::JSON)
  );
END;
$$ LANGUAGE plpgsql;
