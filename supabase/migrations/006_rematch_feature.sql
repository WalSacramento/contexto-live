-- =============================================
-- Rematch Feature: Create new room with same players
-- =============================================

-- Function: Create rematch room
CREATE OR REPLACE FUNCTION create_rematch_room(
  p_parent_room_id UUID,
  p_user_id TEXT
) RETURNS JSON AS $$
DECLARE
  v_new_room_id UUID;
  v_is_host BOOLEAN;
  v_parent_status TEXT;
  v_game_mode TEXT;
  v_player_record RECORD;
BEGIN
  -- 1. Verificar se user é host da sala original
  SELECT is_host INTO v_is_host
  FROM room_players
  WHERE room_id = p_parent_room_id AND user_id = p_user_id;

  IF v_is_host IS NULL OR v_is_host = FALSE THEN
    RETURN json_build_object('error', 'Apenas o host pode criar rematch');
  END IF;

  -- 2. Verificar se sala original está finalizada
  SELECT status, game_mode INTO v_parent_status, v_game_mode
  FROM rooms
  WHERE id = p_parent_room_id;

  IF v_parent_status IS NULL THEN
    RETURN json_build_object('error', 'Sala original não encontrada');
  END IF;

  IF v_parent_status != 'finished' THEN
    RETURN json_build_object('error', 'Jogo ainda não terminou');
  END IF;

  -- 3. Criar nova sala (mesmo game_mode da original)
  INSERT INTO rooms (status, game_mode)
  VALUES ('waiting', v_game_mode)
  RETURNING id INTO v_new_room_id;

  -- 4. Copiar todos os jogadores da sala original
  FOR v_player_record IN
    SELECT user_id, nickname, is_host
    FROM room_players
    WHERE room_id = p_parent_room_id
  LOOP
    INSERT INTO room_players (room_id, user_id, nickname, is_host)
    VALUES (
      v_new_room_id,
      v_player_record.user_id,
      v_player_record.nickname,
      v_player_record.is_host
    );
  END LOOP;

  -- 5. Retornar sucesso com novo room_id
  RETURN json_build_object(
    'success', TRUE,
    'room_id', v_new_room_id,
    'game_mode', v_game_mode
  );
END;
$$ LANGUAGE plpgsql;
