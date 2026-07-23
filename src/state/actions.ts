import type { Room, Screen, InventoryManifest, ItemFields } from './types';

export type Action =
  | { type: 'LOAD_MANIFEST'; manifest: InventoryManifest }
  | { type: 'GO_TO'; screen: Screen }
  | { type: 'SET_NEW_ROOM_NAME'; name: string }
  | { type: 'ADD_ROOM'; name: string }
  | { type: 'REMOVE_ROOM'; roomId: string }
  | { type: 'OPEN_ROOM'; roomId: string }
  | { type: 'ADD_ITEMS'; roomId: string; items: { id: string; photoFile: string }[] }
  | { type: 'DELETE_ITEM'; roomId: string; itemId: string }
  | { type: 'SET_ITEM_FIELDS'; roomId: string; itemId: string; fields: ItemFields }
  | { type: 'RESET_ALL' };

export interface AppState {
  screen: Screen;
  rooms: Room[];
  currentRoomId: string | null;
  newRoomName: string;
  loaded: boolean;
}

export const initialState: AppState = {
  screen: 'welcome',
  rooms: [],
  currentRoomId: null,
  newRoomName: '',
  loaded: false,
};
