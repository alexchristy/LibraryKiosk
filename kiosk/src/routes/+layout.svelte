<script lang="ts">
  import { setKioskConfig } from '$lib/stores/session';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  setKioskConfig(data.kioskFinishDelay, data.kioskResetDelay);

  function onContextmenu(e: MouseEvent) { e.preventDefault(); }
</script>

<svelte:window on:contextmenu={onContextmenu} />

<div class="kiosk-shell">
  <slot />
</div>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; }

  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #fff;
    user-select: none;
    -webkit-user-select: none;
    overflow: hidden;
  }

  :global(::-webkit-scrollbar) { width: 6px; }
  :global(::-webkit-scrollbar-track) { background: transparent; }
  :global(::-webkit-scrollbar-thumb) { background: #ccc; border-radius: 3px; }

  .kiosk-shell {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
</style>
