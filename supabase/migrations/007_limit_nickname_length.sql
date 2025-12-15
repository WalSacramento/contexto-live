-- =============================================
-- Validar tamanho do nickname (máx 20 caracteres)
-- =============================================

-- Observação:
-- - Não alteramos dados antigos.
-- - Não mudamos o tipo da coluna.
-- - Apenas passamos a VALIDAR nas funções RPC, retornando erro se > 20.

CREATE OR REPLACE FUNCTION create_room(
  p_user_id TEXT,
  p_nickname TEXT,
  p_game_mode TEXT DEFAULT 'classic'
) RETURNS JSON AS $$
DECLARE
  v_room_id UUID;
BEGIN
  -- Validate nickname length
  IF char_length(COALESCE(p_nickname, '')) > 20 THEN
    RETURN json_build_object('error', 'Nickname muito longo (máximo 20 caracteres)');
  END IF;

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

CREATE OR REPLACE FUNCTION join_room(
  p_room_id UUID,
  p_user_id TEXT,
  p_nickname TEXT
) RETURNS JSON AS $$
DECLARE
  v_room_status TEXT;
  v_existing_player INT;
BEGIN
  -- Check if room exists and get status
  SELECT status INTO v_room_status FROM rooms WHERE id = p_room_id;
  
  IF v_room_status IS NULL THEN
    RETURN json_build_object('error', 'Sala não encontrada');
  END IF;

  -- Validate nickname length
  IF char_length(COALESCE(p_nickname, '')) > 20 THEN
    RETURN json_build_object('error', 'Nickname muito longo (máximo 20 caracteres)');
  END IF;

  -- Check if player is already in the room
  SELECT count(*) INTO v_existing_player 
  FROM room_players 
  WHERE room_id = p_room_id AND user_id = p_user_id;

  IF v_existing_player > 0 THEN
    -- Player is rejoining, just return success
    RETURN json_build_object('success', TRUE, 'room_status', v_room_status);
  END IF;

  -- Add player to room
  INSERT INTO room_players (room_id, user_id, nickname, is_host)
  VALUES (p_room_id, p_user_id, p_nickname, FALSE);

  RETURN json_build_object('success', TRUE, 'room_status', v_room_status);
END;
$$ LANGUAGE plpgsql;


