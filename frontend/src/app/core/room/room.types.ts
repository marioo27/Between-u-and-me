export type GameId = 'nhie' | 'impostor' | 'whoami';

export type RoomPhase = 'lobby' | 'claim' | 'playing' | 'revealed' | 'ended';

export interface Seat {
  id: string;
  name: string;
}

export interface ImpostorSetup {
  selectedCategories: string[];
  selectedImpostors: number;
  chaos: boolean;
  hintMode: 'none' | 'hint' | 'category';
  orderMode: 'list' | 'random';
  discreet: boolean;
  locale: 'es' | 'en';
}

export interface ImpostorSeatSecret {
  isImpostor: boolean;
  revealWord: string | null;
  revealHintMode: 'none' | 'hint' | 'category';
  revealCategory: string | null;
  revealHintWord: string | null;
}

export interface PublicRoomState {
  code: string;
  game: GameId;
  phase: RoomPhase;
  hostDeviceId: string;
  seats: Seat[];
  claims: Record<string, string[]>;
  connectedCount: number;
  youAreHost: boolean;
  yourSeatIds: string[];
  nhie?: {
    phrase: string | null;
    category: string | null;
    index: number;
    total: number;
  };
  impostor?: {
    phase: 'reveal' | 'play' | 'revealed';
    revealIndex: number;
    revealOrder: string[];
    starterSeatId: string | null;
    impostorSeatIds: string[] | null;
    setup: ImpostorSetup;
    yourSecrets?: Record<string, ImpostorSeatSecret>;
  };
  whoami?: {
    phase: 'memorize' | 'play';
    memorizeIndex: number;
    visibleCharacters?: Record<string, { name: string; wiki?: string }>;
  };
}
