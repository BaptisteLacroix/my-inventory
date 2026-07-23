import type { FieldKey, Item, ItemFields } from '../state/types';

export const FIELDS: { key: FieldKey; label: string }[] = [
  { key: 'nom', label: "Nom de l'objet" },
  { key: 'prix', label: "Prix d'achat" },
  { key: 'date', label: "Date d'achat" },
  { key: 'lieu', label: "Lieu d'achat" },
  { key: 'dimensions', label: 'Dimensions' },
  { key: 'serie', label: 'N° de série / référence' },
  { key: 'note', label: 'Autres informations' },
];

export const SUGGESTED_ROOMS = [
  'Salon',
  'Cuisine',
  'Chambre',
  'Salle à manger',
  'Salle de bain',
  'Bureau',
  'Entrée',
  'Garage',
  'Cave',
  'Grenier',
];

function has(fields: ItemFields | undefined, key: FieldKey): boolean {
  const v = fields?.[key];
  return !!v && v.trim().length > 0;
}

export function itemTitle(item: Pick<Item, 'fields'>): string {
  const nom = item.fields.nom;
  return nom && nom.trim() ? nom.trim() : 'Objet sans nom';
}

export function itemSummary(item: Pick<Item, 'fields'>): string {
  const f = item.fields;
  const parts: string[] = [];
  if (f.prix) parts.push(f.prix);
  if (f.date) parts.push(f.date);
  if (f.lieu) parts.push(f.lieu);
  if (f.dimensions) parts.push(f.dimensions);
  if (parts.length) return parts.slice(0, 2).join(' · ');
  return f.note ? f.note.slice(0, 50) : '';
}

export function itemDetails(item: Pick<Item, 'fields'>): { label: string; value: string }[] {
  const f = item.fields;
  return FIELDS.filter((fd) => fd.key !== 'nom' && has(f, fd.key)).map((fd) => ({
    label: fd.label,
    value: (f[fd.key] ?? '').toString(),
  }));
}

export function itemNeedsInfo(item: Pick<Item, 'fields'>): boolean {
  const f = item.fields;
  return !FIELDS.some((fd) => has(f, fd.key));
}
