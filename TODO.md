# 📋 TODO - Do zrobienia w przyszłości

## Backend Routes

### Obecna sytuacja:
- Backend ma tylko endpoint `/health` w `server.js`
- Wszystkie funkcjonalności są przez Socket.io

### Do dodania:
- [ ] Struktura folderów `backend/src/routes/` dla Express routes
- [ ] Przykładowe routes:
  - [ ] GET `/api/rooms` - lista aktywnych pokoi (opcjonalnie)
  - [ ] GET `/api/rooms/:roomId` - informacje o pokoju
  - [ ] POST `/api/auth/login` - logowanie email + hasło (przyszłość)
  - [ ] POST `/api/auth/register` - rejestracja (przyszłość)
- [ ] Refaktoryzacja `server.js` - przenieść routes do osobnych plików

### Struktura (proponowana):
```
backend/src/
├── routes/
│   ├── index.js          # Główny router
│   ├── rooms.routes.js   # Routes dla pokoi
│   └── auth.routes.js    # Routes dla autentykacji (przyszłość)
└── ...
```

---

## Do zrobienia przez użytkownika:

- [ ] Nawigacja górna - layout z zakładkami
- [ ] Login Page - pełna implementacja (email + hasło)
- [ ] Shared Components - wspólne komponenty między grami

---

## Uwagi:
- Backend routes nie są wymagane do obecnej funkcjonalności (wszystko przez Socket.io)
- Można dodać później gdy będą potrzebne REST endpoints

