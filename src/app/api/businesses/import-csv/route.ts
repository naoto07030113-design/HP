import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()
  const rows: Record<string, string>[] = body.rows

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'データがありません' }, { status: 400 })
  }

  const businesses = rows.map((row) => ({
    name: row['事業者名'] ?? row['name'] ?? '',
    industry: row['業種'] ?? row['industry'] ?? null,
    address: row['住所'] ?? row['address'] ?? null,
    phone: row['電話'] ?? row['phone'] ?? null,
    email: row['メール'] ?? row['email'] ?? null,
    website_url: row['HP'] ?? row['website_url'] ?? null,
    google_map_url: row['GoogleMapURL'] ?? row['google_map_url'] ?? null,
    source_name: row['情報取得元'] ?? row['source_name'] ?? null,
  })).filter((b) => b.name)

  const { data, error } = await supabase
    .from('businesses')
    .insert(businesses)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ count: data?.length ?? 0, businesses: data })
}
