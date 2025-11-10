/**
 * Typy dla eventów Socket.io
 */

export interface Player {
  token: string;
  name: string;
}

export interface GameCreatedEvent {
  roomId: string;
  gameType: string;
  creator?: string;
  maxPlayers?: number;
}

export interface PlayerJoinedEvent {
  roomId: string;
  player: Player;
  players: Player[];
  creator?: string;
  gameType?: string;
}

export interface PlayerLeftEvent {
  roomId: string;
  player: Player;
  players: Player[];
}

export interface OpenLobby {
  roomId: string;
  gameType: string;
  currentPlayers: number;
  maxPlayers: number;
  status: string;
  createdAt: Date;
}

export interface OpenLobbiesListEvent {
  gameType: string;
  lobbies: OpenLobby[];
}

export interface LobbyUpdatedEvent {
  gameType: string;
  roomId?: string;
}

export interface ErrorEvent {
  message: string;
  code?: string;
}

// Eventy specyficzne dla gry Spy
export interface SpyConfiguredEvent {
  roomId: string;
  spyCount: number;
  participants: Player[];
}

export interface SpyGameStartedEvent {
  roomId: string;
  playerCard: 'spy' | 'location';
  location: string | null;
  participants: Player[];
}

export interface SpyGameEndedEvent {
  roomId: string;
}

export interface SpyGameResetEvent {
  roomId: string;
  players: Player[];
}

// Eventy specyficzne dla gry Pictionary
export interface PictionaryGameUpdateEvent {
  roomId: string;
  status: string;
  // Dodatkowe pola specyficzne dla Pictionary
}

