<script lang="ts">
  import { session } from '$lib/stores/session';
  import IdleScreen from '$lib/components/IdleScreen.svelte';
  import ScanningScreen from '$lib/components/ScanningScreen.svelte';
  import CompleteScreen from '$lib/components/CompleteScreen.svelte';
</script>

{#if $session.phase === 'idle'}
  <IdleScreen />
{:else if $session.phase === 'scanning'}
  <ScanningScreen />
{:else if $session.phase === 'complete'}
  <CompleteScreen />
{/if}
