<script lang="ts">
  import { session } from '$lib/stores/session';

  $: checkedOut = $session.items.filter(i => i.action === 'checked_out').length;
  $: checkedIn  = $session.items.filter(i => i.action === 'checked_in').length;
  $: consumed   = $session.items.filter(i => i.action === 'consumed').length;
  $: hasActivity = checkedOut > 0 || checkedIn > 0 || consumed > 0;
</script>

<div class="complete-screen" class:neutral={!hasActivity}>
  {#if hasActivity}
    <div class="checkmark">✓</div>
    <h1>All Done!</h1>
  {:else}
    <div class="neutral-icon">—</div>
    <h1 class="neutral-heading">Session Ended</h1>
  {/if}
  <p class="name">Thanks, {$session.user?.name?.split(' ')[0]}!</p>

  <div class="summary">
    {#if checkedOut > 0}
      <div class="summary-item out">
        <span class="count">{checkedOut}</span>
        <span class="desc">{checkedOut === 1 ? 'item' : 'items'} checked out</span>
      </div>
    {/if}
    {#if checkedIn > 0}
      <div class="summary-item in">
        <span class="count">{checkedIn}</span>
        <span class="desc">{checkedIn === 1 ? 'item' : 'items'} checked in</span>
      </div>
    {/if}
    {#if consumed > 0}
      <div class="summary-item out">
        <span class="count">{consumed}</span>
        <span class="desc">{consumed === 1 ? 'consumable' : 'consumables'} taken</span>
      </div>
    {/if}
    {#if !hasActivity}
      <p class="none">No items were checked out, returned, or taken.</p>
    {/if}
  </div>

  <p class="returning">Returning to start screen…</p>
</div>

<style>
  .complete-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1.5rem;
    background: #f0fdf4;
    text-align: center;
    padding: 2rem;
  }

  .complete-screen.neutral {
    background: #f3f4f6;
  }

  .checkmark {
    font-size: 6rem;
    color: #16a34a;
    animation: pop 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  }

  .neutral-icon {
    width: 7rem;
    height: 7rem;
    border-radius: 50%;
    border: 6px solid #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    font-weight: 800;
    color: #9ca3af;
    animation: pop 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  }

  .neutral-heading {
    color: #6b7280 !important;
  }

  @keyframes pop {
    0%   { transform: scale(0); }
    70%  { transform: scale(1.15); }
    100% { transform: scale(1); }
  }

  h1 { font-size: 3rem; font-weight: 800; color: #15803d; margin: 0; }

  .name { font-size: 1.5rem; color: #555; margin: 0; }

  .summary { display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap; }

  .summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.25rem 2rem;
    border-radius: 16px;
    min-width: 140px;
  }

  .summary-item.out { background: #fef9c3; color: #854d0e; }
  .summary-item.in  { background: #dcfce7; color: #166534; }

  .count { font-size: 3rem; font-weight: 800; }
  .desc  { font-size: 1rem; font-weight: 600; }

  .none { font-size: 1.2rem; color: #6b7280; }

  .returning { font-size: 1rem; color: #aaa; margin: 0; animation: fade 1s 2s ease-out forwards; opacity: 1; }

  @keyframes fade { to { opacity: 0.4; } }
</style>
