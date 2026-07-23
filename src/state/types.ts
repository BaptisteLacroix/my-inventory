export type FieldKey =
  | 'nom'
  | 'prix'
  | 'date'
  | 'lieu'
  | 'dimensions'
  | 'serie'
  | 'note';

export type ItemFields = Partial<Record<FieldKey, string>>;

export interface Item {
  id: string;
  /** Filename relative to the inventory's images/ folder, e.g. "<itemId>.jpg". Never an absolute path. */
  photoFile: string;
  fields: ItemFields;
}

export interface Room {
  id: string;
  name: string;
  items: Item[];
}

export type Screen = 'welcome' | 'rooms' | 'items' | 'review' | 'export';

export interface InventoryManifest {
  version: 1;
  rooms: Room[];
}

export interface InventoryMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoriesIndex {
  inventories: InventoryMeta[];
  currentInventoryId: string | null;
}
