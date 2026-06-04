export function calculateScore(prospect) {
  let score = 0
  const breakdown = []

  // HP無し: +30点
  if (!prospect.website_url || prospect.website_url.trim() === '') {
    score += 30
    breakdown.push({ label: 'ホームページ未開設', points: 30, reason: '集客機会の損失が最も大きい要因' })
  } else {
    // HP有りでも古い/簡素な可能性 (review数や評価で推測)
    if (prospect.review_count < 30) {
      score += 10
      breakdown.push({ label: 'HP集客力が低い可能性', points: 10, reason: '口コミ数から集客効果が限定的と推測' })
    }
  }

  // 口コミ数が少ない
  if (prospect.review_count < 30) {
    score += 25
    breakdown.push({ label: '口コミ数が少ない (30件未満)', points: 25, reason: '信頼性向上の余地が大きい' })
  } else if (prospect.review_count < 100) {
    score += 15
    breakdown.push({ label: '口コミ数が中程度 (30〜100件)', points: 15, reason: '更なる口コミ獲得で競合優位に' })
  } else if (prospect.review_count < 200) {
    score += 5
    breakdown.push({ label: '口コミ数は良好 (100〜200件)', points: 5, reason: '維持・強化の余地あり' })
  }

  // 評価が低い
  if (prospect.rating < 3.5) {
    score += 25
    breakdown.push({ label: '評価が低い (3.5未満)', points: 25, reason: '評判改善が急務' })
  } else if (prospect.rating < 4.0) {
    score += 15
    breakdown.push({ label: '評価が平均以下 (3.5〜4.0)', points: 15, reason: '競合との差別化が必要' })
  } else if (prospect.rating < 4.5) {
    score += 5
    breakdown.push({ label: '評価は良好 (4.0〜4.5)', points: 5, reason: 'さらなる評価向上で集客増加' })
  }

  // 業種ボーナス（医療系は弊社専門）
  const medicalIndustries = ['整骨院', '鍼灸院', '整体院']
  if (medicalIndustries.includes(prospect.industry)) {
    score += 5
    breakdown.push({ label: '医療・治療院（専門対応可）', points: 5, reason: '業界特化の提案が可能' })
  }

  // 100点でキャップ
  score = Math.min(score, 100)

  return { score, breakdown }
}
