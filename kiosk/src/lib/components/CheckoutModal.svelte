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

  function printReport(filterCategory?: string) {
    const cats = filterCategory ? categories.filter(c => c.name === filterCategory) : categories;
    const totalItems = cats.reduce((n, c) => n + c.students.reduce((m, s) => m + s.items.length, 0), 0);
    const now = new Date().toLocaleString();

    let sections = '';
    for (const cat of cats) {
      const catTotal = cat.students.reduce((n, s) => n + s.items.length, 0);
      let studentRows = '';
      for (const student of cat.students) {
        let itemRows = student.items.map(item =>
          `<div class="item-row"><span class="item-model">${item.model}</span><span class="item-tag">${item.assetTag}</span></div>`
        ).join('');
        studentRows += `<div class="student-block">
          <div class="student-header">${student.name} <span class="student-username">(${student.username})</span></div>
          <div class="items">${itemRows}</div>
        </div>`;
      }
      sections += `<div class="cat-section">
        <div class="cat-title">${cat.name} <span class="cat-count">${catTotal} item${catTotal !== 1 ? 's' : ''}</span></div>
        ${studentRows}
      </div>`;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Library Checkouts${filterCategory ? ' — ' + filterCategory : ''}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:20px 28px}
        .report-header{margin-bottom:18px;padding-bottom:10px;border-bottom:3px solid #1a1a2e}
        .report-header h1{font-size:18px;font-weight:800;color:#1a1a2e;margin-bottom:3px}
        .report-meta{font-size:10px;color:#666}
        .cat-section{margin-bottom:20px;page-break-inside:avoid}
        .cat-title{font-size:14px;font-weight:700;color:#fff;background:#1a1a2e;padding:5px 10px;border-radius:4px;margin-bottom:8px}
        .cat-count{font-weight:400;font-size:11px;opacity:0.8;margin-left:6px}
        .student-block{margin:0 4px 10px 4px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden}
        .student-header{background:#f0f4ff;padding:5px 10px;font-size:12px;font-weight:700;color:#1a1a2e;border-bottom:1px solid #e5e7eb}
        .student-username{font-weight:400;color:#555}
        .item-row{display:flex;justify-content:space-between;padding:4px 10px;font-size:11px;border-bottom:1px solid #f3f4f6}
        .item-row:last-child{border-bottom:none}
        .item-row:nth-child(even){background:#fafafa}
        .item-model{color:#333}
        .item-tag{font-family:monospace;color:#888;white-space:nowrap;margin-left:12px}
        @media print{body{padding:10px 16px}.cat-section{page-break-inside:avoid}}
      </style>
    </head><body>
      <div class="report-header">
        <h1>Library Kiosk — ${filterCategory ? filterCategory + ' Checkouts' : 'All Current Checkouts'}</h1>
        <div class="report-meta">Generated: ${now} &nbsp;·&nbsp; ${totalItems} item${totalItems !== 1 ? 's' : ''} out</div>
      </div>
      ${sections}
    </body></html>`;

    const win = window.open('', '_blank', 'width=820,height=680');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
  }
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
    <div class="header-right">
      {#if !loading && !fetchError && categories.length > 0}
        <button class="print-all-btn" on:click={() => printReport()}>🖨 Print All</button>
      {/if}
      <button class="close-btn" on:click={onClose}>✕</button>
    </div>
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
        <div class="list-toolbar">
          <button class="print-cat-btn" on:click={() => printReport(activeCategory)}>
            🖨 Print {activeCategory}
          </button>
        </div>
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

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .print-all-btn {
    background: rgba(255,255,255,0.15);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    padding: 0.4rem 0.9rem;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .print-all-btn:hover { background: rgba(255,255,255,0.25); }

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
    min-height: 0;
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
    flex-shrink: 0;
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

  .list-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.5rem;
    flex-shrink: 0;
  }

  .print-cat-btn {
    font-size: 0.85rem;
    font-weight: 600;
    color: #1a1a2e;
    background: #f0f4ff;
    border: 1px solid #dde4ff;
    border-radius: 8px;
    padding: 0.35rem 0.85rem;
    cursor: pointer;
    transition: background 0.15s;
  }
  .print-cat-btn:hover { background: #dde4ff; }

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
