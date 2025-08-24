<!-- AnchorTooltip.svelte -->
<!-- A modern tooltip component using CSS anchor positioning with fallback -->
<script lang="ts">
  import { onMount } from 'svelte'

  interface Props {
    /** The content to display in the tooltip */
    content: string
    /** Delay before showing tooltip in milliseconds */
    delay?: number
    /** Whether the tooltip is disabled */
    disabled?: boolean
    /** Maximum width of the tooltip */
    maxWidth?: string
    /** Custom CSS class for the tooltip */
    class?: string
    /** Custom style for the trigger element */
    style?: string
  }

  let {
    content,
    delay = 500,
    disabled = false,
    maxWidth = '300px',
    class: className = '',
    style: triggerStyle = '',
  }: Props = $props()

  // State for tooltip visibility
  let isOpen = $state(false)
  let showTimeout: ReturnType<typeof setTimeout> | null = null
  let hideTimeout: ReturnType<typeof setTimeout> | null = null

  // Element references
  let triggerElement = $state<HTMLElement | null>(null)
  let tooltipElement = $state<HTMLElement | null>(null)

  // Feature detection for CSS anchor positioning
  let supportsAnchorPositioning = $state(false)

  onMount(() => {
    // Check if CSS anchor positioning is supported
    supportsAnchorPositioning =
      CSS.supports('anchor-name', '--anchor') &&
      CSS.supports('position-anchor', '--anchor')
  })

  // Show tooltip with delay
  function showTooltip() {
    if (disabled || !content) return
    clearTimeouts()

    if (delay > 0) {
      showTimeout = setTimeout(() => {
        isOpen = true
      }, delay)
    } else {
      isOpen = true
    }
  }

  // Hide tooltip with short delay to prevent flickering
  function hideTooltip() {
    clearTimeouts()
    hideTimeout = setTimeout(() => {
      isOpen = false
    }, 100)
  }

  // Clear all active timeouts
  function clearTimeouts() {
    if (showTimeout) {
      clearTimeout(showTimeout)
      showTimeout = null
    }
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
  }

  // Generate unique anchor name for this tooltip
  const anchorId = `tooltip-anchor-${Math.random().toString(36).substr(2, 9)}`
</script>

<!-- Trigger element with anchor name -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
  bind:this={triggerElement}
  onmouseenter={showTooltip}
  onmouseleave={hideTooltip}
  onfocus={showTooltip}
  onblur={hideTooltip}
  class="anchor-tooltip-trigger {className}"
  style="{triggerStyle} {supportsAnchorPositioning
    ? `anchor-name: --${anchorId};`
    : ''}"
>
  <slot />
</span>

<!-- Tooltip element -->
{#if isOpen && content}
  <div
    bind:this={tooltipElement}
    class="anchor-tooltip {supportsAnchorPositioning
      ? 'anchor-positioned'
      : 'fallback-positioned'}"
    style:max-width={maxWidth}
    style={supportsAnchorPositioning
      ? `position-anchor: --${anchorId}; inset-area: block-start span-inline;`
      : ''}
    role="tooltip"
    aria-hidden="false"
  >
    {content}
  </div>
{/if}

<style>
  .anchor-tooltip-trigger {
    /* For grid positioning when needed */
    display: contents;
  }

  /* When grid positioning is applied, act as a proper grid item */
  .anchor-tooltip-trigger[style*='grid-row'],
  .anchor-tooltip-trigger[style*='grid-column'] {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .anchor-tooltip {
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 13px;
    color: var(--text-normal);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    word-wrap: break-word;
    z-index: 200001;
    white-space: pre-wrap;
  }

  /* Modern CSS anchor positioning styles */
  .anchor-positioned {
    position: absolute;
    /* Position above the anchor by default */
    margin-block-end: 8px;
  }

  /* Fallback positioning for unsupported browsers */
  .fallback-positioned {
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    /* Will need JavaScript positioning fallback */
    display: none; /* Hide for now until we implement fallback */
  }

  /* Animation */
  .anchor-tooltip {
    opacity: 0;
    transform: scale(0.95);
    animation: tooltip-appear 150ms ease forwards;
  }

  @keyframes tooltip-appear {
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
