import { writable, derived } from 'svelte/store';

export type ItemAction = 'checked_out' | 'checked_in' | 'already_scanned' | 'not_found' | 'unavailable' | 'other_user' | 'consumed';

export interface ScannedItem {
  assetId: number;
  assetTag: string;
  name: string;
  category: string;
  action: ItemAction;
  timestamp: number;
  itemType: 'asset' | 'consumable';
}

export interface SessionUser {
  id: number;
  name: string;
  admissionNumber: string;
}

export type Phase = 'idle' | 'scanning' | 'complete';

interface SessionState {
  phase: Phase;
  user: SessionUser | null;
  items: ScannedItem[];
  lastActivity: number;
  showFinish: boolean;
}

let FINISH_DELAY = 5000;
let RESET_DELAY  = 15000;

export function setKioskConfig(finishDelay: number, resetDelay: number) {
  FINISH_DELAY = finishDelay;
  RESET_DELAY  = resetDelay;
}

const initial: SessionState = {
  phase: 'idle',
  user: null,
  items: [],
  lastActivity: Date.now(),
  showFinish: false,
};

function createSession() {
  const { subscribe, set, update } = writable<SessionState>({ ...initial });

  let finishTimer: ReturnType<typeof setTimeout> | null = null;
  let resetTimer:  ReturnType<typeof setTimeout> | null = null;
  let finishShown = false;

  function clearTimers() {
    if (finishTimer) clearTimeout(finishTimer);
    if (resetTimer)  clearTimeout(resetTimer);
    finishTimer = null;
    resetTimer  = null;
  }

  function scheduleTimers() {
    clearTimers();
    update(s => ({ ...s, lastActivity: Date.now() }));

    // Once the finish button has appeared, keep it visible for the rest of the session.
    if (!finishShown) {
      finishTimer = setTimeout(() => {
        finishShown = true;
        update(s => ({ ...s, showFinish: true }));
      }, FINISH_DELAY);
    }

    resetTimer = setTimeout(() => {
      reset();
    }, RESET_DELAY);
  }

  function startSession(user: SessionUser) {
    finishShown = false;
    set({ phase: 'scanning', user, items: [], lastActivity: Date.now(), showFinish: false });
    scheduleTimers();
  }

  function recordActivity() {
    scheduleTimers();
  }

  function addItem(item: ScannedItem) {
    update(s => ({ ...s, items: [item, ...s.items] }));
    scheduleTimers();
  }

  function finish() {
    finishShown = false;
    clearTimers();
    update(s => ({ ...s, phase: 'complete', showFinish: false }));
    setTimeout(() => reset(), 4000);
  }

  function reset() {
    finishShown = false;
    clearTimers();
    set({ ...initial, lastActivity: Date.now() });
  }

  return { subscribe, startSession, recordActivity, addItem, finish, reset };
}

export const session = createSession();

export const scannedTagSet = derived(session, $s => new Set($s.items.map(i => i.assetTag)));
