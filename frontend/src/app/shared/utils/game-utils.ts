/**
 * Wyciąga typ gry z roomId
 * Format: gameType-uuid (np. "spy-abc12345" lub "pictionary-xyz67890")
 */
export function extractGameTypeFromRoomId(roomId: string): string | null {
  if (!roomId) return null;
  
  const parts = roomId.split('-');
  if (parts.length < 2) return null;
  
  return parts[0]; // Pierwsza część to typ gry
}

