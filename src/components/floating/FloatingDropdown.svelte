<!-- FloatingDropdown.svelte -->
<!-- A reusable dropdown component using @skeletonlabs/floating-ui-svelte -->
<script lang="ts">
  import {
    useFloating,
    flip,
    shift,
    offset,
  } from '@skeletonlabs/floating-ui-svelte'
  import type { Placement } from '@floating-ui/dom'
  import { createEventDispatcher } from 'svelte'

  interface Props {
    /** Whether the dropdown is open */
    open?: boolean
    /** Placement preference for the dropdown */
    placement?: Placement
    /** Minimum width of the dropdown */
    minWidth?: string
    /** Maximum width of the dropdown */
    maxWidth?: string
    /** Custom CSS class for the dropdown */
    class?: string
    /** Whether to show on hover (default: false, click-based) */
    hoverTrigger?: boolean
    /** Delay for hover trigger */
    hoverDelay?: number
  }

  let {
    open = $bindable(false),
    placement = 'bottom-start',
    minWidth = '220px',
    maxWidth = 'none',
    class: className = '',
    hoverTrigger = false,
    hoverDelay = 200,
  }: Props = $props()

  // Event dispatcher for custom events
  const dispatch = createEventDispatcher<{
    clickOutside: { event: MouseEvent }
    open: void
    close: void
  }>()

  // Animation state
  let isAnimating = $state(false)
  let showContent = $state(false)
  let animationTimeout: ReturnType<typeof setTimeout> | null = null

  // Hover delay timeout
  let hoverTimeout: ReturnType<typeof setTimeout> | null = null

  // Floating UI configuration
  const floating = useFloating({
    placement,
    middleware: [
      offset(8), // 8px distance from trigger element
      flip(), // Flip to opposite side if no space
      shift({ padding: 8 }), // Shift within viewport bounds
    ],
  })

  // Handle click outside to close dropdown
  function handleClickOutside(event: MouseEvent) {
    if (!open) return

    // Check if click is outside both trigger and dropdown
    const target = event.target as Element
    const triggerElement = floating.elements.reference
    const dropdownElement = floating.elements.floating

    if (
      triggerElement &&
      dropdownElement &&
      triggerElement instanceof HTMLElement &&
      dropdownElement instanceof HTMLElement &&
      !triggerElement.contains(target) &&
      !dropdownElement.contains(target)
    ) {
      startCloseAnimation()
      dispatch('clickOutside', { event })
      dispatch('close')
    }
  }

  // Handle trigger click
  function handleTriggerClick() {
    if (hoverTrigger) return // Don't handle clicks if hover-based

    const wasOpen = open
    
    if (!wasOpen) {
      // Opening
      open = true
      showContent = true
      startOpenAnimation()
      dispatch('open')
    } else {
      // Closing
      startCloseAnimation()
      dispatch('close')
    }
  }

  // Handle hover events for hover-trigger mode
  function handleTriggerMouseEnter() {
    if (!hoverTrigger) return

    clearHoverTimeout()

    if (hoverDelay > 0) {
      hoverTimeout = setTimeout(() => {
        open = true
        showContent = true
        startOpenAnimation()
        dispatch('open')
      }, hoverDelay)
    } else {
      open = true
      showContent = true
      startOpenAnimation()
      dispatch('open')
    }
  }

  function handleTriggerMouseLeave() {
    if (!hoverTrigger) return

    clearHoverTimeout()
    hoverTimeout = setTimeout(() => {
      startCloseAnimation()
      dispatch('close')
    }, 100) // Small delay to prevent flickering
  }

  function handleDropdownMouseEnter() {
    if (!hoverTrigger) return
    clearHoverTimeout()
  }

  function handleDropdownMouseLeave() {
    if (!hoverTrigger) return

    clearHoverTimeout()
    hoverTimeout = setTimeout(() => {
      startCloseAnimation()
      dispatch('close')
    }, 100)
  }

  // Clear hover timeout
  function clearHoverTimeout() {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      hoverTimeout = null
    }
  }

  // Handle escape key to close dropdown
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      startCloseAnimation()
      dispatch('close')
    }
  }

  // Animation helper functions
  function startOpenAnimation() {
    clearAnimationTimeout()
    isAnimating = true
    
    // Add visible class after DOM update for animation
    setTimeout(() => {
      if (floating.elements.floating) {
        floating.elements.floating.classList.remove('dropdown-exiting')
        floating.elements.floating.classList.add('dropdown-visible')
      }
    }, 10)
    
    // Clear animation state after transition
    animationTimeout = setTimeout(() => {
      isAnimating = false
    }, 200)
  }

  function startCloseAnimation() {
    clearAnimationTimeout()
    isAnimating = true
    
    // Add exit animation class
    if (floating.elements.floating) {
      floating.elements.floating.classList.remove('dropdown-visible')
      floating.elements.floating.classList.add('dropdown-exiting')
    }
    
    // Hide content after animation completes
    animationTimeout = setTimeout(() => {
      open = false
      showContent = false
      isAnimating = false
      
      // Clean up animation classes
      setTimeout(() => {
        if (floating.elements.floating) {
          floating.elements.floating.classList.remove('dropdown-exiting')
          floating.elements.floating.classList.remove('dropdown-visible')
        }
      }, 10)
    }, 150)
  }

  // Clear animation timeout
  function clearAnimationTimeout() {
    if (animationTimeout) {
      clearTimeout(animationTimeout)
      animationTimeout = null
    }
  }

  // Cleanup on unmount
  function cleanup() {
    clearHoverTimeout()
    clearAnimationTimeout()
  }

  // Set up click outside listener when dropdown is open
  $effect(() => {
    if (open) {
      // Use capture phase to ensure we get the event before other handlers
      document.addEventListener('click', handleClickOutside, { capture: true })
      document.addEventListener('keydown', handleKeydown)

      return () => {
        document.removeEventListener('click', handleClickOutside, {
          capture: true,
        })
        document.removeEventListener('keydown', handleKeydown)
      }
    }
  })
