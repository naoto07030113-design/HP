// AES-256-GCM によるlocalStorage暗号化ユーティリティ
// 本番環境では NEXT_PUBLIC_ENCRYPTION_KEY 環境変数に強力なランダム値を設定すること

const DEFAULT_DEV_KEY = 'aoi-clinic-dev-key-change-in-production-!!!'
const ALGO = { name: 'AES-GCM', length: 256 } as const

let _key: CryptoKey | null = null

async function getCryptoKey(): Promise<CryptoKey> {
  if (_key) return _key
  const seed = process.env.NEXT_PUBLIC_ENCRYPTION_KEY ?? DEFAULT_DEV_KEY

  if (seed === DEFAULT_DEV_KEY) {
    console.warn('[secure-storage] NEXT_PUBLIC_ENCRYPTION_KEY が未設定です。本番環境では必ず設定してください。')
  }

  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed))
  _key = await crypto.subtle.importKey('raw', raw, ALGO, false, ['encrypt', 'decrypt'])
  return _key
}

function u8ToBase64(arr: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < arr.length; i += 8192) {
    binary += String.fromCharCode(...Array.from(arr.subarray(i, i + 8192)))
  }
  return btoa(binary)
}

function base64ToU8(b64: string): Uint8Array {
  const binary = atob(b64)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  return arr
}

/** データを AES-256-GCM で暗号化して localStorage に保存 */
export async function secureSet(storageKey: string, data: unknown): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const key = await getCryptoKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const plaintext = new TextEncoder().encode(JSON.stringify(data))
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
    const combined = new Uint8Array(12 + ciphertext.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(ciphertext), 12)
    localStorage.setItem(storageKey, u8ToBase64(combined))
  } catch (e) {
    // 容量超過などの場合は無音で失敗（メモリ上のデータは保持）
  }
}

/** localStorage から復号して返す。失敗時は null */
export async function secureGet<T>(storageKey: string): Promise<T | null> {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(storageKey)
  if (!stored) return null
  try {
    const key = await getCryptoKey()
    const combined = base64ToU8(stored)
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    return JSON.parse(new TextDecoder().decode(plaintext)) as T
  } catch {
    // 旧フォーマット（平文JSON）の移行対応
    try { return JSON.parse(stored) as T } catch { return null }
  }
}
