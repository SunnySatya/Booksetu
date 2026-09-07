const canvasOf = (file, maxW) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width)
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('IMAGE_READ_FAILED'))
    }
    img.src = url
  })

export const fileToResizedDataUrl = async (file, maxW = 640, quality = 0.62) => {
  const canvas = await canvasOf(file, maxW)
  return canvas.toDataURL('image/jpeg', quality)
}

export const fileToThumbDataUrl = async (file, maxW = 240, quality = 0.55) => {
  const canvas = await canvasOf(file, maxW)
  return canvas.toDataURL('image/jpeg', quality)
}