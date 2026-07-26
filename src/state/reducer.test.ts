import { describe, it, expect } from 'vitest';
import { reducer } from './reducer';
import { initialState, type AppState } from './actions';
import type { Room } from './types';

function withRooms(rooms: Room[], overrides: Partial<AppState> = {}): AppState {
  return { ...initialState, rooms, ...overrides };
}

describe('reducer', () => {
  it('LOAD_MANIFEST replaces rooms and marks the state as loaded', () => {
    const rooms: Room[] = [{ id: 'r1', name: 'Salon', items: [] }];
    const next = reducer(initialState, { type: 'LOAD_MANIFEST', manifest: { version: 1, rooms } });
    expect(next.rooms).toBe(rooms);
    expect(next.loaded).toBe(true);
  });

  it('GO_TO switches the current screen', () => {
    const next = reducer(initialState, { type: 'GO_TO', screen: 'review' });
    expect(next.screen).toBe('review');
  });

  it('SET_NEW_ROOM_NAME updates the draft room name', () => {
    const next = reducer(initialState, { type: 'SET_NEW_ROOM_NAME', name: 'Véranda' });
    expect(next.newRoomName).toBe('Véranda');
  });

  describe('ADD_ROOM', () => {
    it('adds a trimmed room with a generated id and empty items', () => {
      const next = reducer(initialState, { type: 'ADD_ROOM', name: '  Salon  ' });
      expect(next.rooms).toHaveLength(1);
      expect(next.rooms[0]).toMatchObject({ name: 'Salon', items: [] });
      expect(next.rooms[0].id).toEqual(expect.any(String));
      expect(next.newRoomName).toBe('');
    });

    it('ignores an empty/whitespace-only name', () => {
      const next = reducer(initialState, { type: 'ADD_ROOM', name: '   ' });
      expect(next).toBe(initialState);
    });

    it('is case-insensitively deduped and just clears the draft name', () => {
      const state = withRooms([{ id: 'r1', name: 'Salon', items: [] }]);
      const next = reducer(state, { type: 'ADD_ROOM', name: 'SALON' });
      expect(next.rooms).toHaveLength(1);
      expect(next.newRoomName).toBe('');
    });
  });

  describe('REMOVE_ROOM', () => {
    it('removes the room by id', () => {
      const state = withRooms([{ id: 'r1', name: 'Salon', items: [] }, { id: 'r2', name: 'Cuisine', items: [] }]);
      const next = reducer(state, { type: 'REMOVE_ROOM', roomId: 'r1' });
      expect(next.rooms.map((r) => r.id)).toEqual(['r2']);
    });

    it('clears currentRoomId when the removed room was open', () => {
      const state = withRooms([{ id: 'r1', name: 'Salon', items: [] }], { currentRoomId: 'r1' });
      const next = reducer(state, { type: 'REMOVE_ROOM', roomId: 'r1' });
      expect(next.currentRoomId).toBeNull();
    });

    it('leaves currentRoomId untouched when a different room is removed', () => {
      const state = withRooms(
        [{ id: 'r1', name: 'Salon', items: [] }, { id: 'r2', name: 'Cuisine', items: [] }],
        { currentRoomId: 'r2' },
      );
      const next = reducer(state, { type: 'REMOVE_ROOM', roomId: 'r1' });
      expect(next.currentRoomId).toBe('r2');
    });
  });

  it('OPEN_ROOM sets currentRoomId and navigates to the items screen', () => {
    const next = reducer(initialState, { type: 'OPEN_ROOM', roomId: 'r1' });
    expect(next.currentRoomId).toBe('r1');
    expect(next.screen).toBe('items');
  });

  describe('ADD_ITEMS', () => {
    it('appends items with empty fields to the target room only', () => {
      const state = withRooms([{ id: 'r1', name: 'Salon', items: [] }, { id: 'r2', name: 'Cuisine', items: [] }]);
      const next = reducer(state, { type: 'ADD_ITEMS', roomId: 'r1', items: [{ id: 'i1', photoFile: 'i1.jpg' }] });
      expect(next.rooms.find((r) => r.id === 'r1')!.items).toEqual([{ id: 'i1', photoFile: 'i1.jpg', fields: {} }]);
      expect(next.rooms.find((r) => r.id === 'r2')!.items).toEqual([]);
    });

    it('appends to any existing items rather than replacing them', () => {
      const state = withRooms([{ id: 'r1', name: 'Salon', items: [{ id: 'i0', photoFile: 'i0.jpg', fields: { nom: 'x' } }] }]);
      const next = reducer(state, { type: 'ADD_ITEMS', roomId: 'r1', items: [{ id: 'i1', photoFile: 'i1.jpg' }] });
      expect(next.rooms[0].items).toHaveLength(2);
    });
  });

  describe('DELETE_ITEM', () => {
    it('removes only the targeted item from the targeted room', () => {
      const state = withRooms([
        { id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: '', fields: {} }, { id: 'i2', photoFile: '', fields: {} }] },
      ]);
      const next = reducer(state, { type: 'DELETE_ITEM', roomId: 'r1', itemId: 'i1' });
      expect(next.rooms[0].items.map((it) => it.id)).toEqual(['i2']);
    });
  });

  describe('SET_ITEM_FIELDS', () => {
    it('replaces the fields of the matching item', () => {
      const state = withRooms([{ id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: '', fields: {} }] }]);
      const next = reducer(state, { type: 'SET_ITEM_FIELDS', roomId: 'r1', itemId: 'i1', fields: { nom: 'Canapé' } });
      expect(next.rooms[0].items[0].fields).toEqual({ nom: 'Canapé' });
    });

    it('leaves other items in the room untouched', () => {
      const state = withRooms([
        { id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: '', fields: {} }, { id: 'i2', photoFile: '', fields: { nom: 'keep' } }] },
      ]);
      const next = reducer(state, { type: 'SET_ITEM_FIELDS', roomId: 'r1', itemId: 'i1', fields: { nom: 'changed' } });
      expect(next.rooms[0].items[1].fields).toEqual({ nom: 'keep' });
    });
  });

  it('RESET_ALL clears rooms, currentRoomId and returns to the welcome screen', () => {
    const state = withRooms([{ id: 'r1', name: 'Salon', items: [] }], { currentRoomId: 'r1', screen: 'export' });
    const next = reducer(state, { type: 'RESET_ALL' });
    expect(next.rooms).toEqual([]);
    expect(next.currentRoomId).toBeNull();
    expect(next.screen).toBe('welcome');
  });

  it('returns the same state reference for an unrecognized action', () => {
    // @ts-expect-error - intentionally testing the default branch with an action type that doesn't exist
    expect(reducer(initialState, { type: 'NOPE' })).toBe(initialState);
  });
});
