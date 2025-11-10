import { v4 as uuidv4 } from 'uuid';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Przechowywanie aktywnych sesji gier w pamięci (Map)
// Sesje są przechowywane TYLKO w pamięci - nie zapisujemy do bazy danych
// W przyszłości można zmienić implementację aby zapisywać sesje do PostgreSQL
// roomId -> { players: [], gameState: {}, ... }
const activeGameRooms = new Map();

// Funkcja pomocnicza do losowania miejsca
function getRandomLocation() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const locationsPath = join(__dirname, '..', 'data', 'locations.json');
    const locationsData = JSON.parse(readFileSync(locationsPath, 'utf-8'));
    const locations = locationsData.locations;
    return locations[Math.floor(Math.random() * locations.length)];
  } catch (error) {
    console.error('Error loading locations:', error);
    return 'Nieznane miejsce';
  }
}

// Funkcja pomocnicza do losowania szpiegów
function selectRandomSpies(participants, spyCount) {
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, spyCount).map(p => p.token);
}

export function setupSocketIO(io) {
  io.on('connection', (socket) => {
    console.log(`👤 Client connected: ${socket.id}`);

    // Guest Mode - Dołączanie z tokenem
    socket.on('join-as-guest', async (data) => {
      const { token, name } = data;
      
      if (!token) {
        socket.emit('error', { message: 'Token wymagany' });
        return;
      }

      // Zapisz token w sesji socket
      socket.data.guestToken = token;
      // Użyj nazwy z frontendu lub wygeneruj domyślną
      socket.data.playerName = name || `Gracz ${token.substring(0, 8)}`;

      socket.emit('guest-joined', {
        token,
        playerName: socket.data.playerName,
        message: 'Połączono jako gość'
      });

      console.log(`🎮 Guest joined: ${socket.data.playerName} (${token.substring(0, 8)}...)`);
    });

    // Pobieranie listy otwartych lobby dla danego typu gry
    socket.on('get-open-lobbies', async (data) => {
      const { gameType } = data;
      
      if (!gameType) {
        socket.emit('error', { message: 'Typ gry wymagany' });
        return;
      }

      // Filtruj otwarte lobby (status: waiting lub configuring) dla danego typu gry
      const openLobbies = Array.from(activeGameRooms.values())
        .filter(room => 
          room.gameType === gameType && 
          (room.gameState.status === 'waiting' || room.gameState.status === 'configuring') &&
          room.players.length < room.maxPlayers
        )
        .map(room => ({
          roomId: room.roomId,
          gameType: room.gameType,
          currentPlayers: room.players.length,
          maxPlayers: room.maxPlayers,
          status: room.gameState.status,
          createdAt: room.createdAt
        }))
        .sort((a, b) => b.createdAt - a.createdAt); // Najnowsze na górze

      socket.emit('open-lobbies-list', {
        gameType,
        lobbies: openLobbies
      });
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
          status: 'waiting', // waiting, configuring, playing, finished
          currentRound: 0,
          // Założyciel lobby (pierwszy gracz) - dla wszystkich gier
          creator: guestToken,
          // Dla gry Spy
          ...(gameType === 'spy' && {
            gameMaster: guestToken,
            spyCount: null,
            selectedLocation: null,
            playerCards: new Map(), // token -> 'spy' | 'location'
            participants: [] // gracze uczestniczący (bez mistrza)
          })
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
        creator: guestToken,
        maxPlayers: gameRoom.maxPlayers
      });

      // Broadcast aktualizacji listy lobby dla wszystkich zainteresowanych tym typem gry
      io.emit('lobby-updated', { gameType });

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
        gameType: gameRoom.gameType,
        creator: gameRoom.gameState.creator,
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

      // Broadcast aktualizacji listy lobby
      io.emit('lobby-updated', { gameType: gameRoom.gameType });

      console.log(`👥 Player joined: ${roomId} - ${guestToken.substring(0, 8)}...`);
    });

    // Opuszczanie gry
    socket.on('leave-game', () => {
      const roomId = socket.data.currentRoom;
      if (!roomId) return;

      const gameRoom = activeGameRooms.get(roomId);
      if (!gameRoom) return;

      const guestToken = socket.data.guestToken;

      // Dla gry Spy - założyciel nie może opuścić gry
      if (gameRoom.gameType === 'spy' && gameRoom.gameState?.creator === guestToken) {
        socket.emit('error', { message: 'Założyciel gry nie może opuścić gry' });
        return;
      }

      // Usuń gracza z room
      gameRoom.players = gameRoom.players.filter(
        p => p.socketId !== socket.id
      );

      socket.leave(roomId);
      socket.data.currentRoom = null;

      // Powiadom pozostałych graczy
      const gameType = gameRoom.gameType;
      if (gameRoom.players.length > 0) {
        io.to(roomId).emit('player-left', {
          roomId,
          players: gameRoom.players.map(p => ({
            token: p.token,
            name: p.name
          })),
          totalPlayers: gameRoom.players.length
        });
        // Broadcast aktualizacji listy lobby
        io.emit('lobby-updated', { gameType });
      } else {
        // Jeśli nikt nie został, usuń room
        activeGameRooms.delete(roomId);
        // Broadcast aktualizacji listy lobby
        io.emit('lobby-updated', { gameType });
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

    // ========== SPY GAME EVENTS ==========

    // Konfiguracja gry Spy - ustawienie liczby szpiegów
    socket.on('spy-configure', (data) => {
      const { roomId, spyCount } = data;
      const guestToken = socket.data.guestToken;

      if (!guestToken) {
        socket.emit('error', { message: 'Musisz być zalogowany jako gość' });
        return;
      }

      const gameRoom = activeGameRooms.get(roomId);
      if (!gameRoom) {
        socket.emit('error', { message: 'Gra nie istnieje' });
        return;
      }

      if (gameRoom.gameType !== 'spy') {
        socket.emit('error', { message: 'To nie jest gra Spy' });
        return;
      }

      // Sprawdź czy to założyciel (mistrz gry)
      if (gameRoom.gameState.creator !== guestToken) {
        socket.emit('error', { message: 'Tylko założyciel gry może konfigurować' });
        return;
      }

      // Walidacja liczby szpiegów
      const participants = gameRoom.players.filter(p => p.token !== guestToken);
      if (spyCount <= 0 || spyCount >= participants.length) {
        socket.emit('error', { message: 'Liczba szpiegów musi być większa od 0 i mniejsza od liczby uczestników' });
        return;
      }

      // Zapisz konfigurację
      gameRoom.gameState.spyCount = spyCount;
      gameRoom.gameState.status = 'configuring';

      // Powiadom wszystkich
      io.to(roomId).emit('spy-configured', {
        roomId,
        spyCount,
        participants: participants.map(p => ({
          token: p.token,
          name: p.name
        }))
      });

      console.log(`🕵️ Spy game configured: ${roomId} - ${spyCount} szpiegów`);
    });

    // Start gry Spy
    socket.on('spy-start-game', (data) => {
      const { roomId } = data;
      const guestToken = socket.data.guestToken;

      if (!guestToken) {
        socket.emit('error', { message: 'Musisz być zalogowany jako gość' });
        return;
      }

      const gameRoom = activeGameRooms.get(roomId);
      if (!gameRoom) {
        socket.emit('error', { message: 'Gra nie istnieje' });
        return;
      }

      if (gameRoom.gameType !== 'spy') {
        socket.emit('error', { message: 'To nie jest gra Spy' });
        return;
      }

      // Sprawdź czy to założyciel (mistrz gry)
      if (gameRoom.gameState.creator !== guestToken) {
        socket.emit('error', { message: 'Tylko założyciel gry może rozpocząć grę' });
        return;
      }

      // Sprawdź minimum 4 graczy (włącznie z mistrzem = 5 osób)
      if (gameRoom.players.length < 5) {
        socket.emit('error', { message: 'Minimum 4 uczestników + mistrz gry (łącznie 5 osób)' });
        return;
      }

      // Sprawdź czy liczba szpiegów jest ustawiona
      if (!gameRoom.gameState.spyCount) {
        socket.emit('error', { message: 'Najpierw ustaw liczbę szpiegów' });
        return;
      }

      // Losuj miejsce
      const location = getRandomLocation();
      gameRoom.gameState.selectedLocation = location;

      // Pobierz uczestników (wszyscy oprócz mistrza)
      const participants = gameRoom.players.filter(p => p.token !== guestToken);
      gameRoom.gameState.participants = participants.map(p => ({
        token: p.token,
        name: p.name
      }));

      // Losuj szpiegów
      const spyTokens = selectRandomSpies(participants, gameRoom.gameState.spyCount);

      // Rozdaj karty
      gameRoom.gameState.playerCards.clear();
      participants.forEach(participant => {
        const card = spyTokens.includes(participant.token) ? 'spy' : 'location';
        gameRoom.gameState.playerCards.set(participant.token, card);
      });

      // Mistrz gry też dostaje kartę z miejscem
      gameRoom.gameState.playerCards.set(guestToken, 'location');

      // Zmień status
      gameRoom.gameState.status = 'playing';

      // Wyślij karty do każdego gracza osobno
      gameRoom.players.forEach(player => {
        const playerCard = gameRoom.gameState.playerCards.get(player.token);
        const socketId = player.socketId;
        
        // Uczestnicy z kartą 'location' widzą miejsce, szpiedzy nie
        const shouldSeeLocation = playerCard === 'location';
        
        io.to(socketId).emit('spy-game-started', {
          roomId,
          playerCard,
          location: shouldSeeLocation ? location : null,
          participants: gameRoom.gameState.participants
        });
      });

      console.log(`🕵️ Spy game started: ${roomId} - miejsce: ${location}`);
    });

    // Zakończenie gry Spy
    socket.on('spy-end-game', (data) => {
      const { roomId } = data;
      const guestToken = socket.data.guestToken;

      if (!guestToken) {
        socket.emit('error', { message: 'Musisz być zalogowany jako gość' });
        return;
      }

      const gameRoom = activeGameRooms.get(roomId);
      if (!gameRoom || gameRoom.gameType !== 'spy') {
        socket.emit('error', { message: 'Gra nie istnieje' });
        return;
      }

      // Sprawdź czy to założyciel (mistrz gry)
      if (gameRoom.gameState.creator !== guestToken) {
        socket.emit('error', { message: 'Tylko założyciel gry może zakończyć grę' });
        return;
      }

      // Zmień status
      gameRoom.gameState.status = 'finished';

      // Powiadom wszystkich
      io.to(roomId).emit('spy-game-ended', {
        roomId,
        location: gameRoom.gameState.selectedLocation,
        playerCards: Object.fromEntries(gameRoom.gameState.playerCards)
      });

      console.log(`🕵️ Spy game ended: ${roomId}`);
    });

    // Nowa gra Spy (restart z tymi samymi graczami)
    socket.on('spy-new-game', (data) => {
      const { roomId } = data;
      const guestToken = socket.data.guestToken;

      if (!guestToken) {
        socket.emit('error', { message: 'Musisz być zalogowany jako gość' });
        return;
      }

      const gameRoom = activeGameRooms.get(roomId);
      if (!gameRoom || gameRoom.gameType !== 'spy') {
        socket.emit('error', { message: 'Gra nie istnieje' });
        return;
      }

      // Sprawdź czy to założyciel (mistrz gry)
      if (gameRoom.gameState.creator !== guestToken) {
        socket.emit('error', { message: 'Tylko założyciel gry może rozpocząć nową grę' });
        return;
      }

      // Reset stanu gry
      gameRoom.gameState.status = 'waiting';
      gameRoom.gameState.spyCount = null;
      gameRoom.gameState.selectedLocation = null;
      gameRoom.gameState.playerCards.clear();
      gameRoom.gameState.participants = [];

      // Powiadom wszystkich
      io.to(roomId).emit('spy-game-reset', {
        roomId,
        players: gameRoom.players.map(p => ({
          token: p.token,
          name: p.name
        }))
      });

      console.log(`🕵️ Spy game reset: ${roomId}`);
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

