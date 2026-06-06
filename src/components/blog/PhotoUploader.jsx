import { useRef, useState, useCallback } from 'react'

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function PhotoUploader({ photos = [], onChange }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const addFiles = useCallback((files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) return

    Promise.all(
      imageFiles.map(file => new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve({
          id: genId(),
          data: e.target.result,
          caption: '',
          alt: file.name.replace(/\.[^.]+$/, ''),
          name: file.name,
          size: file.size,
        })
        reader.readAsDataURL(file)
      }))
    ).then(newPhotos => {
      onChange([...photos, ...newPhotos])
    })
  }, [photos, onChange])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  const handleFileInput = (e) => {
    addFiles(e.target.files)
    e.target.value = ''
  }

  const updateCaption = (id, caption) => {
    onChange(photos.map(p => p.id === id ? { ...p, caption } : p))
  }

  const removePhoto = (id) => {
    onChange(photos.filter(p => p.id !== id))
  }

  const movePhoto = (fromIdx, toIdx) => {
    const next = [...photos]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${dragging
            ? 'border-gold bg-gold-muted'
            : 'border-border hover:border-border-light hover:bg-surface-3'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="text-2xl mb-2">📷</div>
        <div className="text-sm text-gray-400">
          画像をドロップ、または<span className="text-gold">クリックして選択</span>
        </div>
        <div className="text-xs text-gray-600 mt-1">JPG, PNG, WebP対応</div>
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500 font-medium">
            添付画像 ({photos.length}枚) — 1枚目がアイキャッチになります
          </div>
          {photos.map((photo, idx) => (
            <div key={photo.id} className="flex gap-3 bg-surface-3 rounded-lg p-2 border border-border">
              <div className="relative flex-shrink-0">
                <img
                  src={photo.data}
                  alt={photo.caption || ''}
                  className="w-16 h-16 rounded object-cover"
                />
                {idx === 0 && (
                  <span className="absolute -top-1 -left-1 text-xs bg-gold text-black px-1 rounded font-bold">
                    TOP
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <input
                  type="text"
                  value={photo.caption}
                  onChange={(e) => updateCaption(photo.id, e.target.value)}
                  placeholder="キャプション（任意）"
                  className="w-full bg-surface-2 border border-border rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold/50"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600 truncate flex-1">{photo.name}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {idx > 0 && (
                      <button
                        onClick={() => movePhoto(idx, idx - 1)}
                        className="text-xs text-gray-500 hover:text-white px-1"
                        title="上に移動"
                      >↑</button>
                    )}
                    {idx < photos.length - 1 && (
                      <button
                        onClick={() => movePhoto(idx, idx + 1)}
                        className="text-xs text-gray-500 hover:text-white px-1"
                        title="下に移動"
                      >↓</button>
                    )}
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="text-xs text-red-500 hover:text-red-400 px-1"
                      title="削除"
                    >✕</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