</script>

<!-- Trigger element slot with event handlers -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  bind:this={floating.elements.reference}
  onclick={handleTriggerClick}
  onmouseenter={handleTriggerMouseEnter}
  onmouseleave={handleTriggerMouseLeave}
  class="floating-dropdown-trigger"
>
  <slot name="trigger" />
</div>

<!-- Dropdown content -->
{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={floating.elements.floating}
    style={floating.isPositioned
      ? floating.floatingStyles
      : 'position: absolute; top: 0; left: 0; z-index: 200000;'}
    onmouseenter={handleDropdownMouseEnter}
    onmouseleave={handleDropdownMouseLeave}
    class="floating floating-dropdown {className}"
    style:min-width={minWidth}
    style:max-width={maxWidth}
    data-placement={floating.placement}
    role="menu"
    tabindex="-1"
    aria-hidden="false"
  >
    <slot name="content" />
  </div>
{/if}

<style>
  .floating-dropdown-trigger {
    display: inline-block;
    position: relative;
  }

  /* Dropdown animations and styling */
  :global(.floating-dropdown) {
    font-size: 14px;
    line-height: 1.4;
    
    /* Use opacity-only animation on main element to avoid transform conflicts */
    opacity: 0;
    transition: opacity 150ms cubic-bezier(0.16, 1, 0.3, 1);
    
    /* Maintain proper dropdown background and styling */
    background: var(--background-primary-alt);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    padding: 12px 16px;
    box-shadow: 0px 45px 18px rgba(5, 5, 5, 0.01),
      0px 25px 15px rgba(5, 5, 5, 0.03), 0px 11px 11px rgba(5, 5, 5, 0.04),
      0px 3px 6px rgba(5, 5, 5, 0.05), 0px 0px 0px rgba(5, 5, 5, 0.05);
  }

  /* Use pseudo-element for scale animation to avoid floating-ui transform conflicts */
  :global(.floating-dropdown)::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: transparent;
    border-radius: inherit;
    transform: scale(0.95);
    transition: transform 150ms cubic-bezier(0.16, 1, 0.3, 1);
    z-index: -1;
    pointer-events: none;
  }

  /* Visible state with smooth entrance */
  :global(.floating-dropdown.dropdown-visible) {
    opacity: 1;
  }

  :global(.floating-dropdown.dropdown-visible)::before {
    transform: scale(1);
  }

  /* Exit animation */
  :global(.floating-dropdown.dropdown-exiting) {
    opacity: 0;
    transition: opacity 150ms ease-in;
  }

  :global(.floating-dropdown.dropdown-exiting)::before {
    transform: scale(0.98);
    transition: transform 150ms ease-in;
  }
</style>
