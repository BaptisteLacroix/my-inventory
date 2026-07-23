import type { AppState, Action } from './actions';

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_MANIFEST':
      return { ...state, rooms: action.manifest.rooms, loaded: true };

    case 'GO_TO':
      return { ...state, screen: action.screen };

    case 'SET_NEW_ROOM_NAME':
      return { ...state, newRoomName: action.name };

    case 'ADD_ROOM': {
      const name = action.name.trim();
      if (!name) return state;
      if (state.rooms.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
        return { ...state, newRoomName: '' };
      }
      const room = { id: crypto.randomUUID(), name, items: [] };
      return { ...state, rooms: [...state.rooms, room], newRoomName: '' };
    }

    case 'REMOVE_ROOM': {
      const rooms = state.rooms.filter((r) => r.id !== action.roomId);
      const currentRoomId = state.currentRoomId === action.roomId ? null : state.currentRoomId;
      return { ...state, rooms, currentRoomId };
    }

    case 'OPEN_ROOM':
      return { ...state, currentRoomId: action.roomId, screen: 'items' };

    case 'ADD_ITEMS': {
      const rooms = state.rooms.map((r) =>
        r.id === action.roomId
          ? { ...r, items: [...r.items, ...action.items.map((it) => ({ id: it.id, photoFile: it.photoFile, fields: {} }))] }
          : r,
      );
      return { ...state, rooms };
    }

    case 'DELETE_ITEM': {
      const rooms = state.rooms.map((r) =>
        r.id === action.roomId ? { ...r, items: r.items.filter((it) => it.id !== action.itemId) } : r,
      );
      return { ...state, rooms };
    }

    case 'SET_ITEM_FIELDS': {
      const rooms = state.rooms.map((r) =>
        r.id === action.roomId
          ? { ...r, items: r.items.map((it) => (it.id === action.itemId ? { ...it, fields: action.fields } : it)) }
          : r,
      );
      return { ...state, rooms };
    }

    case 'RESET_ALL':
      return { ...state, rooms: [], currentRoomId: null, screen: 'welcome' };

    default:
      return state;
  }
}
