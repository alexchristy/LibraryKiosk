<script lang="ts">
  import { session } from '$lib/stores/session';

  let input = '';
  let error = '';
  let loading = false;
  let inputEl: HTMLInputElement;

  $: if (inputEl) inputEl.focus();

  async function submit() {
    const val = input.trim();
    if (!val || !/^\d+$/.test(val)) {
      error = 'Please enter a valid admission number.';
      input = '';
      return;
    }
    loading = true;
    error = '';
    try {
      const res = await fetch(`/api/lookup-user?admission=${encodeURIComponent(val)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        error = data.error === 'Student not found'
          ? 'Student ID not found. Please try again or see a teacher.'
          : 'System error. Please try again.';
        input = '';
        return;
      }
      session.startSession({ id: data.id, name: data.name, admissionNumber: data.admissionNumber });
    } catch {
      error = 'Could not connect to system. Please try again.';
      input = '';
    } finally {
      loading = false;
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') submit();
  }
</script>

<div class="idle-screen">
  <div class="hero">
    <div class="icon">📚</div>
    <h1>Library Kiosk</h1>
    <p class="subtitle">Scan your student ID or type your admission number below</p>
  </div>

  <div class="input-area">
    <div class="input-row">
      <input
        bind:this={inputEl}
        bind:value={input}
        on:keydown={onKeydown}
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        placeholder="Admission Number"
        autocomplete="off"
        disabled={loading}
        class:has-error={!!error}
      />
      <button on:click={submit} disabled={loading || !input.trim()}>
        {loading ? '...' : 'Go'}
      </button>
    </div>
    {#if error}
      <p class="error-msg">{error}</p>
    {/if}
  </div>

  <p class="hint">Scan your QR code or type your number, then press Enter</p>
</div>

<style>
  .idle-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 3rem;
    padding: 2rem;
    text-align: center;
  }

  .hero { display: flex; flex-direction: column; align-items: center; gap: 1rem; }

  .icon { font-size: 5rem; }

  h1 {
    font-size: 3.5rem;
    font-weight: 800;
    color: #1a1a2e;
    margin: 0;
  }

  .subtitle {
    font-size: 1.5rem;
    color: #444;
    margin: 0;
    max-width: 500px;
  }

  .input-area { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; width: 100%; max-width: 480px; }

  .input-row { display: flex; gap: 0.75rem; width: 100%; }

  input {
    flex: 1;
    font-size: 2rem;
    padding: 0.75rem 1rem;
    border: 3px solid #ccc;
    border-radius: 12px;
    outline: none;
    text-align: center;
    letter-spacing: 0.1em;
    transition: border-color 0.2s;
  }

  input:focus { border-color: #3a86ff; }
  input.has-error { border-color: #e63946; }

  button {
    font-size: 1.8rem;
    font-weight: 700;
    padding: 0.75rem 1.5rem;
    background: #3a86ff;
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    min-width: 90px;
  }

  button:hover:not(:disabled) { background: #2563eb; }
  button:active:not(:disabled) { transform: scale(0.97); }
  button:disabled { background: #aaa; cursor: not-allowed; }

  .error-msg {
    font-size: 1.2rem;
    color: #e63946;
    font-weight: 600;
    margin: 0;
  }

  .hint { font-size: 1.1rem; color: #888; margin: 0; }
</style>
