export interface ImageCompressionOptions {
  maxDimension?: number
  quality?: number
  maxBytes?: number
}

const DEFAULT_MAX_DIMENSION = 1440
const DEFAULT_QUALITY = 0.72
const MAX_IMAGE_BYTES = 950 * 1024

function loadImage(file: File): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => resolve({ image, objectUrl })
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('无法读取图片，请换一个常见图片格式'))
    }
    image.src = objectUrl
  })
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('图片压缩失败'))
    }, 'image/jpeg', quality)
  })
}

export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {},
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件')
  }

  const maxBytes = Math.min(options.maxBytes ?? MAX_IMAGE_BYTES, MAX_IMAGE_BYTES)
  if (file.type === 'image/gif' && file.size < maxBytes) return file

  let loadedImage: Awaited<ReturnType<typeof loadImage>>
  try {
    loadedImage = await loadImage(file)
  } catch {
    return file
  }

  const { image, objectUrl } = loadedImage
  try {
    const maxDimension = Math.min(options.maxDimension ?? DEFAULT_MAX_DIMENSION, DEFAULT_MAX_DIMENSION)
    const initialQuality = Math.min(options.quality ?? DEFAULT_QUALITY, DEFAULT_QUALITY)
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
    let width = Math.max(1, Math.round(image.naturalWidth * scale))
    let height = Math.max(1, Math.round(image.naturalHeight * scale))
    let quality = initialQuality

    for (let attempt = 0; attempt < 48; attempt += 1) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('浏览器无法处理图片')
      context.fillStyle = '#fff'
      context.fillRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)

      const blob = await canvasToJpeg(canvas, quality)
      if (blob.size < maxBytes) {
        const filename = file.name.replace(/\.[^.]+$/, '') || 'image'
        return new File([blob], `${filename}.jpg`, { type: 'image/jpeg' })
      }

      if (quality > 0.48) {
        quality = Math.max(0.48, quality - 0.08)
      } else if (Math.max(width, height) > 640) {
        width = Math.max(1, Math.round(width * 0.82))
        height = Math.max(1, Math.round(height * 0.82))
        quality = initialQuality
      } else if (quality > 0.35) {
        quality = Math.max(0.35, quality - 0.04)
      } else if (Math.max(width, height) > 320) {
        width = Math.max(1, Math.round(width * 0.82))
        height = Math.max(1, Math.round(height * 0.82))
        quality = 0.45
      } else {
        throw new Error('无法将图片压缩到 1 MB 以下，请选择尺寸较小的图片')
      }
    }

    throw new Error('无法将图片压缩到 1 MB 以下，请选择尺寸较小的图片')
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
