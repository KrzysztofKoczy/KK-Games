# Wyjaśnienia Techniczne

## 1. Jak działa WebSocket (Socket.io)?

### WebSocket - Podstawy
WebSocket to protokół komunikacji dwukierunkowej (full-duplex) przez pojedyncze połączenie TCP.

**Tradycyjny HTTP:**
```
Klient → Request → Serwer
Klient ← Response ← Serwer
[Połączenie zamykane]
```

**WebSocket:**
```
Klient ←→ Połączenie TCP (otwarte) ←→ Serwer
[Połączenie pozostaje otwarte]
[Serwer może wysyłać dane w dowolnym momencie]
[Klient może wysyłać dane w dowolnym momencie]
```

### Socket.io - Jak to działa?

Socket.io to biblioteka, która:
1. **Tworzy połączenie WebSocket** między klientem a serwerem
2. **Zarządza pokojami (rooms)** - grupy użytkowników
3. **Automatycznie reconnect** - jeśli połączenie się zerwie
4. **Fallback do HTTP** - jeśli WebSocket nie działa

### Przykład dla Twojej gry:

**Serwer (Node.js):**
```javascript
// Gracz dołącza do gry
socket.on('join-game', (gameId) => {
  socket.join(`game-${gameId}`); // Gracz dołącza do pokoju
});

// Gracz rysuje coś
socket.on('draw', (data) => {
  // Wysyłamy do WSZYSTKICH graczy w tym pokoju (oprócz nadawcy)
  io.to(`game-${gameId}`).emit('player-drawn', data);
});
```

**Klient (Angular):**
```typescript
// Łączymy się z serwerem
this.socket.connect();

// Dołączamy do gry
this.socket.emit('join-game', 'kalambury-123');

// Słuchamy aktualizacji od innych graczy
this.socket.on('player-drawn', (data) => {
  // Wyświetlamy rysunek innych graczy w real-time
  this.updateCanvas(data);
});
```

### Zalety dla Twojej aplikacji:
- ✅ **Real-time** - rysunek pojawia się natychmiast u wszystkich
- ✅ **Niska latencja** - bez opóźnień
- ✅ **Efektywne** - jeden kanał komunikacji
- ✅ **Synchronizacja** - wszyscy widzą to samo

---

## 2. Baza danych - Kiedy potrzebna?

### Obecna implementacja:

**Sesje gier:** 
- ✅ **Przechowywane TYLKO w pamięci** (Map w Node.js)
- ✅ Nie zapisujemy historii gier
- ✅ Sesje znikają po restarcie serwera (to jest OK dla obecnych wymagań)
- 💡 W przyszłości można zmienić implementację aby zapisywać do PostgreSQL

**PostgreSQL jest używany dla:**
- 🔮 **Przyszłość:** Logowanie email + hasło (struktura tabel gotowa)
- 🔮 **Przyszłość:** Profile użytkowników
- 🔮 **Przyszłość:** Historia gier (jeśli będzie potrzebna)

**Obecnie:**
- Guest Mode używa tylko localStorage (frontend)
- Sesje gier w pamięci serwera (backend)
- PostgreSQL nie jest wymagany do działania aplikacji (ale jest skonfigurowany)

### Opcje bazy danych (darmowe):

**MongoDB Atlas (Free Tier):**
- ✅ 512MB darmowej przestrzeni
- ✅ Wystarczy dla startu
- ✅ Cloud-based (nie trzeba hostować)
- ✅ Łatwa integracja z Node.js

**Alternatywa: SQLite (lokalnie):**
- ✅ Zero kosztów
- ✅ Plikowa baza (proste)
- ❌ Nie skalowalne dla wielu użytkowników
- ❌ Tylko lokalnie

**PostgreSQL (Lokalnie lub Supabase Free Tier):**
- ✅ Relacyjna baza danych (SQL)
- ✅ ACID compliance (niezawodność)
- ✅ Lepsze dla strukturalnych danych
- ✅ Masz już zainstalowane
- ✅ Darmowe (lokalnie) lub Supabase (cloud)
- ✅ Idealne dla użytkowników, sesji, historii gier

**Rekomendacja: PostgreSQL (używamy tego!)**

---

## 3. Co otrzymujemy przy której opcji?

### Opcja 1: Socket.io + Node.js + MongoDB Atlas
**Otrzymujesz:**
- ✅ Backend serwer w Node.js
- ✅ Real-time komunikacja (WebSocket)
- ✅ System pokoi (rooms) dla gier
- ✅ Autentykacja (email + hasło)
- ✅ Baza danych (MongoDB - darmowa)
- ✅ Skalowalne (do 12 graczy bez problemu)
- ✅ Pełna kontrola

