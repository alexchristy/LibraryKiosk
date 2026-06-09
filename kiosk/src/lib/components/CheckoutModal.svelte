<script lang="ts">
  export let onClose: () => void;

  interface CheckoutItem    { model: string; assetTag: string; }
  interface CheckoutStudent { name: string; username: string; items: CheckoutItem[]; }
  interface CheckoutCategory { name: string; students: CheckoutStudent[]; }

  let categories: CheckoutCategory[] = [];
  let activeCategory = '';
  let loading = true;
  let fetchError = '';

  async function load() {
    loading = true;
    fetchError = '';
    try {
      const res = await fetch('/api/checkout-report');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      categories = data.categories;
      activeCategory = categories[0]?.name ?? '';
    } catch {
      fetchError = 'Could not load checkout data. Check your connection.';
    } finally {
      loading = false;
    }
  }

  load();

  $: active = categories.find(c => c.name === activeCategory);
  $: totalOut = categories.reduce((n, c) => n + c.students.reduce((m, s) => m + s.items.length, 0), 0);
</script>

<!-- Backdrop -->
<div class="backdrop" on:click={onClose} role="presentation"></div>

<!-- Panel -->
<div class="panel">
  <div class="panel-header">
    <div class="header-left">
      <h2>Current Checkouts</h2>
      {#if !loading && !fetchError}
        <span class="total-badge">{totalOut} item{totalOut !== 1 ? 's' : ''} out</span>
      {/if}
    </div>
    <button class="close-btn" on:click={onClose}>✕</button>
  </div>

  {#if loading}
    <div class="state-msg">Loading…</div>

  {:else if fetchError}
    <div class="state-msg error">{fetchError}</div>

  {:else if categories.length === 0}
    <div class="state-msg">Nothing is currently checked out.</div>

  {:else}
    <!-- Category tabs -->
    <div class="tabs">
      {#each categories as cat}
        <button
          class="tab"
          class:active={activeCategory === cat.name}
          on:click={() => activeCategory = cat.name}
        >
          {cat.name}
          <span class="tab-count">{cat.students.reduce((n, s) => n + s.items.length, 0)}</span>
        </button>
      {/each}
    </div>

    <!-- Student list -->
    <div class="list">
      {#if active && active.students.length > 0}
        {#each active.students as student}
          <div class="student-card">
            <div class="student-name">
              {student.name}
              <span class="student-username">({student.username})</span>
            </div>
            <div class="items">
              {#each student.items as item}
                <div class="item-row">
                  <span class="item-model">{item.model}</span>
                  <span class="item-tag">{item.assetTag}</span>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      {:else}
        <div class="state-msg">No items checked out in this category.</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 100;
  }

  .panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 101;
    width: min(92vw, 860px);
    height: min(88vh, 780px);
    background: #fff;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
  }

  /* ── Header ── */
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.75rem;
    background: #1a1a2e;
    color: #fff;
    flex-shrink: 0;
  }

  .header-left { display: flex; align-items: center; gap: 1rem; }

  h2 { margin: 0; font-size: 1.6rem; font-weight: 800; }

  .total-badge {
    font-size: 0.95rem;
    font-weight: 600;
    background: #f59e0b;
    color: #1a1a2e;
    padding: 0.2rem 0.7rem;
    border-radius: 999px;
  }

  .close-btn {
    background: rgba(255,255,255,0.15);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 1.3rem;
    width: 2.5rem;
    height: 2.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }
  .close-btn:hover { background: rgba(255,255,255,0.25); }

  /* ── Tabs ── */
  .tabs {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 1.75rem;
    flex-wrap: wrap;
    background: #f8f9fa;
    border-bottom: 2px solid #e5e7eb;
    flex-shrink: 0;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1.1rem;
    border: 2px solid #d1d5db;
    border-radius: 999px;
    background: #fff;
    font-size: 1rem;
    font-weight: 600;
    color: #555;
    cursor: pointer;
    transition: all 0.15s;
  }
  .tab:hover { border-color: #1a1a2e; color: #1a1a2e; }
  .tab.active { background: #1a1a2e; color: #fff; border-color: #1a1a2e; }

  .tab-count {
    font-size: 0.8rem;
    font-weight: 700;
    background: rgba(0,0,0,0.15);
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
  }
  .tab.active .tab-count { background: rgba(255,255,255,0.2); }

  /* ── List ── */
  .list {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .student-card {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
  }

  .student-name {
    background: #f0f4ff;
    padding: 0.75rem 1.1rem;
    font-size: 1.2rem;
    font-weight: 700;
    color: #1a1a2e;
    border-bottom: 1px solid #e5e7eb;
  }

  .student-username {
    font-size: 1rem;
    font-weight: 500;
    color: #666;
    margin-left: 0.4rem;
  }

  .items { padding: 0.4rem 0; }

  .item-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 0.45rem 1.1rem;
    gap: 1rem;
  }
  .item-row:not(:last-child) { border-bottom: 1px solid #f3f4f6; }

  .item-model {
    font-size: 1rem;
    font-weight: 500;
    color: #333;
  }

  .item-tag {
    font-size: 0.9rem;
    font-family: monospace;
    color: #888;
    white-space: nowrap;
  }

  /* ── States ── */
  .state-msg {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: #888;
    padding: 3rem;
  }
  .state-msg.error { color: #dc2626; }
</style>
