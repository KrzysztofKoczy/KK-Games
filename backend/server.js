import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setupSocketIO } from './src/sockets/socketHandler.js';
import { setupDatabase } from './src/config/database.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8100',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8100',
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Spy game - pobieranie miejsc
app.get('/api/spy/locations', (req, res) => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const locationsPath = join(__dirname, 'src', 'data', 'locations.json');
    const locationsData = JSON.parse(readFileSync(locationsPath, 'utf-8'));
    res.json({ locations: locationsData.locations });
  } catch (error) {
    console.error('Error loading locations:', error);
    res.status(500).json({ error: 'Nie udało się załadować miejsc' });
  }
});

// Socket.io setup
setupSocketIO(io);

// Database setup (opcjonalne - nie wymagane do działania)
// Sesje gier są przechowywane w pamięci, PostgreSQL jest tylko na przyszłość
setupDatabase()
  .then(() => {
    console.log('✅ Database connected (optional - for future use)');
    
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.io ready for connections`);
      console.log(`ℹ️  Game sessions stored in memory (no database required)`);
    });
  })
  .catch((error) => {
    console.warn('⚠️  Database connection failed (optional):', error.message);
    console.log('ℹ️  Server will continue without database (sessions in memory only)');
    
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.io ready for connections`);
      console.log(`ℹ️  Game sessions stored in memory only`);
    });
  });

