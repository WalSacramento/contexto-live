-- =============================================
-- Contexto Live - Initial Schema
-- =============================================

-- Enable pgvector extension
create extension if not exists vector;

-- =============================================
-- TABLES
-- =============================================

-- Dictionary: stores words and their embeddings
create table if not exists dictionary (
  id serial primary key,
  word text unique not null,
  embedding vector(1536) -- Compatible with OpenAI text-embedding-3-small
);

-- Create HNSW index for fast vector similarity search
create index if not exists dictionary_embedding_idx on dictionary using hnsw (embedding vector_cosine_ops);

-- Rooms: game sessions
create table if not exists rooms (
  id uuid default gen_random_uuid() primary key,
  secret_word_id int references dictionary(id),
  status text default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  winner_id text,
  created_at timestamptz default now()
);

-- Room Players: who is in each room
create table if not exists room_players (
  room_id uuid references rooms(id) on delete cascade,
  user_id text not null,
  nickname text not null,
  is_host boolean default false,
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);

-- Guesses: player attempts
create table if not exists guesses (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade,
  user_id text not null,
  word text not null,
  rank int not null,
  is_revealed boolean default false,
  created_at timestamptz default now()
);

-- =============================================
-- INDEXES
-- =============================================

create index if not exists guesses_room_id_idx on guesses(room_id);
create index if not exists guesses_word_idx on guesses(room_id, word);
create index if not exists room_players_room_id_idx on room_players(room_id);

-- =============================================
-- ENABLE REALTIME
-- =============================================

alter publication supabase_realtime add table guesses;
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table room_players;

-- =============================================
-- RPC FUNCTIONS
-- =============================================

-- Function: Create a new room
create or replace function create_room(
  p_user_id text,
  p_nickname text
) returns json as $$
declare
  v_room_id uuid;
begin
  -- Create the room
  insert into rooms (status)
  values ('waiting')
  returning id into v_room_id;

  -- Add the creator as host
  insert into room_players (room_id, user_id, nickname, is_host)
  values (v_room_id, p_user_id, p_nickname, true);

  return json_build_object('success', true, 'room_id', v_room_id);
end;
$$ language plpgsql;

-- Function: Join an existing room
create or replace function join_room(
  p_room_id uuid,
  p_user_id text,
  p_nickname text
) returns json as $$
declare
  v_room_status text;
  v_existing_player int;
begin
  -- Check if room exists and get status
  select status into v_room_status from rooms where id = p_room_id;
  
  if v_room_status is null then
    return json_build_object('error', 'Sala não encontrada');
  end if;

  -- Check if player is already in the room
  select count(*) into v_existing_player 
  from room_players 
  where room_id = p_room_id and user_id = p_user_id;

  if v_existing_player > 0 then
    -- Player is rejoining, just return success
    return json_build_object('success', true, 'room_status', v_room_status);
  end if;

  -- Add player to room
  insert into room_players (room_id, user_id, nickname, is_host)
  values (p_room_id, p_user_id, p_nickname, false);

  return json_build_object('success', true, 'room_status', v_room_status);
end;
$$ language plpgsql;

-- Function: Start the game (host only)
create or replace function start_game(
  p_room_id uuid,
  p_user_id text
) returns json as $$
declare
  v_is_host boolean;
  v_room_status text;
  v_secret_word_id int;
begin
  -- Check if user is host
  select is_host into v_is_host 
  from room_players 
  where room_id = p_room_id and user_id = p_user_id;

  if v_is_host is null or v_is_host = false then
    return json_build_object('error', 'Apenas o host pode iniciar o jogo');
  end if;

  -- Check room status
  select status into v_room_status from rooms where id = p_room_id;
  
  if v_room_status != 'waiting' then
    return json_build_object('error', 'O jogo já foi iniciado');
  end if;

  -- Select a random word from dictionary
  select id into v_secret_word_id 
  from dictionary 
  order by random() 
  limit 1;

  if v_secret_word_id is null then
    return json_build_object('error', 'Dicionário vazio. Execute o seed primeiro.');
  end if;

  -- Update room with secret word and status
  update rooms 
  set secret_word_id = v_secret_word_id, status = 'playing'
  where id = p_room_id;

  return json_build_object('success', true);
