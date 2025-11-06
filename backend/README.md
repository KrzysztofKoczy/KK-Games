# Backend - Games App

Backend serwer dla aplikacji gier multiplayer.

## Stack
- Node.js + Express
- Socket.io (WebSocket)
- PostgreSQL

## Instalacja

```bash
npm install
```

## Konfiguracja

1. Skopiuj `env.example.txt` do `.env` (opcjonalnie)
2. PostgreSQL **NIE jest wymagany** - sesje są przechowywane w pamięci
3. Jeśli chcesz skonfigurować PostgreSQL (opcjonalnie):
```sql
CREATE DATABASE games_app;
```

## Uruchomienie

```bash
# Development (z auto-reload)
npm run dev

# Production
npm start
```

Serwer uruchomi się na `http://localhost:3000`

## API Endpoints

- `GET /health` - Status serwera

## Socket.io Events

### Client → Server:
- `join-as-guest` - Dołącz jako gość (z tokenem)
- `create-game` - Utwórz nową grę
- `join-game` - Dołącz do istniejącej gry
- `leave-game` - Opuść grę
- `game-action` - Akcja w grze (broadcast)

### Server → Client:
- `guest-joined` - Potwierdzenie dołączenia jako gość
- `game-created` - Potwierdzenie utworzenia gry
- `player-joined` - Nowy gracz dołączył
- `player-left` - Gracz opuścił
- `game-update` - Aktualizacja stanu gry
- `error` - Błąd

## Struktura

```
src/
├── config/      # Konfiguracja (DB)
├── sockets/     # Socket.io handlers
├── routes/      # Express routes (do zrobienia - zobacz TODO.md)
├── services/    # Business logic (do zrobienia)
└── utils/       # Helpers (do zrobienia)
```

**Uwaga:** Obecnie wszystkie funkcjonalności działają przez Socket.io. Express routes będą dodane później gdy będą potrzebne (zobacz główny `TODO.md`).

