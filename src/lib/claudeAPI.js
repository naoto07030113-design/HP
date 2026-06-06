const API_URL = 'https://api.anthropic.com/v1/messages'

async function callClaude(apiKey, model, systemPrompt, userMessage, maxTokens = 2000) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `APIエラー: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}

export async function generateBlogArticle(apiKey, topic, options = {}) {
  const {
    model = 'claude-haiku-4-5-20251001',
    tone = '専門的でわかりやすい',
    wordCount = 800,
    category = '症状・疾患別',
  } = options

  const systemPrompt = `あなたは鍼灸専門院のベテランライターです。患者さんや健康に関心のある一般の方向けに、医療的に正確で読みやすいブログ記事を執筆してください。

必ず以下の形式で記事を出力してください（セクション区切り記号は必ず含めること）：

---TITLE---
魅力的で検索されやすいタイトル（30文字以内）

---EXCERPT---
記事の要約（80文字以内、検索結果に表示される説明文）

---CONTENT---
本文をMarkdown形式で記述する。
- ## で見出し（H2）
- ### で小見出し（H3）
- 適切なリスト（- を使用）
- **重要な単語**で強調
- 段落は空行で区切る

---TAGS---
タグ1,タグ2,タグ3,タグ4,タグ5

---KEYWORDS---
キーワード1,キーワード2,キーワード3`

  const userMessage = `カテゴリ「${category}」で、以下のトピックについて${tone}なトーンで約${wordCount}文字のブログ記事を書いてください。

トピック: ${topic}

※医療情報として正確であることを優先してください。
※読者が実際に役立てられる実践的な情報を含めてください。
※必ず上記の---TITLE---などのセクション形式を守ってください。`

  const text = await callClaude(apiKey, model, systemPrompt, userMessage, 3000)
  return parseGeneratedArticle(text, topic)
}

function parseGeneratedArticle(text, fallbackTopic) {
  const extract = (tag) => {
    const regex = new RegExp(`---${tag}---\\s*([\\s\\S]*?)(?=---[A-Z]+---|$)`)
    const match = text.match(regex)
    return match ? match[1].trim() : ''
  }

  const title = extract('TITLE') || fallbackTopic
  const excerpt = extract('EXCERPT') || ''
  const content = extract('CONTENT') || text
  const tagsRaw = extract('TAGS')
  const keywordsRaw = extract('KEYWORDS')

  return {
    title,
    excerpt,
    content,
    tags: tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [],
    seo: {
      title: title,
      description: excerpt,
      keywords: keywordsRaw ? keywordsRaw.split(',').map(k => k.trim()).filter(Boolean) : [],
    },
  }
}

export async function proofreadArticle(apiKey, title, content, model = 'claude-haiku-4-5-20251001') {
  const systemPrompt = `あなたは医療・健康コンテンツの専門校正者です。鍼灸ブログ記事の校正を行い、改善点を明確に指摘してください。

以下のカテゴリで分けて指摘してください：

## 【文章・表現】
誤字脱字、文法エラー、言い回しの改善

## 【医療情報の正確さ】
医学的に不正確または誤解を招く表現

## 【読みやすさ】
文章の流れ、構成、段落分けの改善

## 【SEO改善】
キーワードの使い方、タイトルの改善提案

最後に「## 総合評価」として5段階評価（⭐⭐⭐⭐⭐）と一言コメントを添えてください。

問題がない項目は「問題なし」と記載してください。`

  const userMessage = `以下の鍼灸ブログ記事を校正してください。

タイトル: ${title}

本文:
${content}`

  return await callClaude(apiKey, model, systemPrompt, userMessage, 2000)
}

export async function generateSEOMetadata(apiKey, title, content, model = 'claude-haiku-4-5-20251001') {
  const systemPrompt = `SEO専門家として、鍼灸ブログ記事のメタデータを最適化してください。
必ずJSON形式のみで返してください（他のテキストは不要）：
{
  "seoTitle": "SEO最適化されたタイトル（60文字以内）",
  "seoDescription": "メタディスクリプション（120文字以内）",
  "focusKeyword": "メインキーワード",
  "keywords": ["キーワード1", "キーワード2", "キーワード3"]
}`

  const userMessage = `以下の記事のSEOメタデータを生成してください。

タイトル: ${title}
本文（冒頭300文字）: ${content.substring(0, 300)}`

  const text = await callClaude(apiKey, model, systemPrompt, userMessage, 500)
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null
  } catch {
    return null
  }
}
