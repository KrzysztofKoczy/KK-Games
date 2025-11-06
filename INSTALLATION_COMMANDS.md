# Komendy Instalacji - Krok po Kroku

## ✅ Co zostało przygotowane:

1. ✅ Struktura projektu (backend + frontend)
2. ✅ Backend: Node.js + Express + Socket.io + PostgreSQL
3. ✅ Frontend: Angular 20 + Ionic 8 + Socket.io Client
4. ✅ Guest Mode (token-based authentication)
5. ✅ Features-based architecture
6. ✅ Routing i Navigation
7. ✅ Przykładowa gra (Kalambury) - struktura gotowa

---

## 🚀 KROK 1: Instalacja narzędzi (jeśli nie masz)

```powershell
# Sprawdź czy masz Node.js (v18+)
node --version

# Sprawdź npm
npm --version

# Instalacja Angular CLI (jeśli nie masz)
npm install -g @angular/cli@latest

# Instalacja Ionic CLI (jeśli nie masz)
npm install -g @ionic/cli@latest
```

---

## 🗄️ KROK 2: Konfiguracja PostgreSQL (Opcjonalne)

**UWAGA:** PostgreSQL nie jest wymagany do działania aplikacji!
- Sesje gier są przechowywane w pamięci (nie zapisujemy historii)
- PostgreSQL jest przygotowany na przyszłość (logowanie email + hasło)

Jeśli chcesz skonfigurować PostgreSQL (opcjonalnie):
```sql
-- Połącz się z PostgreSQL (psql lub pgAdmin)
-- Uruchom:

CREATE DATABASE games_app;

-- Sprawdź czy działa:
\c games_app
```

**Jeśli nie masz PostgreSQL lub nie chcesz go konfigurować:**
- Możesz pominąć ten krok
- Backend będzie działał, ale połączenie z bazą zwróci błąd (to nie blokuje działania)
- Możesz później dodać PostgreSQL gdy będziesz potrzebować logowania

---

## 🔧 KROK 3: Backend - Instalacja i konfiguracja

```powershell
# Przejdź do folderu backend
cd backend

# Instalacja zależności
npm install

# Skopiuj plik env.example.txt jako .env
# W Windows PowerShell:
Copy-Item env.example.txt .env

# Edytuj .env i uzupełnij:
# - DB_PASSWORD (twoje hasło PostgreSQL) - OPcJONALNE
# - JWT_SECRET (wygeneruj losowy klucz) - OPcJONALNE (na przyszłość)
```

**Plik .env powinien wyglądać tak:**
```env
PORT=3000
NODE_ENV=development

# PostgreSQL (opcjonalne - nie wymagane do działania)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=games_app
DB_USER=postgres
DB_PASSWORD=twoje_haslo_tutaj

# JWT Secret (opcjonalne - na przyszłość dla logowania)
JWT_SECRET=losowy-klucz-tutaj-min-32-znaki

CORS_ORIGIN=http://localhost:8100
```

**UWAGA:** Jeśli nie masz PostgreSQL, możesz zostawić puste wartości - backend będzie działał, ale połączenie z bazą zwróci błąd (nie blokuje działania aplikacji).

**Uruchomienie backend:**
```powershell
# Development (z auto-reload)
npm run dev

# Backend będzie dostępny na http://localhost:3000
```

---

## 🎨 KROK 4: Frontend - Instalacja

```powershell
# Z głównego folderu Ionic/
cd frontend

# Instalacja zależności
npm install

# Uruchomienie aplikacji
ionic serve

# Aplikacja będzie dostępna na http://localhost:8100
```

---

## ✅ KROK 5: Testowanie

1. **Uruchom backend:**
   ```powershell
   cd backend
   npm run dev
   ```
   Powinieneś zobaczyć:
   ```
   ✅ PostgreSQL connected (jeśli skonfigurowane)
   ✅ Database tables created/verified (prepared for future use)
   ℹ️  Note: Game sessions are currently stored in memory only
   🚀 Server running on http://localhost:3000
   📡 Socket.io ready for connections
   ```
   
   **UWAGA:** Jeśli nie masz PostgreSQL, zobaczysz błąd połączenia, ale serwer i tak działa (sesje w pamięci).

2. **Uruchom frontend:**
   ```powershell
   cd frontend
   ionic serve
   ```
   Powinieneś zobaczyć:
   ```
   Angular Live Development Server is listening on localhost:8100
   ```

3. **Otwórz przeglądarkę:**
   - Przejdź do `http://localhost:8100`
   - Powinieneś zobaczyć stronę główną z przywitaniem
   - Status połączenia powinien pokazywać "✅ Połączono"

4. **Przetestuj Guest Mode:**
   - Automatycznie zostaniesz zalogowany jako gość
   - Token zostanie zapisany w localStorage
   - Sprawdź w DevTools (F12) → Application → Local Storage

5. **Przetestuj grę:**
   - Kliknij "Kalambury" na stronie głównej
   - Kliknij "Utwórz grę"
   - Powinieneś zostać przekierowany do gry z kodem room

---

## 🔍 Rozwiązywanie problemów

### Backend nie łączy się z PostgreSQL:
```powershell
# Sprawdź czy PostgreSQL działa
# Windows:
Get-Service -Name "*postgres*"

# Sprawdź connection string w .env
```

### Frontend nie łączy się z backend:
- Sprawdź czy backend działa na `http://localhost:3000`
- Sprawdź `CORS_ORIGIN` w `.env` backend
- Sprawdź `socketUrl` w `frontend/src/environments/environment.ts`

### Błędy kompilacji:
```powershell
# Wyczyść cache i zainstaluj ponownie
cd frontend
rm -r node_modules
rm package-lock.json
npm install
```

---

## 📁 Struktura Projektu

```
Ionic/
├── backend/
│   ├── src/
│   │   ├── config/database.js    # PostgreSQL config
│   │   └── sockets/socketHandler.js  # Socket.io handlers
│   ├── server.js                  # Entry point
│   ├── package.json
│   └── .env                       # (do utworzenia)
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/              # Services (auth, socket)
│   │   │   ├── features/          # Features (home, login, kalambury)
│   │   │   └── app.component.ts
│   │   ├── environments/
│   │   └── main.ts
│   └── package.json
│
├── INSTALLATION_COMMANDS.md        # Ten plik
├── SETUP_GUIDE.md
└── TECHNICAL_EXPLANATIONS.md
```

---

## 🎯 Następne kroki (po instalacji)

1. ✅ **Guest Mode działa** - użytkownicy mogą grać bez logowania
2. 🔄 **Dodaj funkcjonalność gry Kalambury:**
   - Canvas do rysowania
   - Synchronizacja rysunku przez Socket.io
   - System zgadywania
   - Punkty i ranking

3. 🔄 **Dodaj więcej gier** jako nowe features:
   - `src/app/features/[nazwa-gry]/`
   - Każda gra jako osobny feature module

4. 🔄 **Dodaj logowanie email + hasło** (w przyszłości):
   - Formularz logowania
   - Rejestracja
   - Upgrade konta gościa do pełnego konta

---

## 📚 Dokumentacja

- **Backend README:** `backend/README.md`
- **Wyjaśnienia techniczne:** `TECHNICAL_EXPLANATIONS.md`
- **Przewodnik setup:** `SETUP_GUIDE.md`

---

**Gotowy do instalacji!** 🚀

Wykonaj komendy powyżej i uruchom aplikację!

