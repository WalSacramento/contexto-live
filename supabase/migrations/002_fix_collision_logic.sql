-- =============================================
-- Fix: Collision logic - only between different users
-- =============================================

-- Drop and recreate the submit_guess function with corrected collision logic
create or replace function submit_guess(
  p_room_id uuid, 
  p_user_id text, 
  p_word text
) returns json as $$
declare
  v_secret_vector vector(1536);
  v_guess_vector vector(1536);
  v_rank int;
  v_own_guess_count int;
  v_other_guess_count int;
  v_room_status text;
  v_is_winner boolean := false;
begin
  -- 1. Normalize word (lowercase, trim)
  p_word := lower(trim(p_word));

  -- 2. Check room status
  select status into v_room_status from rooms where id = p_room_id;
  
  if v_room_status != 'playing' then
    return json_build_object('error', 'O jogo não está em andamento');
  end if;

  -- 3. Check if the SAME user already guessed this word
  select count(*) into v_own_guess_count
  from guesses
  where room_id = p_room_id 
    and user_id = p_user_id 
    and word = p_word;

  if v_own_guess_count > 0 then
    return json_build_object('error', 'Você já tentou essa palavra');
  end if;

  -- 4. Get the guessed word's vector
  select embedding into v_guess_vector from dictionary where word = p_word;
  
  if v_guess_vector is null then
    return json_build_object('error', 'Palavra não encontrada no dicionário');
  end if;

  -- 5. Get the secret word's vector
  select d.embedding into v_secret_vector
  from rooms r
  join dictionary d on r.secret_word_id = d.id
  where r.id = p_room_id;

  -- 6. Calculate rank (count words closer to target than this guess)
  select count(*) + 1 into v_rank
  from dictionary
  where embedding <=> v_secret_vector < (v_guess_vector <=> v_secret_vector);

  -- 7. Check for collision with OTHER users only (multiplayer rule)
  select count(*) into v_other_guess_count
  from guesses
  where room_id = p_room_id 
    and word = p_word
    and user_id != p_user_id;  -- Only count guesses from OTHER users

  -- If another user already guessed this word, mark all instances as revealed
  if v_other_guess_count > 0 then
    update guesses set is_revealed = true 
    where room_id = p_room_id and word = p_word;
  end if;

  -- 8. Insert the guess
  insert into guesses (room_id, user_id, word, rank, is_revealed)
  values (p_room_id, p_user_id, p_word, v_rank, (v_other_guess_count > 0));

  -- 9. Check for winner (rank 1)
  if v_rank = 1 then
    v_is_winner := true;
    update rooms 
    set status = 'finished', winner_id = p_user_id
    where id = p_room_id;
  end if;

  return json_build_object(
    'success', true, 
    'rank', v_rank, 
    'revealed', (v_other_guess_count > 0),
    'is_winner', v_is_winner
  );
end;
$$ language plpgsql;

