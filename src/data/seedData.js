import { calculateScore } from '../lib/aiScoring.js'

const RAW = [
  // 整骨院 (10件)
  { store_name: '山田整骨院', address: '東京都新宿区西新宿2-1-1', phone: '03-3340-0001', website_url: '', rating: 3.8, review_count: 24, industry: '整骨院', assigned_to: '山田太郎', status: '未接触', deal_value: 120000 },
  { store_name: 'さくら整骨院', address: '東京都渋谷区渋谷1-5-3', phone: '03-3409-0002', website_url: 'https://sakura-seikotsu.jp', rating: 4.2, review_count: 87, industry: '整骨院', assigned_to: '鈴木花子', status: '営業中', deal_value: 150000 },
  { store_name: '青山整骨院', address: '東京都港区南青山3-2-8', phone: '03-3400-0003', website_url: '', rating: 3.5, review_count: 18, industry: '整骨院', assigned_to: '山田太郎', status: '返信あり', deal_value: 180000 },
  { store_name: 'ひまわり整骨院', address: '神奈川県横浜市中区山下町1-2', phone: '045-210-0004', website_url: 'https://himawari-seikotsu.com', rating: 4.5, review_count: 156, industry: '整骨院', assigned_to: '佐藤健', status: '商談', deal_value: 200000 },
  { store_name: '大阪北整骨院', address: '大阪府大阪市北区梅田1-3-1', phone: '06-6341-0005', website_url: '', rating: 3.2, review_count: 12, industry: '整骨院', assigned_to: '鈴木花子', status: '未接触', deal_value: 120000 },
  { store_name: 'みどり整骨院', address: '愛知県名古屋市中区栄2-4-5', phone: '052-241-0006', website_url: 'https://midori-seikou.jp', rating: 4.1, review_count: 63, industry: '整骨院', assigned_to: '山田太郎', status: '成約', deal_value: 160000 },
  { store_name: '福岡中央整骨院', address: '福岡県福岡市中央区天神1-2-3', phone: '092-711-0007', website_url: '', rating: 3.9, review_count: 41, industry: '整骨院', assigned_to: '佐藤健', status: '未接触', deal_value: 130000 },
  { store_name: 'きずな整骨院', address: '埼玉県さいたま市大宮区桜木町1-5', phone: '048-641-0008', website_url: '', rating: 4.0, review_count: 29, industry: '整骨院', assigned_to: '山田太郎', status: '営業中', deal_value: 140000 },
  { store_name: '太陽整骨院', address: '千葉県千葉市中央区富士見2-7', phone: '043-221-0009', website_url: 'https://taiyou-seiko.com', rating: 3.7, review_count: 55, industry: '整骨院', assigned_to: '鈴木花子', status: '失注', deal_value: 0 },
  { store_name: '北海道整骨院', address: '北海道札幌市中央区北一条西4-1', phone: '011-231-0010', website_url: '', rating: 4.3, review_count: 91, industry: '整骨院', assigned_to: '佐藤健', status: '未接触', deal_value: 150000 },

  // 鍼灸院 (8件)
  { store_name: '東洋医学院', address: '東京都文京区本郷3-1-2', phone: '03-3814-0011', website_url: '', rating: 4.4, review_count: 43, industry: '鍼灸院', assigned_to: '山田太郎', status: '未接触', deal_value: 180000 },
  { store_name: '和漢鍼灸院', address: '京都府京都市中京区河原町通四条上ル', phone: '075-211-0012', website_url: 'https://wakan-acupuncture.jp', rating: 4.6, review_count: 212, industry: '鍼灸院', assigned_to: '鈴木花子', status: '商談', deal_value: 220000 },
  { store_name: '横浜鍼灸院', address: '神奈川県横浜市西区高島2-1', phone: '045-441-0013', website_url: '', rating: 3.6, review_count: 19, industry: '鍼灸院', assigned_to: '山田太郎', status: '営業中', deal_value: 160000 },
  { store_name: '松本鍼灸治療院', address: '長野県松本市中央1-2-3', phone: '0263-32-0014', website_url: 'https://matsumoto-hari.com', rating: 4.8, review_count: 134, industry: '鍼灸院', assigned_to: '佐藤健', status: '未接触', deal_value: 200000 },
  { store_name: '癒しの鍼灸院', address: '大阪府大阪市心斎橋筋1-7-1', phone: '06-6212-0015', website_url: '', rating: 3.4, review_count: 8, industry: '鍼灸院', assigned_to: '鈴木花子', status: '未接触', deal_value: 140000 },
  { store_name: '仙台鍼灸整体', address: '宮城県仙台市青葉区一番町3-2-1', phone: '022-261-0016', website_url: '', rating: 4.0, review_count: 37, industry: '鍼灸院', assigned_to: '山田太郎', status: '返信あり', deal_value: 170000 },
  { store_name: '神戸漢方鍼灸', address: '兵庫県神戸市中央区三宮町1-1-2', phone: '078-321-0017', website_url: 'https://kobe-kanpo.jp', rating: 4.2, review_count: 78, industry: '鍼灸院', assigned_to: '佐藤健', status: '未接触', deal_value: 180000 },
  { store_name: '広島鍼灸院', address: '広島県広島市中区紙屋町1-2-22', phone: '082-241-0018', website_url: '', rating: 3.9, review_count: 25, industry: '鍼灸院', assigned_to: '鈴木花子', status: '営業中', deal_value: 150000 },

  // 整体院 (8件)
  { store_name: 'ボディケア整体院', address: '東京都豊島区池袋2-37-1', phone: '03-3985-0019', website_url: '', rating: 3.8, review_count: 32, industry: '整体院', assigned_to: '山田太郎', status: '未接触', deal_value: 130000 },
  { store_name: '姿勢矯正センター', address: '東京都目黒区自由が丘1-10-5', phone: '03-3717-0020', website_url: 'https://shisei-kyosei.com', rating: 4.3, review_count: 98, industry: '整体院', assigned_to: '佐藤健', status: '成約', deal_value: 180000 },
  { store_name: '名古屋整体院', address: '愛知県名古屋市名東区本郷1-5', phone: '052-701-0021', website_url: '', rating: 3.5, review_count: 14, industry: '整体院', assigned_to: '鈴木花子', status: '未接触', deal_value: 120000 },
  { store_name: 'りらくる整体', address: '大阪府大阪市浪速区難波中1-1-3', phone: '06-6633-0022', website_url: '', rating: 4.1, review_count: 167, industry: '整体院', assigned_to: '山田太郎', status: '営業中', deal_value: 160000 },
  { store_name: '脊柱管整体院', address: '神奈川県横浜市保土ケ谷区天王町1-2', phone: '045-331-0023', website_url: 'https://sekichuukan-seitai.jp', rating: 4.5, review_count: 203, industry: '整体院', assigned_to: '佐藤健', status: '未接触', deal_value: 200000 },
  { store_name: '福岡整体センター', address: '福岡県福岡市博多区博多駅前2-1', phone: '092-431-0024', website_url: '', rating: 3.7, review_count: 21, industry: '整体院', assigned_to: '鈴木花子', status: '返信あり', deal_value: 140000 },
  { store_name: '癒し整体房', address: '埼玉県川越市菓子屋横丁2-1', phone: '049-222-0025', website_url: '', rating: 4.0, review_count: 44, industry: '整体院', assigned_to: '山田太郎', status: '商談', deal_value: 170000 },
  { store_name: '京都整体院', address: '京都府京都市下京区烏丸通七条下ル', phone: '075-341-0026', website_url: 'https://kyoto-seitai.com', rating: 4.4, review_count: 119, industry: '整体院', assigned_to: '佐藤健', status: '未接触', deal_value: 190000 },

  // 美容室 (10件)
  { store_name: 'ヘアサロン銀座', address: '東京都中央区銀座5-6-1', phone: '03-3569-0027', website_url: 'https://hairsalon-ginza.jp', rating: 4.7, review_count: 284, industry: '美容室', assigned_to: '鈴木花子', status: '未接触', deal_value: 250000 },
  { store_name: 'Clair hair', address: '東京都世田谷区三軒茶屋2-1-3', phone: '03-3487-0028', website_url: '', rating: 3.9, review_count: 47, industry: '美容室', assigned_to: '山田太郎', status: '営業中', deal_value: 180000 },
  { store_name: 'ビューティーカット', address: '神奈川県川崎市川崎区砂子1-3', phone: '044-211-0029', website_url: '', rating: 3.6, review_count: 23, industry: '美容室', assigned_to: '佐藤健', status: '未接触', deal_value: 150000 },
  { store_name: 'Style Osaka', address: '大阪府大阪市西区南堀江1-2-8', phone: '06-6531-0030', website_url: 'https://style-osaka.com', rating: 4.3, review_count: 105, industry: '美容室', assigned_to: '鈴木花子', status: '成約', deal_value: 220000 },
  { store_name: 'ヘアーデザインMIKA', address: '東京都杉並区阿佐谷南2-5-1', phone: '03-3312-0031', website_url: '', rating: 4.0, review_count: 39, industry: '美容室', assigned_to: '山田太郎', status: '未接触', deal_value: 160000 },
  { store_name: 'モダンヘアー', address: '愛知県名古屋市千種区覚王山通6-1', phone: '052-762-0032', website_url: '', rating: 3.8, review_count: 16, industry: '美容室', assigned_to: '佐藤健', status: '営業中', deal_value: 140000 },
  { store_name: 'ナチュラルカット', address: '京都府京都市左京区岡崎西天王町1', phone: '075-771-0033', website_url: 'https://natural-cut-kyoto.jp', rating: 4.6, review_count: 178, industry: '美容室', assigned_to: '鈴木花子', status: '未接触', deal_value: 230000 },
  { store_name: 'アンリミテッドヘア', address: '福岡県福岡市中央区大名2-1-1', phone: '092-761-0034', website_url: '', rating: 4.1, review_count: 62, industry: '美容室', assigned_to: '山田太郎', status: '返信あり', deal_value: 180000 },
  { store_name: 'さっぽろビューティー', address: '北海道札幌市中央区南一条西5-1', phone: '011-241-0035', website_url: '', rating: 3.5, review_count: 11, industry: '美容室', assigned_to: '佐藤健', status: '未接触', deal_value: 120000 },
  { store_name: 'ルミエールヘア', address: '東京都新宿区新宿3-1-26', phone: '03-3354-0036', website_url: 'https://lumiere-hair.jp', rating: 4.4, review_count: 231, industry: '美容室', assigned_to: '鈴木花子', status: '商談', deal_value: 260000 },

  // 飲食店 (8件)
  { store_name: 'ラーメン一番', address: '東京都江東区亀戸1-3-5', phone: '03-3682-0037', website_url: '', rating: 4.2, review_count: 312, industry: '飲食店', assigned_to: '山田太郎', status: '未接触', deal_value: 200000 },
  { store_name: '和食処さとう', address: '東京都台東区浅草1-28-3', phone: '03-3842-0038', website_url: 'https://washoku-sato.com', rating: 3.9, review_count: 67, industry: '飲食店', assigned_to: '佐藤健', status: '営業中', deal_value: 180000 },
  { store_name: '大阪焼肉苑', address: '大阪府大阪市中央区道頓堀1-6-7', phone: '06-6213-0039', website_url: '', rating: 3.6, review_count: 28, industry: '飲食店', assigned_to: '鈴木花子', status: '未接触', deal_value: 220000 },
  { store_name: 'カフェ緑の丘', address: '神奈川県鎌倉市小町2-3-1', phone: '0467-22-0040', website_url: 'https://cafe-midori.jp', rating: 4.5, review_count: 189, industry: '飲食店', assigned_to: '山田太郎', status: '成約', deal_value: 250000 },
  { store_name: '博多ラーメン天神', address: '福岡県福岡市中央区天神2-1-22', phone: '092-741-0041', website_url: '', rating: 4.0, review_count: 143, industry: '飲食店', assigned_to: '佐藤健', status: '未接触', deal_value: 190000 },
  { store_name: '京都懐石一倉', address: '京都府京都市東山区祇園町北側334', phone: '075-541-0042', website_url: 'https://kaiseki-ichikura.com', rating: 4.8, review_count: 276, industry: '飲食店', assigned_to: '鈴木花子', status: '未接触', deal_value: 300000 },
  { store_name: '名古屋コーチン料理店', address: '愛知県名古屋市熱田区神宮2-3', phone: '052-671-0043', website_url: '', rating: 3.7, review_count: 34, industry: '飲食店', assigned_to: '山田太郎', status: '返信あり', deal_value: 210000 },
  { store_name: 'バル横丁', address: '東京都渋谷区代官山町8-1', phone: '03-3770-0044', website_url: '', rating: 4.1, review_count: 95, industry: '飲食店', assigned_to: '佐藤健', status: '営業中', deal_value: 180000 },

  // 学習塾 (6件)
  { store_name: '東進学習塾', address: '東京都千代田区神田神保町1-1', phone: '03-3291-0045', website_url: 'https://toshin-juku.jp', rating: 4.3, review_count: 156, industry: '学習塾', assigned_to: '鈴木花子', status: '未接触', deal_value: 300000 },
  { store_name: '個別指導ラーニング', address: '神奈川県横浜市青葉区青葉台1-3', phone: '045-981-0046', website_url: '', rating: 3.8, review_count: 22, industry: '学習塾', assigned_to: '山田太郎', status: '営業中', deal_value: 250000 },
  { store_name: 'みらい塾', address: '大阪府大阪市東淀川区東淡路1-1', phone: '06-6323-0047', website_url: '', rating: 4.1, review_count: 41, industry: '学習塾', assigned_to: '佐藤健', status: '未接触', deal_value: 280000 },
  { store_name: '名進研', address: '愛知県名古屋市東区泉1-14-15', phone: '052-931-0048', website_url: 'https://meisinken.jp', rating: 4.5, review_count: 234, industry: '学習塾', assigned_to: '鈴木花子', status: '商談', deal_value: 350000 },
  { store_name: '学力向上ゼミ', address: '埼玉県さいたま市浦和区高砂3-1', phone: '048-831-0049', website_url: '', rating: 3.5, review_count: 9, industry: '学習塾', assigned_to: '山田太郎', status: '未接触', deal_value: 240000 },
  { store_name: '仙台英進ゼミ', address: '宮城県仙台市若林区卸町5-3', phone: '022-381-0050', website_url: '', rating: 4.0, review_count: 53, industry: '学習塾', assigned_to: '佐藤健', status: '返信あり', deal_value: 270000 },
]

const TODAY = new Date()
function daysAgo(n) {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export const SEED_DATA = RAW.map((item, i) => {
  const { score, breakdown } = calculateScore(item)
  const isContacted = item.status !== '未接触'
  return {
    id: `seed-${String(i + 1).padStart(3, '0')}`,
    ...item,
    ai_score: score,
    ai_score_breakdown: breakdown,
    first_contact_date: isContacted ? daysAgo(Math.floor(Math.random() * 60) + 5) : null,
    last_contact_date: isContacted ? daysAgo(Math.floor(Math.random() * 10)) : null,
    notes: '',
    created_at: daysAgo(Math.floor(Math.random() * 90)),
    updated_at: daysAgo(Math.floor(Math.random() * 10)),
  }
})
