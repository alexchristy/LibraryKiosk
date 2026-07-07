<script lang="ts">
  import { session } from '$lib/stores/session';

  $: checkedOut = $session.items.filter(i => i.action === 'checked_out').length;
  $: checkedIn  = $session.items.filter(i => i.action === 'checked_in').length;
  $: consumed   = $session.items.filter(i => i.action === 'consumed').length;
</script>

<div class="complete-screen">
  <div class="checkmark">✓</div>
  <h1>All Done!</h1>
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
    {#if checkedOut === 0 && checkedIn === 0 && consumed === 0}
      <p class="none">No items were processed.</p>
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

  .checkmark {
    font-size: 6rem;
    color: #16a34a;
    animation: pop 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
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

  .none { font-size: 1.2rem; color: #888; }

  .returning { font-size: 1rem; color: #aaa; margin: 0; animation: fade 1s 2s ease-out forwards; opacity: 1; }

  @keyframes fade { to { opacity: 0.4; } }
</style>
