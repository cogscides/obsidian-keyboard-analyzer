export function clickOutside(node) {
  // Use pointerdown to capture earlier than click, improving reliability
  const handlePointerDown = event => {
    const target = event.target
    if (!node || event.defaultPrevented) return
    // If click is inside the node, ignore
    if (node.contains(target)) return
    // Dispatch both legacy and new events for compatibility
    const detail = { originalEvent: event }
    node.dispatchEvent(new CustomEvent('click_outside', { detail }))
    node.dispatchEvent(new CustomEvent('onclick_outside', { detail }))
  }

  // Fallback for environments where pointer events may be disabled
  const handleClick = event => {
    const target = event.target
    if (!node || event.defaultPrevented) return
    if (node.contains(target)) return
    const detail = { originalEvent: event }
    node.dispatchEvent(new CustomEvent('click_outside', { detail }))
    node.dispatchEvent(new CustomEvent('onclick_outside', { detail }))
  }

  document.addEventListener('pointerdown', handlePointerDown, true)
  document.addEventListener('click', handleClick, true)

  return {
    destroy() {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('click', handleClick, true)
    },
  }
}
export default clickOutside
