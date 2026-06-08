import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export interface PlaceResult {
  place_id: string
  name: string
  formatted_address: string
  phone: string | null
  rating: number
  user_ratings_total: number
  website: string | null
  google_map_url: string
  has_website: boolean
  no_hp_probability: number
  web_presence_score: number
  competitor_gap_score: number
  sns_presence_score: number
  review_volume_score: number
  website_quality_score: number
  confidence_score: number
  priority_score: number
  reasoning: string
}

function calcScores(place: {
  website?: string
  user_ratings_total: number
  rating: number
}): Omit<PlaceResult, 'place_id' | 'name' | 'formatted_address' | 'phone' | 'rating' | 'user_ratings_total' | 'google_map_url'> {
  const hasWebsite = Boolean(place.website)

  const website_quality_score = hasWebsite ? 0.45 : 0.0
  const sns_presence_score = Math.min(place.user_ratings_total / 300, 0.8)
  const review_volume_score = Math.min(place.user_ratings_total / 150, 1.0)
  const competitor_gap_score = hasWebsite ? 0.25 : 0.85
  const confidence_score = 0.72
  const no_hp_probability = hasWebsite ? Math.max(0.1, 0.55 - website_quality_score) : 0.92

  const web_presence_score = parseFloat(
    (website_quality_score * 0.35 +
      sns_presence_score * 0.15 +
      review_volume_score * 0.15 +
      competitor_gap_score * 0.25 +
      confidence_score * 0.10).toFixed(3)
  )

  const contract_probability = no_hp_probability * 0.6 + 0.15
  const expected_revenue_uplift = 0.5
  const priority_score = parseFloat(
    (no_hp_probability * 0.30 +
      competitor_gap_score * 0.25 +
      expected_revenue_uplift * 0.25 +
      contract_probability * 0.20).toFixed(3)
  )

  const website_status = hasWebsite ? 'HP保有（品質確認要）' : 'HP未保有'
  const review_level =
    place.user_ratings_total >= 100 ? '口コミ多数' :
    place.user_ratings_total >= 30 ? '口コミあり' : '口コミ少'

  const reasoning =
    `評価${place.rating}点・口コミ${place.user_ratings_total}件。${website_status}。` +
    `${review_level}。Web集客力スコア${Math.round(web_presence_score * 100)}点。` +
    `HP未保有確率${Math.round(no_hp_probability * 100)}%・優先度${Math.round(priority_score * 100)}点。`

  return {
    website: place.website ?? null,
    has_website: hasWebsite,
    no_hp_probability,
    web_presence_score,
    competitor_gap_score,
    sns_presence_score,
    review_volume_score,
    website_quality_score,
    confidence_score,
    priority_score,
    reasoning,
  }
}

async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<{ website?: string; phone?: string }> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('fields', 'website,formatted_phone_number')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('language', 'ja')

  const res = await fetch(url.toString())
  if (!res.ok) return {}
  const data = await res.json()
  return {
    website: data.result?.website,
    phone: data.result?.formatted_phone_number,
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_PLACES_API_KEY が設定されていません' },
        { status: 503 }
      )
    }

    let body: { keyword: string; area: string; min_rating?: number; fetch_details?: boolean }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'リクエストの解析に失敗しました' }, { status: 400 })
    }

    const { keyword, area, min_rating = 4.0, fetch_details = true } = body

    if (!keyword || !area) {
      return NextResponse.json({ error: 'keyword と area は必須です' }, { status: 400 })
    }

    const query = `${keyword} ${area}`
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    searchUrl.searchParams.set('query', query)
    searchUrl.searchParams.set('key', apiKey)
    searchUrl.searchParams.set('language', 'ja')
    searchUrl.searchParams.set('region', 'jp')

    const searchRes = await fetch(searchUrl.toString())
    if (!searchRes.ok) {
      return NextResponse.json({ error: 'Google Places API エラー' }, { status: 502 })
    }

    const searchData = await searchRes.json()

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      return NextResponse.json(
        { error: `Places API: ${searchData.status} - ${searchData.error_message ?? ''}` },
        { status: 502 }
      )
    }

    const rawPlaces = (searchData.results ?? []) as Array<{
      place_id: string
      name: string
      formatted_address: string
      rating?: number
      user_ratings_total?: number
      url?: string
    }>

    const filtered = rawPlaces.filter((p) => (p.rating ?? 0) >= min_rating)

    const results: PlaceResult[] = await Promise.all(
      filtered.map(async (p) => {
        let details: { website?: string; phone?: string } = {}
        if (fetch_details) {
          try {
            details = await fetchPlaceDetails(p.place_id, apiKey)
          } catch {
            // continue with empty details if individual fetch fails
          }
        }
        const scores = calcScores({
          website: details.website,
          user_ratings_total: p.user_ratings_total ?? 0,
          rating: p.rating ?? 0,
        })

        return {
          place_id: p.place_id,
          name: p.name,
          formatted_address: p.formatted_address,
          phone: details.phone ?? null,
          rating: p.rating ?? 0,
          user_ratings_total: p.user_ratings_total ?? 0,
          google_map_url: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
          ...scores,
        }
      })
    )

    results.sort((a, b) => b.priority_score - a.priority_score)

    return NextResponse.json({
      results,
      total: results.length,
      query,
      status: searchData.status,
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
