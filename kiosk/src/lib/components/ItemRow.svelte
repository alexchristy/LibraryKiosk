<script lang="ts">
  import type { ScannedItem } from '$lib/stores/session';

  export let item: ScannedItem;

  const labels: Record<string, { text: string; cls: string }> = {
    checked_out: { text: 'Checked Out', cls: 'out' },
    checked_in:  { text: 'Checked In',  cls: 'in' },
    consumed:    { text: 'Taken',        cls: 'out' },
    already_scanned: { text: 'Already Scanned', cls: 'warn' },
    not_found:   { text: 'Not Found',   cls: 'error' },
    unavailable: { text: 'Unavailable', cls: 'error' },
    other_user:  { text: 'Belongs to Another Student', cls: 'error' },
  };

  $: badge = labels[item.action] ?? { text: item.action, cls: 'warn' };
</script>

<div class="item-row" class:flash={true}>
  <div class="item-info">
    <span class="item-name">{item.name}</span>
    <span class="item-tag">{item.assetTag}</span>
    {#if item.category}
      <span class="item-cat">{item.category}</span>
    {/if}
  </div>
  <span class="badge {badge.cls}">{badge.text}</span>
</div>

<style>
  .item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-radius: 12px;
    background: #f8f9fa;
    border-left: 6px solid #ccc;
    gap: 1rem;
    animation: slideIn 0.25s ease-out;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .item-info { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }

  .item-name { font-size: 1.3rem; font-weight: 700; color: #1a1a2e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item-tag  { font-size: 1rem; color: #666; font-family: monospace; }
  .item-cat  { font-size: 0.9rem; color: #888; }

  .badge {
    font-size: 1rem;
    font-weight: 700;
    padding: 0.4rem 0.9rem;
    border-radius: 999px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .badge.out   { background: #fff3cd; color: #856404; }
  .badge.in    { background: #d1e7dd; color: #0a5d37; }
  .badge.warn  { background: #fff3cd; color: #856404; }
  .badge.error { background: #f8d7da; color: #842029; }
</style>
