export interface GameOption {
  value: string;
  label: string;
}

export const AVAILABLE_GAMES: GameOption[] = [
  { value: 'pictionary', label: '🎨 Pictionary' },
  { value: 'spy', label: '🕵️ Spy' }
];