**Koszty:** $0 (darmowe)

### Opcja 2: Firebase
**Otrzymujesz:**
- ✅ Backend automatyczny
- ✅ Real-time database
- ✅ Autentykacja wbudowana
- ❌ Mniej kontroli
- ❌ Koszty po przekroczeniu free tier

**Koszty:** $0 na start, później może kosztować

### Opcja 3: Supabase
**Otrzymujesz:**
- ✅ Podobne do Firebase
- ✅ Open-source
- ✅ PostgreSQL
- ✅ Więcej kontroli niż Firebase

**Koszty:** $0 (generous free tier)

**Rekomendacja dla Ciebie: Opcja 1 (Socket.io + Node.js + MongoDB)**

---

## 4. Offline Support - Co to jest?

**Offline Support** = aplikacja działa nawet bez internetu

**Przykład:**
- Otwierasz aplikację w metrze (bez internetu)
- Możesz przeglądać historię gier (zapisane lokalnie)
- Gdy internet wróci, synchronizacja automatyczna

**Dla Twojej aplikacji:**
- ❌ **NIE jest potrzebne** - gry multiplayer wymagają internetu
- ✅ Możesz dodać później (cache lokalny dla historii)

---

## 5. Guest Mode (Bez logowania) - Świetny pomysł!

### Jak to działa:

**Każdy użytkownik dostaje:**
- Unikalny token (UUID) przy pierwszym wejściu
- Token zapisany w localStorage przeglądarki
- Automatyczna identyfikacja przez token

**Przykład implementacji:**

```typescript
// Przy pierwszym wejściu
const guestToken = localStorage.getItem('guestToken') || generateUUID();
localStorage.setItem('guestToken', guestToken);

// Wysyłamy token do serwera
socket.emit('join-as-guest', { token: guestToken });
```

**Zalety:**
- ✅ Zero barier wejścia (od razu gra)
- ✅ Prostsze na początek
- ✅ Można dodać logowanie później
- ✅ Użytkownicy mogą "upgrade" konto gościa do pełnego

**Wady:**
- ❌ Brak historii między urządzeniami
- ❌ Utrata danych przy czyszczeniu przeglądarki

### Rekomendacja: ZACZYNAJ OD GUEST MODE!

**Plan:**
1. **Faza 1:** Guest mode (token w localStorage)
2. **Faza 2:** Opcjonalne logowanie (upgrade konta gościa)
3. **Faza 3:** Pełne konto z historią

---

## FINALNA REKOMENDACJA

### Stack Technologiczny:

**Frontend:**
- Angular 20 + Ionic
- Angular Signals
- RxJS
- Socket.io Client

**Backend:**
- Node.js + Express
- Socket.io (WebSocket server)
- PostgreSQL (lokalnie lub Supabase)
- JWT dla tokenów (opcjonalnie, nawet dla guest)

**Architektura:**
- Guest Mode (token-based) na start
- Opcjonalne logowanie później
- Socket.io rooms dla każdej gry
- Features-based structure w Angular

**Koszty:** $0 (wszystko darmowe)

---

## Struktura Sesji Gry

### Jak to będzie działać:

1. **Użytkownik wchodzi (Guest):**
   ```
   → Generuje token (lub używa istniejącego)
   → Token zapisany w localStorage
   → Socket.io łączy się z tokenem
   ```

2. **Tworzenie/Dołączanie do gry:**
   ```
   → Użytkownik wybiera grę (np. "Kalambury")
   → Klik "Stwórz grę" → Serwer tworzy room z ID
   → Klik "Dołącz do gry" → Użytkownik podaje kod gry
   → Socket.io dołącza do room
   ```

3. **Gra w real-time:**
   ```
   → Gracz rysuje → Socket.emit('draw', data)
   → Serwer → Broadcast do wszystkich w room
   → Wszyscy widzą rysunek w real-time
   ```

4. **Zarządzanie sesją:**
   ```
   - Serwer przechowuje stan gry TYLKO w pamięci (Map w Node.js)
   - Nie zapisujemy historii - sesje znikają po restarcie serwera
   - W przyszłości można zmienić aby zapisywać do PostgreSQL
   - Max 12 graczy w room (sprawdzenie przed dołączeniem)
   ```

---

## Pytania do Ciebie:

1. **Czy zaczynamy od Guest Mode?** (Rekomendacja: TAK)
2. **Czy akceptujesz MongoDB Atlas (Free)?** (Rekomendacja: TAK)
3. **Czy Socket.io + Node.js jest OK?** (Rekomendacja: TAK)

Po potwierdzeniu → Stworzę pełną strukturę projektu i komendy instalacji! 🚀

