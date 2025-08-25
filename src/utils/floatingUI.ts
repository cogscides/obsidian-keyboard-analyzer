/**
 * Floating UI utility functions and configurations
 * Common middleware setups and helper functions for consistent floating UI behavior
 */

import { offset, flip, shift, arrow } from '@skeletonlabs/floating-ui-svelte'
import type { Middleware, Placement } from '@floating-ui/dom'

/**
 * Standard middleware configuration for tooltips
 */
export function createTooltipMiddleware(
  arrowElement?: HTMLElement | (() => HTMLElement | null)
) {
  const middleware: Middleware[] = [
    offset(8), // 8px offset from anchor
    flip(), // Flip when overflowing
    shift({ padding: 8 }), // Shift to stay within viewport
  ]

  // Add arrow middleware if element is provided
  if (arrowElement) {
    const element =
      typeof arrowElement === 'function' ? arrowElement() : arrowElement
    if (element) {
      middleware.push(arrow({ element }))
    }
  }

  return middleware
}

/**
 * Standard middleware configuration for dropdowns
 */
export function createDropdownMiddleware() {
  return [
    offset(8), // 8px offset from trigger
    flip(), // Flip when overflowing
    shift({ padding: 8 }), // Shift to stay within viewport
  ]
}

/**
 * Standard middleware configuration for popovers
 */
export function createPopoverMiddleware(
  arrowElement?: HTMLElement | (() => HTMLElement | null)
) {
  const middleware: Middleware[] = [
    offset(12), // Slightly larger offset for popovers
    flip(), // Flip when overflowing
    shift({ padding: 16 }), // More padding for popovers
  ]

  // Add arrow middleware if element is provided
  if (arrowElement) {
    const element =
      typeof arrowElement === 'function' ? arrowElement() : arrowElement
    if (element) {
      middleware.push(arrow({ element }))
    }
  }

  return middleware
}

/**
 * Common placement options
 */
export const placements = {
  tooltip: {
    top: 'top' as Placement,
    bottom: 'bottom' as Placement,
    left: 'left' as Placement,
    right: 'right' as Placement,
  },
  dropdown: {
    bottomStart: 'bottom-start' as Placement,
    bottomEnd: 'bottom-end' as Placement,
    topStart: 'top-start' as Placement,
    topEnd: 'top-end' as Placement,
  },
  popover: {
    bottom: 'bottom' as Placement,
    top: 'top' as Placement,
    right: 'right' as Placement,
    left: 'left' as Placement,
  },
}

/**
 * Calculate arrow position from middleware data
 */
export function calculateArrowPosition(
  middlewareData: { arrow?: { x?: number | null; y?: number | null } },
  placement: string
): Record<string, string> {
  if (!middlewareData.arrow) return {}

  const { x, y } = middlewareData.arrow
  const side = placement.split('-')[0]

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
}

/**
 * Standard z-index values for consistent layering
 */
export const zIndex = {
  tooltip: 200001,
  dropdown: 150000,
  popover: 160000,
  modal: 200000,
}

/**
 * Debounce function for hover interactions
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Click outside handler utility
 */
export function createClickOutsideHandler(
  referenceElement: Element | null,
  floatingElement: Element | null,
  callback: (event: MouseEvent) => void
) {
  return (event: MouseEvent) => {
    const target = event.target as Element

    if (
      referenceElement &&
      floatingElement &&
      !referenceElement.contains(target) &&
      !floatingElement.contains(target)
    ) {
      callback(event)
    }
  }
}

/**
 * Escape key handler utility
 */
export function createEscapeKeyHandler(callback: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      callback()
    }
  }
}
