# 🎮 Games App - Multiplayer Games Platform

Aplikacja gier multiplayer zbudowana w **Angular 20**, **Ionic 8**, **Node.js** i **PostgreSQL**.

## ✨ Funkcjonalności

- ✅ **Guest Mode** - Graj bez logowania (token-based)
- ✅ **Real-time multiplayer** - WebSocket przez Socket.io
- ✅ **System pokoi** - Każda gra = osobny room
- ✅ **Features-based architecture** - Każda gra jako osobny feature
- ✅ **Angular Signals** - Nowoczesne state management
- ✅ **RxJS** - Reactive programming
- ✅ **Routing** - Pełna nawigacja

## 🚀 Stack Technologiczny

### Frontend
- **Angular 20** - Framework
- **Ionic 8** - UI Components
- **Socket.io Client** - WebSocket
- **Angular Signals** - State management
- **RxJS** - Reactive streams

### Backend
- **Node.js** - Runtime
- **Express** - HTTP Server
- **Socket.io** - WebSocket Server
- **PostgreSQL** - Database

## 📁 Struktura Projektu

```
Ionic/
├── backend/              # Node.js server
│   ├── src/
│   │   ├── config/      # Database config
│   │   ├── sockets/     # Socket.io handlers
│   │   └── ...
│   └── server.js
│
├── frontend/             # Angular + Ionic app
│   ├── src/app/
│   │   ├── core/        # Services (auth, socket)
│   │   ├── features/    # Feature modules
│   │   │   ├── home/
│   │   │   ├── login/
│   │   │   └── kalambury/
│   │   └── ...
│   └── ...
│
└── Dokumentacja/
    ├── INSTALLATION_COMMANDS.md
    ├── TECHNICAL_EXPLANATIONS.md
    ├── PROJECT_SUMMARY.md
    └── ANALYSIS_REPORT.md
```

## 🛠️ Szybki Start

### 1. Instalacja wymagań

```powershell
# Node.js (v18+)
node --version

# PostgreSQL (opcjonalnie - nie wymagany)
# Jeśli chcesz skonfigurować:
# CREATE DATABASE games_app;
```

### 2. Backend

```powershell
cd backend
npm install

# Skopiuj env.example.txt jako .env (opcjonalnie)
# PostgreSQL nie jest wymagany - sesje w pamięci

npm run dev
# Backend: http://localhost:3000
```

### 3. Frontend

```powershell
cd frontend
npm install

ionic serve
# Frontend: http://localhost:8100
```

## 📚 Dokumentacja

- **[INSTALLATION_COMMANDS.md](INSTALLATION_COMMANDS.md)** - Kompletny przewodnik instalacji
- **[TECHNICAL_EXPLANATIONS.md](TECHNICAL_EXPLANATIONS.md)** - Wyjaśnienia techniczne
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Podsumowanie projektu
- **[ANALYSIS_REPORT.md](ANALYSIS_REPORT.md)** - Raport analizy struktury
- **[TODO.md](TODO.md)** - Lista rzeczy do zrobienia
- **[backend/README.md](backend/README.md)** - Dokumentacja backend

## 🎯 Jak to działa?

### Guest Mode
1. Użytkownik wchodzi na stronę
2. Automatycznie generowany token UUID
3. Token zapisany w localStorage
4. Socket.io łączy się z tokenem
5. Gotowy do gry!

### Multiplayer Game Flow
1. **Tworzenie gry:**
   - Użytkownik klika "Utwórz grę"
   - Serwer tworzy room z unikalnym ID
   - Socket.io dołącza do room

2. **Dołączanie:**
   - Użytkownik wprowadza kod gry
   - Socket.io dołącza do room
   - Wszyscy gracze widzą aktualizacje

3. **Gra w real-time:**
   - Akcje gracza → Socket.emit('game-action')
   - Serwer → Broadcast do wszystkich w room
   - Wszyscy widzą aktualizacje natychmiast

## 🎮 Gry

### Kalambury (Przykład)
- ✅ Lobby (tworzenie/dołączanie)
- ✅ Room z listą graczy
- 🔄 Canvas do rysowania (do implementacji)
- 🔄 System zgadywania (do implementacji)

### Dodawanie nowych gier
Każda gra jako osobny feature:
```
src/app/features/
├── kalambury/
│   ├── kalambury.routes.ts
│   ├── kalambury-lobby.page.ts
│   └── kalambury-game.page.ts
└── [nowa-gra]/
    └── ...
```

## 🔮 Przyszłe funkcjonalności

- [ ] Logowanie email + hasło
- [ ] Profile użytkowników
- [ ] Historia gier
- [ ] Rankingi
- [ ] Więcej gier
- [ ] Chat w czasie rzeczywistym
- [ ] Backend routes (zobacz [TODO.md](TODO.md))

## 📝 Licencja

Projekt prywatny - do użytku edukacyjnego.

---

**Gotowy do rozpoczęcia!** 🚀

Zobacz [INSTALLATION_COMMANDS.md](INSTALLATION_COMMANDS.md) dla szczegółowych instrukcji.

