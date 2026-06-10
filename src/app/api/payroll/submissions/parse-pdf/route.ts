import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 })
  }

  const tmpPath = join(tmpdir(), `payroll_${Date.now()}.pdf`)

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    writeFileSync(tmpPath, buffer)

    // pdftotext で UTF-8 テキスト抽出
    const text = execSync(`pdftotext -layout -enc UTF-8 "${tmpPath}" -`, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    }).toString('utf-8')

    return NextResponse.json({ text })
  } catch (e) {
    return NextResponse.json(
      { error: `PDF解析失敗: ${String(e)}` },
      { status: 500 }
    )
  } finally {
    try { unlinkSync(tmpPath) } catch { /* ignore */ }
  }
}
