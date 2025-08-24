<!-- FloatingTooltip.svelte -->
<!-- A reusable tooltip component using @skeletonlabs/floating-ui-svelte -->
<script lang="ts">
  import {
    useFloating,
    flip,
    shift,
    offset,
    arrow,
  } from '@skeletonlabs/floating-ui-svelte'
  import type { Placement } from '@floating-ui/dom'
  import { tick } from 'svelte'
  import {
    tooltipDelayManager,
    type TooltipGroupId,
  } from '../../utils/tooltipGroups'

  interface Props {
    /** The content to display in the tooltip */
    content: string
    /** Placement preference for the tooltip */
    placement?: Placement
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
    /** Tooltip group for coordinated delays */
    group?: TooltipGroupId
  }

  let {
    content,
    placement = 'top',
    delay = 500,
    disabled = false,
    maxWidth = '300px',
    class: className = '',
    style: triggerStyle = '',
    group,
  }: Props = $props()

  // State for tooltip visibility
  let isOpen = $state(false)
  let showTimeout: ReturnType<typeof setTimeout> | null = null
  let hideTimeout: ReturnType<typeof setTimeout> | null = null

  // Arrow element reference
  let arrowElement = $state<HTMLDivElement | null>(null)

  // Floating UI configuration
  const floating = useFloating({
    placement,
    middleware: [
      offset(8), // 8px distance from trigger element
      flip(), // Flip to opposite side if no space
      shift({ padding: 8 }), // Shift within viewport bounds
      ...(arrowElement ? [arrow({ element: arrowElement })] : []), // Position arrow element if available
    ],
  })

  // Show tooltip with delay (or immediately if in active group)
  function showTooltip() {
    if (disabled) return
    clearTimeouts()

    // Check if we should show immediately due to group activity
    const shouldShowImmediately =
      group && tooltipDelayManager.shouldShowImmediately(group)
    const effectiveDelay = shouldShowImmediately ? 0 : delay

    if (effectiveDelay > 0) {
      showTimeout = setTimeout(() => {
        isOpen = true
        // Add visible class after DOM update for animation
        setTimeout(() => {
          if (floating.elements.floating) {
            floating.elements.floating.classList.remove('exiting')
            floating.elements.floating.classList.add('tooltip-visible')
          }
        }, 10)
        if (group) tooltipDelayManager.onTooltipShow(group)
      }, effectiveDelay)
    } else {
      isOpen = true
      // Add visible class after DOM update for animation
      setTimeout(() => {
        if (floating.elements.floating) {
          floating.elements.floating.classList.remove('exiting')
          floating.elements.floating.classList.add('tooltip-visible')
        }
      }, 10)
      if (group) tooltipDelayManager.onTooltipShow(group)
    }
  }

  // Hide tooltip immediately or with short delay
  function hideTooltip() {
    clearTimeouts()
    
    // Add exit animation class and remove visible class
    if (floating.elements.floating) {
      floating.elements.floating.classList.remove('tooltip-visible')
      floating.elements.floating.classList.add('exiting')
    }
    
    hideTimeout = setTimeout(() => {
      isOpen = false
      if (group) tooltipDelayManager.onTooltipHide(group)
      
      // Clean up animation classes after hiding
      setTimeout(() => {
        if (floating.elements.floating) {
          floating.elements.floating.classList.remove('exiting')
          floating.elements.floating.classList.remove('tooltip-visible')
        }
      }, 10)
    }, 100) // Small delay to prevent flickering when moving between trigger and tooltip
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

  // Cleanup on unmount
  function cleanup() {
    clearTimeouts()
  }

  // Handle mouse enter on trigger element
  function handleMouseEnter() {
    showTooltip()
  }

  // Handle mouse leave on trigger element
  function handleMouseLeave() {
    hideTooltip()
  }

  // Handle focus on trigger element
  function handleFocus() {
    showTooltip()
  }

  // Handle blur on trigger element
  function handleBlur() {
    hideTooltip()
  }

  // Calculate arrow position from middleware data
  const arrowPosition = $derived(() => {
    if (!floating.middlewareData.arrow) return {}

    const { x, y } = floating.middlewareData.arrow
    const side = floating.placement.split('-')[0]

    const staticSide = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
    }[side] as string

    return {
      left: x != null ? `${x}px` : '',
      top: y != null ? `${y}px` : '',
      right: '',
      bottom: '',
      [staticSide]: '-4px',
    }
  })
</script>

<!-- Trigger element slot with event handlers -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
  bind:this={floating.elements.reference}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  onfocus={handleFocus}
  onblur={handleBlur}
  class="floating-tooltip-trigger"
  style={triggerStyle}
>
  <slot />
</span>

<!-- Tooltip element -->
{#if isOpen && content}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={floating.elements.floating}
    style={floating.floatingStyles}
    onmouseenter={() => clearTimeouts()}
    onmouseleave={hideTooltip}
    class="floating floating-tooltip {className}"
    style:max-width={maxWidth}
    role="tooltip"
    aria-hidden="false"
  >
    {content}

    <!-- Arrow element -->
    <div
      bind:this={arrowElement}
      class="floating-arrow"
      style:left={arrowPosition().left}
      style:top={arrowPosition().top}
      style:right={arrowPosition().right}
      style:bottom={arrowPosition().bottom}
      data-side={floating.placement.split('-')[0]}
    ></div>
  </div>
{/if}

<style>
  .floating-tooltip-trigger {
    /* Default positioning */
    display: contents;
  }

  /* When grid positioning is applied via style attribute, act as a proper grid item */
  .floating-tooltip-trigger[style*='grid-row'],
  .floating-tooltip-trigger[style*='grid-column'] {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  /* Enhanced tooltip styles with animations */
  :global(.floating-tooltip) {
    font-size: 13px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-wrap: break-word;
    
    /* Use separate elements for animation to avoid transform conflicts */
    opacity: 0;
    
    /* Smooth transition */
    transition: opacity 200ms cubic-bezier(0.16, 1, 0.3, 1);
    
    /* Animate to visible state */
    animation: tooltip-enter 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  /* Inner animation wrapper to handle scaling without affecting positioning */
  :global(.floating-tooltip)::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: inherit;
    border: inherit;
    border-radius: inherit;
    transform: scale(0.8);
    transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
    z-index: -1;
  }

  /* Scale animation for the pseudo-element */
  :global(.floating-tooltip.tooltip-visible)::before {
    transform: scale(1);
  }

  /* Enter animation (opacity only) */
  @keyframes tooltip-enter {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Exit animation (opacity only) */
  :global(.floating-tooltip.exiting) {
    opacity: 0;
    transition: opacity 150ms ease-in;
  }

  :global(.floating-tooltip.exiting)::before {
    transform: scale(0.9);
    transition: transform 150ms ease-in;
  }

  /* Arrow animation */
  :global(.floating-tooltip) .floating-arrow {
    transition: opacity 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }
</style>
