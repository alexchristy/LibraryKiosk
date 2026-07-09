<script lang="ts">
  import { session, scannedTagSet } from '$lib/stores/session';
  import ItemRow from './ItemRow.svelte';
  import type { ItemAction } from '$lib/stores/session';

  let scanBuffer = '';
  let scanTimeout: ReturnType<typeof setTimeout> | null = null;
  let scanning = false;
  let lastError = '';

  function showDuplicate(name: string, category: string, assetTag: string) {
    document.getElementById('dup-toast')?.remove();

    const categoryLabel = category || 'item';
    const el = document.createElement('div');
    el.id = 'dup-toast';
    el.innerHTML = `
      <div style="font-size:2.8rem;margin-bottom:0.5rem;line-height:1">⚠️</div>
      <div style="font-size:1.15rem;font-weight:600;opacity:0.9;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.08em">Already scanned this</div>
      <div style="font-size:2.2rem;font-weight:900;margin-bottom:0.5rem;line-height:1.15">${categoryLabel}</div>
      ${name !== assetTag ? `<div style="font-size:1.2rem;font-weight:500;opacity:0.85;margin-bottom:0.6rem">${name}</div>` : ''}
      <div style="font-size:1rem;font-family:monospace;background:rgba(0,0,0,0.25);padding:0.25rem 0.75rem;border-radius:6px;display:inline-block;letter-spacing:0.05em">${assetTag}</div>
    `;
    Object.assign(el.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) scale(0.9)',
      background: '#b91c1c',
      color: '#fff',
      padding: '2rem 3rem',
      borderRadius: '20px',
      textAlign: 'center',
      zIndex: '9999',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.15s ease, transform 0.15s ease',
      boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
      minWidth: '340px',
      maxWidth: '480px',
    });
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%, -50%) scale(0.9)';
      setTimeout(() => el.remove(), 200);
    }, 2500);
  }

  function showCheckedOut(assignedTo: string, name: string, category: string, assetTag: string) {
    document.getElementById('dup-toast')?.remove();

    const categoryLabel = category || 'item';
    const el = document.createElement('div');
    el.id = 'dup-toast';
    el.innerHTML = `
      <div style="font-size:2.8rem;margin-bottom:0.5rem;line-height:1">🔒</div>
      <div style="font-size:1.15rem;font-weight:600;opacity:0.9;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.08em">This ${categoryLabel} is checked out to</div>
      <div style="font-size:2.2rem;font-weight:900;margin-bottom:0.5rem;line-height:1.15">${assignedTo}</div>
      ${name !== assetTag ? `<div style="font-size:1.2rem;font-weight:500;opacity:0.85;margin-bottom:0.6rem">${name}</div>` : ''}
      <div style="font-size:1rem;font-family:monospace;background:rgba(0,0,0,0.25);padding:0.25rem 0.75rem;border-radius:6px;display:inline-block;letter-spacing:0.05em">${assetTag}</div>
    `;
    Object.assign(el.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) scale(0.9)',
      background: '#b91c1c',
      color: '#fff',
      padding: '2rem 3rem',
      borderRadius: '20px',
      textAlign: 'center',
      zIndex: '9999',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.15s ease, transform 0.15s ease',
      boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
      minWidth: '340px',
      maxWidth: '480px',
    });
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%, -50%) scale(0.9)';
      setTimeout(() => el.remove(), 200);
    }, 3500);
  }

  // Barcode scanners act as keyboard: rapid chars then Enter.
  // We capture globally so the input field never needs focus.
  function onKeydown(e: KeyboardEvent) {
    if ($session.phase !== 'scanning') return;

    // Suppress browser shortcuts
    if (e.ctrlKey || e.altKey || e.metaKey) { e.preventDefault(); return; }
    if (['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
         'Escape','Tab'].includes(e.key)) { e.preventDefault(); return; }

    if (e.key === 'Enter') {
      const tag = scanBuffer.trim();
      scanBuffer = '';
      if (tag) {
        processTag(tag);
      } else if ($session.showFinish) {
        session.finish();
      }
      return;
    }

    if (e.key.length === 1) {
      scanBuffer += e.key;
      // Debounce: if no Enter within 150ms assume manual typing — clear on long pause
      if (scanTimeout) clearTimeout(scanTimeout);
      scanTimeout = setTimeout(() => { scanBuffer = ''; }, 150);
    }
  }

  async function processTag(tag: string) {
    if (scanning) return;

    // Duplicate check
    if ($scannedTagSet.has(tag)) {
      const existing = $session.items.find(i => i.assetTag === tag);
      showDuplicate(existing?.name || tag, existing?.category || '', existing?.assetTag || tag);
      playTone('warn');
      return;
    }

    scanning = true;
    lastError = '';

    // Detect consumable QR codes: CONSUME-{id}
    const consumableMatch = tag.match(/^CONSUME-(\d+)$/i);

    if (consumableMatch) {
      try {
        const consumableId = parseInt(consumableMatch[1], 10);
        const res = await fetch('/api/scan-consumable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consumableId, userId: $session.user!.id }),
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          lastError = data.error ?? 'System error. Try again.';
          playTone('error');
          return;
        }

        const action: ItemAction = data.action;

        if (action === 'not_found' || action === 'unavailable') {
          session.addItem({
            assetId: data.assetId ?? 0,
            assetTag: data.assetTag ?? tag,
            name: data.name ?? tag,
            category: data.category ?? '',
            action,
            timestamp: Date.now(),
            itemType: 'consumable',
          });
          playTone('error');
          return;
        }

        session.addItem({
          assetId: data.assetId ?? 0,
          assetTag: data.assetTag ?? tag,
          name: data.name ?? tag,
          category: data.category ?? '',
          action,
          timestamp: Date.now(),
          itemType: 'consumable',
        });

        playTone('success');
      } catch {
        lastError = 'Cannot reach system. Check connection.';
        playTone('error');
      } finally {
        scanning = false;
      }
      return;
    }

    // Standard asset flow
    try {
      const res = await fetch('/api/scan-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetTag: tag, userId: $session.user!.id }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        lastError = data.error ?? 'System error. Try again.';
        playTone('error');
        return;
      }

      const action: ItemAction = data.action;

      if (action === 'other_user') {
        showCheckedOut(data.assignedTo ?? 'another student', data.name ?? tag, data.category ?? '', data.assetTag ?? tag);
        playTone('error');
        return;
      }

      session.addItem({
        assetId: data.assetId ?? 0,
        assetTag: data.assetTag ?? tag,
        name: data.name ?? tag,
        category: data.category ?? '',
        action,
        timestamp: Date.now(),
        itemType: 'asset',
      });

      playTone(action === 'checked_out' || action === 'checked_in' ? 'success' : 'error');
    } catch {
      lastError = 'Cannot reach system. Check connection.';
      playTone('error');
    } finally {
      scanning = false;
    }
  }

  // Web Audio API tones — no audio files needed
  function playTone(type: 'success' | 'warn' | 'error') {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'warn') {
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(); osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(); osc.stop(ctx.currentTime + 0.35);
      }
    } catch { /* audio not available */ }
  }

  $: timeLeft = Math.max(0, Math.ceil(
    ($session.lastActivity + (Number((typeof window !== 'undefined' && (window as any).__KIOSK_RESET_DELAY__) || 15000) - Date.now())) / 1000
  ));
