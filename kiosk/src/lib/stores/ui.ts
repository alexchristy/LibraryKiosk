import { writable } from 'svelte/store';

export const duplicateAlert = writable<string | null>(null);

let _timer: ReturnType<typeof setTimeout> | null = null;

export function flashDuplicate(itemName: string) {
  if (_timer) clearTimeout(_timer);
  duplicateAlert.set(itemName);
  _timer = setTimeout(() => duplicateAlert.set(null), 2500);
}