end;
$$ language plpgsql;

-- Function: Submit a guess
create or replace function submit_guess(
  p_room_id uuid, 
  p_user_id text, 
  p_word text
) returns json as $$
declare
  v_secret_vector vector(1536);
  v_guess_vector vector(1536);
  v_rank int;
  v_existing_guess_count int;
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

  -- 3. Get the guessed word's vector
  select embedding into v_guess_vector from dictionary where word = p_word;
  
  if v_guess_vector is null then
    return json_build_object('error', 'Palavra não encontrada no dicionário');
  end if;

  -- 4. Get the secret word's vector
  select d.embedding into v_secret_vector
  from rooms r
  join dictionary d on r.secret_word_id = d.id
  where r.id = p_room_id;

  -- 5. Calculate rank (count words closer to target than this guess)
  select count(*) + 1 into v_rank
  from dictionary
  where embedding <=> v_secret_vector < (v_guess_vector <=> v_secret_vector);

  -- 6. Check for collision (multiplayer rule)
  select count(*) into v_existing_guess_count
  from guesses
  where room_id = p_room_id and word = p_word;

  -- If already guessed, mark all instances as revealed
  if v_existing_guess_count > 0 then
    update guesses set is_revealed = true 
    where room_id = p_room_id and word = p_word;
  end if;

  -- 7. Insert the guess
  insert into guesses (room_id, user_id, word, rank, is_revealed)
  values (p_room_id, p_user_id, p_word, v_rank, (v_existing_guess_count > 0));

  -- 8. Check for winner (rank 1)
  if v_rank = 1 then
    v_is_winner := true;
    update rooms 
    set status = 'finished', winner_id = p_user_id
    where id = p_room_id;
  end if;

  return json_build_object(
    'success', true, 
    'rank', v_rank, 
    'revealed', (v_existing_guess_count > 0),
    'is_winner', v_is_winner
  );
end;
$$ language plpgsql;

-- Function: Get room details with players
create or replace function get_room_details(
  p_room_id uuid
) returns json as $$
declare
  v_room json;
  v_players json;
  v_guesses json;
begin
  -- Get room info
  select json_build_object(
    'id', r.id,
    'status', r.status,
    'winner_id', r.winner_id,
    'created_at', r.created_at,
    'secret_word', case when r.status = 'finished' then d.word else null end
  ) into v_room
  from rooms r
  left join dictionary d on r.secret_word_id = d.id
  where r.id = p_room_id;

  -- Get players
  select json_agg(json_build_object(
    'user_id', user_id,
    'nickname', nickname,
    'is_host', is_host,
    'joined_at', joined_at
  )) into v_players
  from room_players
  where room_id = p_room_id;

  -- Get guesses with player nicknames
  select json_agg(json_build_object(
    'id', g.id,
    'user_id', g.user_id,
    'word', g.word,
    'rank', g.rank,
    'is_revealed', g.is_revealed,
    'created_at', g.created_at,
    'nickname', rp.nickname
  ) order by g.created_at desc) into v_guesses
  from guesses g
  join room_players rp on g.room_id = rp.room_id and g.user_id = rp.user_id
  where g.room_id = p_room_id;

  return json_build_object(
    'room', v_room,
    'players', coalesce(v_players, '[]'::json),
    'guesses', coalesce(v_guesses, '[]'::json)
  );
end;
$$ language plpgsql;

-- Function: Get best rank in room (for progress bar)
create or replace function get_best_rank(
  p_room_id uuid
) returns int as $$
declare
  v_best_rank int;
begin
  select min(rank) into v_best_rank
  from guesses
  where room_id = p_room_id;
  
  return coalesce(v_best_rank, 0);
end;
$$ language plpgsql;

