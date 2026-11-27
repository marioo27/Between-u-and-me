export type GameId = 'nhie' | 'impostor' | 'whoami';

export type RoomPhase =
  | 'lobby'
  | 'claim'
  | 'playing'
  | 'revealed'
  | 'ended';

export interface Seat {
  id: string;
  name: string;
}

export interface NhiePublicState {
  phrase: string | null;
  category: string | null;
  index: number;
  total: number;
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

export interface ImpostorPublicState {
  phase: 'reveal' | 'play' | 'revealed';
  revealIndex: number;
  revealOrder: string[];
  starterSeatId: string | null;
  impostorSeatIds: string[] | null;
  setup: ImpostorSetup;
}

export interface WhoamiCharacter {
  name: string;
  wiki?: string;
}

export interface WhoAmIPublicState {
  phase: 'memorize' | 'play';
  memorizeIndex: number;
}

export interface Room {
  code: string;
  game: GameId;
  /** Host is a device, not a raw socket — survives reconnect. */
  hostDeviceId: string;
  phase: RoomPhase;
  seats: Seat[];
  /** deviceId → claimed seat ids */
  claims: Map<string, string[]>;
  /** socketId → deviceId */
  deviceBySocket: Map<string, string>;
  /** deviceId → current socketId (if online) */
  socketByDevice: Map<string, string>;
  createdAt: number;
  lastActiveAt: number;
  connectedSocketIds: Set<string>;
  nhie?: {
    locale: 'es' | 'en';
    deck: { text: string; category: string }[];
    index: number;
  };
  impostor?: {
    setup: ImpostorSetup;
    secrets: Map<string, ImpostorSeatSecret>;
    public: ImpostorPublicState;
  };
  whoami?: {
    locale: 'es' | 'en';
    characters: Map<string, WhoamiCharacter>;
    public: WhoAmIPublicState;
  };
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
  nhie?: NhiePublicState;
  impostor?: ImpostorPublicState & {
    yourSecrets?: Record<string, ImpostorSeatSecret>;
  };
  whoami?: WhoAmIPublicState & {
    visibleCharacters?: Record<string, WhoamiCharacter>;
  };
}
