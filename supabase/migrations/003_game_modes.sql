-- =============================================
-- Game Modes: Classic + Contexto.me
-- =============================================

-- Add game_mode and game_day columns to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS game_mode TEXT DEFAULT 'classic';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS game_day INT;

-- Add constraint for game_mode values
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_game_mode_check;
ALTER TABLE rooms ADD CONSTRAINT rooms_game_mode_check 
  CHECK (game_mode IN ('classic', 'contexto'));

-- =============================================
-- Update create_room to support game_mode
-- =============================================

CREATE OR REPLACE FUNCTION create_room(
  p_user_id TEXT,
  p_nickname TEXT,
  p_game_mode TEXT DEFAULT 'classic'
) RETURNS JSON AS $$
DECLARE
  v_room_id UUID;
BEGIN
  -- Validate game_mode
  IF p_game_mode NOT IN ('classic', 'contexto') THEN
    RETURN json_build_object('error', 'Modo de jogo inválido');
  END IF;

  -- Create the room
  INSERT INTO rooms (status, game_mode)
  VALUES ('waiting', p_game_mode)
  RETURNING id INTO v_room_id;

  -- Add the creator as host
  INSERT INTO room_players (room_id, user_id, nickname, is_host)
  VALUES (v_room_id, p_user_id, p_nickname, TRUE);

  RETURN json_build_object('success', TRUE, 'room_id', v_room_id);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Update start_game to handle both modes
-- =============================================

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
    SET secret_word_id = v_secret_word_id, status = 'playing'
    WHERE id = p_room_id;

  ELSIF v_game_mode = 'contexto' THEN
    -- Contexto.me mode: select random game day (1-1386)
    v_game_day := floor(random() * 1386) + 1;

    UPDATE rooms 
    SET game_day = v_game_day, status = 'playing'
    WHERE id = p_room_id;

  END IF;

  RETURN json_build_object('success', TRUE, 'game_mode', v_game_mode);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- New function: save_guess (for contexto mode)
-- Receives rank already calculated from client
-- =============================================

CREATE OR REPLACE FUNCTION save_guess(
  p_room_id UUID, 
  p_user_id TEXT, 
  p_word TEXT,
  p_rank INT
) RETURNS JSON AS $$
DECLARE
  v_own_guess_count INT;
  v_other_guess_count INT;
  v_room_status TEXT;
  v_game_mode TEXT;
  v_is_winner BOOLEAN := FALSE;
BEGIN
  -- 1. Normalize word (lowercase, trim)
  p_word := lower(trim(p_word));

  -- 2. Check room status and mode
  SELECT status, game_mode INTO v_room_status, v_game_mode 
  FROM rooms WHERE id = p_room_id;
  
  IF v_room_status != 'playing' THEN
    RETURN json_build_object('error', 'O jogo não está em andamento');
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

  -- 4. Check for collision with OTHER users only
  SELECT count(*) INTO v_other_guess_count
  FROM guesses
  WHERE room_id = p_room_id 
    AND word = p_word
    AND user_id != p_user_id;

  -- If another user already guessed this word, mark all as revealed
  IF v_other_guess_count > 0 THEN
    UPDATE guesses SET is_revealed = TRUE 
    WHERE room_id = p_room_id AND word = p_word;
  END IF;

  -- 5. Insert the guess
  INSERT INTO guesses (room_id, user_id, word, rank, is_revealed)
  VALUES (p_room_id, p_user_id, p_word, p_rank, (v_other_guess_count > 0));

  -- 6. Check for winner (rank 1 means distance 0 in contexto.me, but we use rank 1)
  IF p_rank = 0 OR p_rank = 1 THEN
    v_is_winner := TRUE;
    UPDATE rooms 
    SET status = 'finished', winner_id = p_user_id
    WHERE id = p_room_id;
  END IF;

  RETURN json_build_object(
    'success', TRUE, 
    'rank', p_rank, 
    'revealed', (v_other_guess_count > 0),
    'is_winner', v_is_winner
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Update get_room_details to include game_mode and game_day
-- =============================================

CREATE OR REPLACE FUNCTION get_room_details(
  p_room_id UUID
) RETURNS JSON AS $$
DECLARE
  v_room JSON;
  v_players JSON;
  v_guesses JSON;
BEGIN
  -- Get room info (including game_mode and game_day)
  SELECT json_build_object(
    'id', r.id,
    'status', r.status,
    'winner_id', r.winner_id,
    'created_at', r.created_at,
    'game_mode', r.game_mode,
    'game_day', r.game_day,
    'secret_word', CASE WHEN r.status = 'finished' AND r.game_mode = 'classic' THEN d.word ELSE NULL END
  ) INTO v_room
  FROM rooms r
  LEFT JOIN dictionary d ON r.secret_word_id = d.id
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

