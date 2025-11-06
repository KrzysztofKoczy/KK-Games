import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'games_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Test connection
export async function setupDatabase() {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected');
    client.release();
    
    // Utworzenie tabel (jeśli nie istnieją)
    await createTables();
    
    return pool;
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error);
    throw error;
  }
}

async function createTables() {
  const client = await pool.connect();
  try {
    // Tabela dla użytkowników (dla przyszłości - logowanie email + hasło)
    // Obecnie używamy tylko Guest Mode, ale struktura gotowa na przyszłość
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        guest_token VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);

    // UWAGA: Sesje gier są obecnie przechowywane TYLKO w pamięci (Map w socketHandler.js)
    // Tabele poniżej są przygotowane na przyszłość, jeśli będzie potrzeba zapisywania historii
    // W przyszłości można zmienić implementację aby zapisywać sesje do bazy
    
    // Tabela dla sesji gier (na przyszłość - jeśli będzie potrzeba historii)
    await client.query(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id SERIAL PRIMARY KEY,
        game_type VARCHAR(50) NOT NULL,
        room_id VARCHAR(100) UNIQUE NOT NULL,
        created_by VARCHAR(255),
        max_players INTEGER DEFAULT 12,
        current_players INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'waiting',
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela dla graczy w sesjach (na przyszłość)
    await client.query(`
      CREATE TABLE IF NOT EXISTS game_players (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES game_sessions(id) ON DELETE CASCADE,
        player_token VARCHAR(255) NOT NULL,
        player_name VARCHAR(100),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        score INTEGER DEFAULT 0,
        UNIQUE(session_id, player_token)
      )
    `);

    // Tabela dla historii gier (na przyszłość - obecnie nie używana)
    await client.query(`
      CREATE TABLE IF NOT EXISTS game_history (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES game_sessions(id) ON DELETE SET NULL,
        game_type VARCHAR(50) NOT NULL,
        winner_token VARCHAR(255),
        final_scores JSONB,
        ended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables created/verified (prepared for future use)');
    console.log('ℹ️  Note: Game sessions are currently stored in memory only');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

export { pool };

