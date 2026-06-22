'use client'

/**
 * 画像ファイルを最大辺 maxDim px に縮小した JPEG の data URL に変換する。
 * OCR API へ送る前にアップロードサイズを抑えるために使う。
 */
export async function fileToResizedDataUrl(file: File, maxDim = 1600): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
    i.src = dataUrl
  })

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  if (scale === 1 && file.type === 'image/jpeg') return dataUrl

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.92)
}
