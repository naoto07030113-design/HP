import { z } from 'zod'

/** ログインの入力スキーマ。パスワードは長さだけを見る（内容はログにも出さない） */
export const loginSchema = z.object({
  email: z.string().trim().email('メールアドレスの形式が正しくありません').max(200),
  password: z.string().min(1, 'パスワードを入力してください').max(200),
})
export type LoginInput = z.infer<typeof loginSchema>
