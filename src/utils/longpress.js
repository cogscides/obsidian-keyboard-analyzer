export function longpress(node, duration) {
  let timer

  const handleMousedown = () => {
    timer = setTimeout(() => {
      node.dispatchEvent(new CustomEvent('longpress-start'))
    }, duration)
  }

  const handleMouseup = () => {
    if (!timer) {
      node.dispatchEvent(new CustomEvent('longpress-end'))
    } else {
      clearTimeout(timer)
    }
  }

  node.addEventListener('mousedown', handleMousedown)
  node.addEventListener('mouseup', handleMouseup)

  return {
    update(newDuration) {
      localDuration = newDuration
    },
    destroy() {
      node.removeEventListener('mousedown', handleMousedown)
      node.removeEventListener('mouseup', handleMouseup)
    },
  }
}
