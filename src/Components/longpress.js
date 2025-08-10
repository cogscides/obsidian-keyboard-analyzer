export function longpress(node, duration) {
  let timer
  const handleMousedown = () => {
    timer = setTimeout(() => {
      timer = null
      node.dispatchEvent(new CustomEvent('longpress-start'))
    }, duration)
  }
  const handleMouseup = () => {
    if (timer === null) {
      node.dispatchEvent(new CustomEvent('longpress-end'))
    } else {
      clearTimeout(timer)
      timer = null
    }
  }

  node.addEventListener('mousedown', handleMousedown)
  node.addEventListener('mouseup', handleMouseup)

  return {
    update(newDuration) {
      duration = newDuration
    },
    destroy() {
      node.removeEventListener('mousedown', handleMousedown)
      node.removeEventListener('mouseup', handleMouseup)
    },
  }
}
