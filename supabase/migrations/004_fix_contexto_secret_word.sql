-- =============================================
-- Fix: Return secret_word for Contexto mode
-- In Contexto mode, the secret word is the winning guess (rank 1)
-- =============================================

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

  -- Get room info
  SELECT json_build_object(
    'id', r.id,
    'status', r.status,
    'winner_id', r.winner_id,
    'created_at', r.created_at,
    'game_mode', r.game_mode,
    'game_day', r.game_day,
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

