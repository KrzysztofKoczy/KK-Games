import { v4 as uuidv4 } from 'uuid';

// Przechowywanie aktywnych sesji gier w pamięci (Map)
// Sesje są przechowywane TYLKO w pamięci - nie zapisujemy do bazy danych
// W przyszłości można zmienić implementację aby zapisywać sesje do PostgreSQL
// roomId -> { players: [], gameState: {}, ... }
const activeGameRooms = new Map();

export function setupSocketIO(io) {
  io.on('connection', (socket) => {
    console.log(`👤 Client connected: ${socket.id}`);

    // Guest Mode - Dołączanie z tokenem
    socket.on('join-as-guest', async (data) => {
      const { token } = data;
      
      if (!token) {
        socket.emit('error', { message: 'Token wymagany' });
        return;
      }

      // Zapisz token w sesji socket
      socket.data.guestToken = token;
      socket.data.playerName = `Gracz ${token.substring(0, 8)}`;

      socket.emit('guest-joined', {
        token,
        playerName: socket.data.playerName,
        message: 'Połączono jako gość'
      });

      console.log(`🎮 Guest joined: ${token.substring(0, 8)}...`);
    });

    // Tworzenie nowej gry
    socket.on('create-game', async (data) => {
      const { gameType, maxPlayers = 12 } = data;
      const guestToken = socket.data.guestToken;

      if (!guestToken) {
        socket.emit('error', { message: 'Musisz być zalogowany jako gość' });
        return;
      }

      if (!gameType) {
        socket.emit('error', { message: 'Typ gry wymagany' });
        return;
      }

      // Generuj unikalny room ID
      const roomId = `${gameType}-${uuidv4().substring(0, 8)}`;

      // Utworzenie sesji w pamięci
      const gameRoom = {
        roomId,
        gameType,
        maxPlayers: Math.min(maxPlayers, 12), // Max 12 graczy
        players: [{
          token: guestToken,
          socketId: socket.id,
          name: socket.data.playerName,
          joinedAt: new Date()
        }],
        gameState: {
          status: 'waiting', // waiting, playing, finished
          currentRound: 0,
          // Dodatkowe stany gry będą zależeć od typu gry
        },
        createdAt: new Date()
      };

      activeGameRooms.set(roomId, gameRoom);

      // Dołącz socket do room
      socket.join(roomId);
      socket.data.currentRoom = roomId;

      socket.emit('game-created', {
        roomId,
        gameType,
        maxPlayers: gameRoom.maxPlayers
      });

      console.log(`🎮 Game created: ${roomId} by ${guestToken.substring(0, 8)}...`);
    });

    // Dołączanie do istniejącej gry
    socket.on('join-game', async (data) => {
      const { roomId } = data;
      const guestToken = socket.data.guestToken;

      if (!guestToken) {
        socket.emit('error', { message: 'Musisz być zalogowany jako gość' });
        return;
      }

      if (!roomId) {
        socket.emit('error', { message: 'Room ID wymagany' });
        return;
      }

      const gameRoom = activeGameRooms.get(roomId);

      if (!gameRoom) {
        socket.emit('error', { message: 'Gra nie istnieje' });
        return;
      }

      if (gameRoom.players.length >= gameRoom.maxPlayers) {
        socket.emit('error', { message: 'Gra jest pełna' });
        return;
      }

      // Sprawdź czy gracz już jest w grze
      const existingPlayer = gameRoom.players.find(p => p.token === guestToken);
      if (existingPlayer) {
        socket.emit('error', { message: 'Już jesteś w tej grze' });
        return;
      }

      // Dodaj gracza
      gameRoom.players.push({
        token: guestToken,
        socketId: socket.id,
        name: socket.data.playerName,
        joinedAt: new Date()
      });

      // Dołącz socket do room
      socket.join(roomId);
      socket.data.currentRoom = roomId;

      // Powiadom wszystkich w room (włącznie z nowym graczem)
      io.to(roomId).emit('player-joined', {
        roomId,
        player: {
          token: guestToken,
          name: socket.data.playerName
        },
        players: gameRoom.players.map(p => ({
          token: p.token,
          name: p.name
        })),
        totalPlayers: gameRoom.players.length,
        maxPlayers: gameRoom.maxPlayers
      });

      console.log(`👥 Player joined: ${roomId} - ${guestToken.substring(0, 8)}...`);
    });

    // Opuszczanie gry
    socket.on('leave-game', () => {
      const roomId = socket.data.currentRoom;
      if (!roomId) return;

      const gameRoom = activeGameRooms.get(roomId);
      if (!gameRoom) return;

      // Usuń gracza z room
      gameRoom.players = gameRoom.players.filter(
        p => p.socketId !== socket.id
      );

      socket.leave(roomId);
      socket.data.currentRoom = null;

      // Powiadom pozostałych graczy
      if (gameRoom.players.length > 0) {
        io.to(roomId).emit('player-left', {
          roomId,
          players: gameRoom.players.map(p => ({
            token: p.token,
            name: p.name
          })),
          totalPlayers: gameRoom.players.length
        });
      } else {
        // Jeśli nikt nie został, usuń room
        activeGameRooms.delete(roomId);
      }

      console.log(`👋 Player left: ${roomId}`);
    });

    // Generic game event handler (dla różnych typów gier)
    socket.on('game-action', (data) => {
      const roomId = socket.data.currentRoom;
      if (!roomId) {
        socket.emit('error', { message: 'Nie jesteś w żadnej grze' });
        return;
      }

      const gameRoom = activeGameRooms.get(roomId);
      if (!gameRoom) {
        socket.emit('error', { message: 'Gra nie istnieje' });
        return;
      }

      // Broadcast akcji do wszystkich w room (oprócz nadawcy)
      socket.to(roomId).emit('game-update', {
        ...data,
        fromPlayer: socket.data.guestToken
      });
    });

    // Rozłączenie
    socket.on('disconnect', () => {
      const roomId = socket.data.currentRoom;
      if (roomId) {
        const gameRoom = activeGameRooms.get(roomId);
        if (gameRoom) {
          gameRoom.players = gameRoom.players.filter(
            p => p.socketId !== socket.id
          );

          if (gameRoom.players.length > 0) {
            io.to(roomId).emit('player-left', {
              roomId,
              players: gameRoom.players.map(p => ({
                token: p.token,
                name: p.name
              })),
              totalPlayers: gameRoom.players.length
            });
          } else {
            activeGameRooms.delete(roomId);
          }
        }
      }

      console.log(`👋 Client disconnected: ${socket.id}`);
    });
  });
}

// Export funkcji pomocniczych
export function getGameRoom(roomId) {
  return activeGameRooms.get(roomId);
}

export function getAllActiveRooms() {
  return Array.from(activeGameRooms.values());
}