</script>

<svelte:window on:keydown={onKeydown} />

<div class="scanning-screen">
  <header class="top-bar">
    <div class="student-info">
      <span class="label">Student</span>
      <span class="student-name">{$session.user?.name}</span>
      <span class="student-id">#{$session.user?.admissionNumber}</span>
    </div>
    <div class="scan-indicator" class:active={scanning}>
      {scanning ? 'Processing...' : 'Ready to Scan'}
    </div>
  </header>

  <div class="prompt">
    <div class="scan-icon">🔍</div>
    <p>Scan each item's barcode to check it out or in</p>
    {#if lastError}
      <p class="error-banner">{lastError}</p>
    {/if}
  </div>

  <div class="items-list">
    {#if $session.items.length === 0}
      <div class="empty-state">
        <p>No items scanned yet</p>
        <p class="empty-sub">Items will appear here as you scan them</p>
      </div>
    {:else}
      {#each $session.items as item (item.assetTag + item.timestamp)}
        <ItemRow {item} />
      {/each}
    {/if}
  </div>

  {#if $session.showFinish}
    <div class="finish-bar">
      <button class="finish-btn" on:click={() => session.finish()}>
        ✓ Finish &amp; Done
      </button>
      <p class="countdown-hint">Session closes automatically in a few seconds</p>
    </div>
  {/if}
</div>

<style>
  .scanning-screen {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 0;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background: #1a1a2e;
    color: white;
  }

  .student-info { display: flex; align-items: baseline; gap: 0.6rem; }
  .label { font-size: 0.9rem; color: #aaa; text-transform: uppercase; letter-spacing: 0.05em; }
  .student-name { font-size: 1.5rem; font-weight: 700; }
  .student-id { font-size: 1rem; color: #aaa; font-family: monospace; }

  .scan-indicator {
    font-size: 1rem;
    font-weight: 600;
    padding: 0.4rem 1rem;
    border-radius: 999px;
    background: #2d2d4e;
    color: #aaa;
    transition: all 0.2s;
  }
  .scan-indicator.active {
    background: #f59e0b;
    color: #1a1a2e;
    animation: pulse 0.5s infinite alternate;
  }
  @keyframes pulse { from { opacity: 0.8; } to { opacity: 1; } }

  .prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem;
    gap: 0.5rem;
    background: #f0f4ff;
    border-bottom: 2px solid #dde4ff;
  }

  .scan-icon { font-size: 2.5rem; }

  .prompt p {
    font-size: 1.2rem;
    color: #334;
    margin: 0;
    font-weight: 500;
  }

  .error-banner {
    background: #fee2e2;
    color: #991b1b;
    padding: 0.5rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 1rem !important;
  }

  .items-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 0.5rem;
    color: #aaa;
    padding: 3rem 0;
  }
  .empty-state p { font-size: 1.2rem; margin: 0; }
  .empty-sub { font-size: 1rem !important; }

  .finish-bar {
    padding: 1.25rem 1.5rem;
    background: white;
    border-top: 2px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
  }

  .finish-btn {
    font-size: 1.8rem;
    font-weight: 800;
    padding: 0.9rem 3rem;
    background: #16a34a;
    color: white;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    animation: appear 0.3s ease-out;
    transition: background 0.2s, transform 0.1s;
    width: 100%;
    max-width: 480px;
  }

  @keyframes appear {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .finish-btn:hover { background: #15803d; }
  .finish-btn:active { transform: scale(0.98); }

  .countdown-hint { font-size: 0.95rem; color: #888; margin: 0; }
</style>
