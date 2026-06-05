function getPainPoints(prospect) {
  const points = []
  if (!prospect.website_url) points.push('ホームページがない')
  if (prospect.review_count < 50) points.push('Googleの口コミが少ない')
  if (prospect.rating < 4.0) points.push('Google評価の改善余地がある')
  return points
}

function getIndustryTitle(industry) {
  const map = {
    '整骨院': '院長',
    '鍼灸院': '院長',
    '整体院': '院長',
    '美容室': 'オーナー',
    '飲食店': 'オーナー',
    '学習塾': '塾長',
  }
  return map[industry] || '担当者'
}

function getIndustrySuffix(industry) {
  const map = {
    '整骨院': '様',
    '鍼灸院': '様',
    '整体院': '様',
    '美容室': '様',
    '飲食店': '様',
    '学習塾': '様',
  }
  return map[industry] || '様'
}

export function generateEmail(prospect) {
  const title = getIndustryTitle(prospect.industry)
  const painPoints = getPainPoints(prospect)
  const hasWebsite = !!prospect.website_url
  const subject = hasWebsite
    ? `【無料診断】${prospect.store_name}様のWeb集客改善のご提案`
    : `【無料相談】${prospect.store_name}様のホームページ制作・集客支援のご提案`

  const painText = painPoints.length > 0
    ? `Googleマップにて${prospect.store_name}様を拝見し、${painPoints.join('・')}点が気になりました。`
    : `Googleマップにて${prospect.store_name}様の高評価を拝見し、さらなる集客向上のお手伝いができると思いご連絡しました。`

  return `件名：${subject}

${prospect.store_name} ${title}${getIndustrySuffix(prospect.industry)}

初めてご連絡させていただきます。
Web集客支援を専門とする、株式会社○○の山田と申します。

${painText}

弊社では、${prospect.industry}・医療系店舗専門の集客支援サービスを提供しており、
これまでに${prospect.industry}様を中心に100院以上の集客改善をお手伝いしてまいりました。

具体的には以下のような支援が可能です。
・ホームページ制作・リニューアル（${prospect.industry}専門デザイン）
・Google口コミ増加サポート
・SNS運用代行
・Web広告運用

まずは無料診断という形で、貴院の現状分析と具体的な改善提案をさせていただけないでしょうか。
費用は一切かかりません。30分ほどのお時間をいただければ幸いです。

ご検討のほど、どうぞよろしくお願い申し上げます。

────────────────────────────
株式会社○○ 営業部 山田 太郎
TEL: 03-XXXX-XXXX
MAIL: yamada@example.com
────────────────────────────`
}

export function generateDM(prospect) {
  const title = getIndustryTitle(prospect.industry)
  const painPoints = getPainPoints(prospect)
  const painText = painPoints.length > 0
    ? `${painPoints.join('・')}などの課題を解決できるかと思いご連絡しました。`
    : `さらなる集客向上のお役に立てると思いご連絡しました。`

  return `${prospect.store_name} ${title}様

はじめまして！
${prospect.industry}専門の集客支援をしている山田と申します😊

Googleマップで${prospect.store_name}様を拝見し、${painText}

弊社では${prospect.industry}様向けに
✅ HP制作・リニューアル
✅ Google口コミ増加
✅ SNS運用サポート
を月額定額でご提供しています。

まずは無料でご相談だけでも、いかがでしょうか？
お気軽にご返信ください！`
}

export function generatePhoneScript(prospect) {
  const title = getIndustryTitle(prospect.industry)
  const painPoints = getPainPoints(prospect)
  const painText = painPoints.length > 0
    ? painPoints.join('・') + 'といった点'
    : 'Web集客のさらなる改善'

  return `【電話営業台本】${prospect.store_name}様向け

■ オープニング（10秒）
「お忙しいところ失礼いたします。
私、Web集客支援の株式会社○○と申します。
${prospect.store_name}の${title}様はいらっしゃいますでしょうか？」

■ 導入（30秒）
「Googleマップにて${prospect.store_name}様を拝見し、
${painText}でお力になれるかと思いご連絡いたしました。
${prospect.industry}専門でWeb集客支援をしているのですが、
今少しだけお時間をいただいてもよろしいでしょうか？」

■ 課題のヒアリング（1〜2分）
「現在、新患様・新規のお客様の集客はどのようにされていますか？」
「ホームページやSNSはご活用されていますか？」
「Googleの口コミはご確認されていますか？」

■ 提案（1分）
「弊社では${prospect.industry}様専門で、
月額定額でHP制作・口コミ増加・SNS運用をまるごと支援しています。
導入後3ヶ月で新規集客が平均30%向上している実績があります。
一度、無料で現状診断だけでもさせていただけないでしょうか？」

■ クロージング
「まずはオンラインで30分、無料診断のお時間をいただけますか？
${prospect.phone ? '後ほどSMSでご案内URLをお送りしてもよろしいでしょうか？' : 'メールアドレスをお教えいただけますか？'}」

■ 断られた場合
「そうでございますか。貴重なお時間をいただきありがとうございました。
もしよろしければ、資料だけでもお送りさせていただけますか？」

■ ポイント
・${prospect.review_count < 50 ? '口コミが' + prospect.review_count + '件と少ない点を具体的に指摘する' : ''}
・${!prospect.website_url ? 'HPがない点を集客機会損失として伝える' : 'HP改善による集客アップ事例を紹介する'}
・評価スコア: ${prospect.ai_score}点（改善余地が大きいことをアピール）`
}
