export type ThemeMode = 'light' | 'dark';

export type CameraZone = 'overview' | 'workspace' | 'lounge';

export type PanelId = 'profile' | 'link' | 'feed' | 'music' | 'search' | null;

export type ProfileTab = 'about' | 'github';

export type RoomCommand = 'overview' | 'open-profile' | 'focus-bookshelf' | 'open-music';

export type RoomObjectId =
  | 'monitor'
  | 'laptop'
  | 'portrait'
  | 'bookshelf'
  | 'weather-doll'
  | 'gramophone'
  | 'keyboard'
  | 'mouse'
  | 'wall-switch'
  | 'desk-lamp'
  | 'door'
  | 'window'
  | 'curtains'
  | 'air-conditioner'
  | 'fan'
  | 'clock'
  | 'desk-drawer'
  | 'office-chair'
  | 'sofa'
  | 'bed'
  | 'coffee'
  | 'plant'
  | 'profile-doll'
  | 'doll-eraser';

export interface RoomObjectDefinition {
  id: RoomObjectId;
  label: string;
  zone: CameraZone;
}

export interface RoomObjectState {
  airConditionerOn: boolean;
  chairOut: boolean;
  clockRunning: boolean;
  coffeeSteaming: boolean;
  curtainsOpen: boolean;
  cushionPulse: number;
  quiltFolded: boolean;
  deskLampOn: boolean;
  doorOpen: boolean;
  drawerOpen: boolean;
  fanSpeed: 0 | 1 | 2;
  monitorOn: boolean;
  plantPulse: number;
  weatherDollPulse: number;
  windowOpen: boolean;
}
