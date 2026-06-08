import { writable, derived } from 'svelte/store';

export type ItemAction = 'checked_out' | 'checked_in' | 'already_scanned' | 'not_found' | 'unavailable' | 'other_user';

export interface ScannedItem {
  assetId: number;
  assetTag: string;
  name: string;
  category: string;
  action: ItemAction;
  timestamp: number;
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

  function clearTimers() {
    if (finishTimer) clearTimeout(finishTimer);
    if (resetTimer)  clearTimeout(resetTimer);
    finishTimer = null;
    resetTimer  = null;
  }

  function scheduleTimers() {
    clearTimers();
    update(s => ({ ...s, showFinish: false, lastActivity: Date.now() }));

    finishTimer = setTimeout(() => {
      update(s => ({ ...s, showFinish: true }));
    }, FINISH_DELAY);

    resetTimer = setTimeout(() => {
      reset();
    }, RESET_DELAY);
  }

  function startSession(user: SessionUser) {
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
    clearTimers();
    update(s => ({ ...s, phase: 'complete', showFinish: false }));
    setTimeout(() => reset(), 4000);
  }

  function reset() {
    clearTimers();
    set({ ...initial, lastActivity: Date.now() });
  }

  return { subscribe, startSession, recordActivity, addItem, finish, reset };
}

export const session = createSession();

export const scannedTagSet = derived(session, $s => new Set($s.items.map(i => i.assetTag)));
