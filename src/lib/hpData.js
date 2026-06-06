// HP Data - Default data for company top page and 4 clinics
// Storage key for HP pages data
export const HP_PAGES_KEY = 'hp_pages_data'

export const COLOR_PALETTES = [
  {
    name: '森林の癒し',
    nameEn: 'Forest Healing',
    primaryColor: '#2D5A3D',
    secondaryColor: '#C9A84C',
    bgColor: '#F5F3EE',
    textColor: '#1A1A1A',
    accentColor: '#4A8A60',
  },
  {
    name: '桜の美容',
    nameEn: 'Sakura Beauty',
    primaryColor: '#9B6B7B',
    secondaryColor: '#F5D5B8',
    bgColor: '#FDF8F5',
    textColor: '#2A1A1F',
    accentColor: '#C48EA0',
  },
  {
    name: '深海の静寂',
    nameEn: 'Deep Ocean',
    primaryColor: '#1E3A5F',
    secondaryColor: '#4ECDC4',
    bgColor: '#F0F4F8',
    textColor: '#0F1E30',
    accentColor: '#2E5A8F',
  },
  {
    name: '秋の温もり',
    nameEn: 'Autumn Warmth',
    primaryColor: '#8B5E3C',
    secondaryColor: '#F2C078',
    bgColor: '#FDF6EE',
    textColor: '#2A1A0F',
    accentColor: '#B07D55',
  },
  {
    name: '紫の高貴',
    nameEn: 'Noble Purple',
    primaryColor: '#4A2D6B',
    secondaryColor: '#C9A84C',
    bgColor: '#F8F5FC',
    textColor: '#1A0F2A',
    accentColor: '#7A5BA0',
  },
  {
    name: '白磁の清潔',
    nameEn: 'White Porcelain',
    primaryColor: '#2C4A6B',
    secondaryColor: '#89CCC5',
    bgColor: '#FFFFFF',
    textColor: '#1A2A3A',
    accentColor: '#4A7A9B',
  },
]

const DEFAULT_SECTIONS = [
  { id: 'hero', name: 'ヒーロー', enabled: true, order: 0 },
  { id: 'about', name: '院について', enabled: true, order: 1 },
  { id: 'services', name: '施術内容', enabled: true, order: 2 },
  { id: 'features', name: '選ばれる理由', enabled: true, order: 3 },
  { id: 'hours', name: '診療時間', enabled: true, order: 4 },
  { id: 'access', name: 'アクセス', enabled: true, order: 5 },
  { id: 'blog', name: 'ブログ', enabled: true, order: 6 },
  { id: 'contact', name: 'お問い合わせ', enabled: true, order: 7 },
]

function makeDefaultData() {
  return {
    company: {
      name: '有限会社イトーメディカルケア',
      nameEn: 'Ito Medical Care Co., Ltd.',
      tagline: '地域の健康を、鍼灸で支える。',
      taglineEn: 'Supporting Regional Health Through Acupuncture',
      description:
        '有限会社イトーメディカルケアは、千葉県を中心に複数の鍼灸・整骨院を運営しております。伝統的な東洋医学と現代医療の知識を融合させ、地域の皆様の健康をサポートしてまいりました。経験豊富なスタッフが、お一人おひとりの症状に合わせた最適な施術を提供いたします。',
      philosophy:
        '「治療は技術だけでなく、心も大切」という理念のもと、患者様との信頼関係を第一に考えた施術を心がけております。',
      address: '千葉県',
      phone: '',
      email: '',
      established: '平成元年創業',
      clinicCount: 4,
      publishedAt: null,
      updatedAt: new Date().toISOString(),
    },
    clinics: [
      {
        id: 'ito-chiryoin',
        name: '伊東治療院',
        nameEn: 'Ito Acupuncture Clinic',
        tagline: '伝統の技と現代医療の融合',
        taglineEn: 'Where Tradition Meets Modern Medicine',
        description:
          '創業以来、地域の皆様の健康を支え続けてきた伝統ある鍼灸整骨院です。経験豊富なスタッフが、肩こり・腰痛から交通事故後のリハビリまで、幅広い症状に対応いたします。東洋医学の知恵と現代の医療技術を組み合わせた、丁寧な施術をご提供いたします。',
        aboutText:
          '伊東治療院は、地域密着型の鍼灸整骨院として長年にわたり患者様の健康をサポートしてまいりました。国家資格を持つ経験豊富なスタッフが、一人ひとりの症状を丁寧に診察し、最適な施術プランをご提案します。',
        phone: '043-XXX-XXXX',
        address: '千葉県 （詳細は院にお問い合わせください）',
        mapUrl: '',
        website: 'https://ito-chiryoin.com',
        hours: [
          { day: '月曜日', time: '9:00 - 12:30 / 14:30 - 18:30' },
          { day: '火曜日', time: '9:00 - 12:30 / 14:30 - 18:30' },
          { day: '水曜日', time: '9:00 - 12:30 / 14:30 - 18:30' },
          { day: '木曜日', time: '9:00 - 12:30 / 14:30 - 18:30' },
          { day: '金曜日', time: '9:00 - 12:30 / 14:30 - 18:30' },
          { day: '土曜日', time: '9:00 - 12:30' },
          { day: '日曜日・祝日', time: '休診' },
        ],
        services: [
          {
            id: 's1',
            name: '鍼灸治療',
            desc: '東洋医学に基づく伝統的な鍼・灸施術。肩こり、腰痛、頭痛など様々な症状に効果的です。',
            icon: '🎯',
          },
          {
            id: 's2',
            name: '整骨治療',
            desc: '骨格・筋肉のバランスを整える施術。姿勢の改善や慢性的な痛みの緩和に対応します。',
            icon: '🦴',
          },
          {
            id: 's3',
            name: '電気治療',
            desc: '低周波・干渉波などの電気刺激療法。痛みの緩和と血行促進に効果的な施術です。',
            icon: '⚡',
          },
          {
            id: 's4',
            name: 'マッサージ',
            desc: '筋肉の緊張をほぐし、血行を改善するマッサージ施術。疲労回復にも最適です。',
            icon: '👐',
          },
        ],
        features: [
          {
            id: 'f1',
            title: '経験豊富なスタッフ',
            desc: '国家資格を持つ熟練のスタッフが、丁寧に症状を診察し最適な施術をご提供します。',
          },
          {
            id: 'f2',
            title: '充実した設備',
            desc: '最新の医療機器と伝統的な施術器具を組み合わせ、効果的な治療を実現します。',
          },
          {
            id: 'f3',
            title: '地域密着のサポート',
            desc: '長年にわたり地域の皆様の健康を支え、アフターケアまで丁寧にフォローします。',
          },
        ],
        contactText: 'お気軽にお電話またはご来院ください。初診の方も安心してご相談いただけます。',
        theme: {
          primaryColor: '#2D5A3D',
          secondaryColor: '#C9A84C',
          bgColor: '#F5F3EE',
          textColor: '#1A1A1A',
          accentColor: '#4A8A60',
          layout: 'standard',
          fontStyle: 'serif',
          heroStyle: 'fullscreen',
          palette: '森林の癒し',
        },
        sections: DEFAULT_SECTIONS.map(s => ({ ...s })),
        heroTitle: '伊東治療院',
        heroSubtitle: '伝統の技で、あなたの健康を守る',
        heroCta: '無料相談はこちら',
        status: 'draft',
        publishedAt: null,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'harina-sodegaura',
        name: 'HaRi-na美容鍼袖ケ浦',
        nameEn: 'HaRi-na Beauty Acupuncture Sodegaura',
        tagline: '美しさを、内側から引き出す',
        taglineEn: 'Bringing Out Your Inner Beauty',
        description:
          '美容鍼灸の専門院として、お肌の悩みから小顔矯正まで、内側から美しさを引き出す施術を提供しています。伝統的な鍼灸の技術を美容に特化させた、現代女性のための新しい美容医療をご体験ください。',
        aboutText:
          'HaRi-na美容鍼袖ケ浦は、美容鍼灸に特化したサロンです。お肌のハリ・ツヤを取り戻したい方、小顔を目指したい方に、確かな技術と丁寧なカウンセリングでお応えします。',
        phone: '0438-XXX-XXXX',
        address: '千葉県袖ケ浦市 （詳細は院にお問い合わせください）',
        mapUrl: '',
        website: 'https://sodegaura-harina-biyobari.com',
        hours: [
          { day: '月曜日', time: '10:00 - 19:00' },
          { day: '火曜日', time: '10:00 - 19:00' },
          { day: '水曜日', time: '定休日' },
          { day: '木曜日', time: '10:00 - 19:00' },
          { day: '金曜日', time: '10:00 - 19:00' },
          { day: '土曜日', time: '9:00 - 18:00' },
          { day: '日曜日・祝日', time: '9:00 - 17:00' },
        ],
        services: [
          {
            id: 's1',
            name: '美容鍼',
            desc: '顔のツボに細い鍼を刺激し、肌のハリ・ツヤを引き出す美容施術。ナチュラルなアンチエイジング効果が期待できます。',
            icon: '✨',
          },
          {
            id: 's2',
            name: '小顔矯正',
            desc: '骨格・筋肉・リンパに働きかけ、フェイスラインをすっきりと整える施術です。',
            icon: '💎',
          },
          {
            id: 's3',
            name: 'アンチエイジング',
            desc: 'エイジングケアに特化した鍼灸施術。シワ・たるみ・くすみなどのお肌の悩みにアプローチします。',
            icon: '🌸',
          },
          {
            id: 's4',
            name: 'ボディケア',
            desc: '全身の気の流れを整え、体の内側から美しさを引き出すボディ鍼灸施術です。',
            icon: '🌿',
          },
        ],
        features: [
          {
            id: 'f1',
            title: '完全個室対応',
            desc: 'プライベートな空間で、リラックスして施術を受けていただける完全個室制を採用しています。',
          },
          {
            id: 'f2',
            title: '女性スタッフ在籍',
            desc: '女性のお悩みに寄り添える女性スタッフが在籍。安心してご相談いただけます。',
          },
          {
            id: 'f3',
            title: '丁寧なカウンセリング',
            desc: 'お一人おひとりの肌質・体質・お悩みに合わせた、オーダーメイドの施術プランをご提案します。',
          },
        ],
        contactText: 'ご予約はお電話またはオンラインにて承っております。初めての方もお気軽にご連絡ください。',
        theme: {
          primaryColor: '#9B6B7B',
          secondaryColor: '#F5D5B8',
          bgColor: '#FDF8F5',
          textColor: '#2A1A1F',
          accentColor: '#C48EA0',
          layout: 'centered',
          fontStyle: 'serif',
          heroStyle: 'split',
          palette: '桜の美容',
        },
        sections: DEFAULT_SECTIONS.map(s => ({ ...s })),
        heroTitle: 'HaRi-na美容鍼袖ケ浦',
        heroSubtitle: '美しさを、内側から引き出す鍼灸サロン',
        heroCta: 'ご予約・お問い合わせ',
        status: 'draft',
        publishedAt: null,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ito-shinkyu',
        name: 'イトー鍼灸院',
        nameEn: 'Ito Acupuncture Institute',
        tagline: '専門的な鍼灸で、体を根本から整える',
        taglineEn: 'Restoring Balance from the Root',
        description:
          '専門的な鍼灸施術を通じて、体の不調を根本から改善します。慢性的な痛みや自律神経の乱れ、内科的な症状まで幅広く対応いたします。',
        aboutText:
          'イトー鍼灸院では、東洋医学の原点に立ち返った本格的な鍼灸施術を提供しています。体全体のバランスを診ながら、症状の根本原因にアプローチします。',
        phone: '04X-XXX-XXXX',
        address: '千葉県 （詳細は院にお問い合わせください）',
        mapUrl: '',
        website: '',
        hours: [
          { day: '月曜日', time: '9:00 - 12:30 / 15:00 - 19:00' },
          { day: '火曜日', time: '9:00 - 12:30 / 15:00 - 19:00' },
          { day: '水曜日', time: '9:00 - 12:30' },
          { day: '木曜日', time: '9:00 - 12:30 / 15:00 - 19:00' },
          { day: '金曜日', time: '9:00 - 12:30 / 15:00 - 19:00' },
          { day: '土曜日', time: '9:00 - 13:00' },
          { day: '日曜日・祝日', time: '休診' },
        ],
        services: [
          {
            id: 's1',
            name: '本格鍼灸治療',
            desc: '東洋医学の理論に基づいた本格的な鍼灸施術。体質改善から症状緩和まで幅広く対応します。',
            icon: '🎯',
          },
          {
            id: 's2',
            name: '自律神経調整',
            desc: '自律神経のバランスを整える専門的な鍼灸施術。不眠・ストレス・疲労感の改善に効果的です。',
            icon: '🧘',
          },
          {
            id: 's3',
            name: '慢性疾患対応',
            desc: '頭痛・めまい・冷え性など慢性的な症状に対して、継続的な施術で根本改善を目指します。',
            icon: '🌿',
          },
          {
            id: 's4',
            name: 'スポーツ鍼灸',
            desc: 'アスリートのパフォーマンス向上やケガの予防・回復をサポートする専門施術です。',
            icon: '⚡',
          },
        ],
        features: [
          {
            id: 'f1',
            title: '専門的な知識と技術',
            desc: '東洋医学の深い知識と長年の経験に裏打ちされた、高度な鍼灸技術を提供します。',
          },
          {
            id: 'f2',
            title: '体質に合わせた施術',
            desc: '一人ひとりの体質・症状を詳しくヒアリングし、カスタマイズされた施術プランをご提案します。',
          },
          {
            id: 'f3',
            title: '継続的なサポート',
            desc: '単発の施術だけでなく、長期的な健康管理をサポートする継続施術プランをご用意しています。',
          },
        ],
        contactText: 'ご予約・ご相談はお電話にてお気軽にどうぞ。初診の方も丁寧に対応いたします。',
        theme: {
          primaryColor: '#1E3A5F',
          secondaryColor: '#4ECDC4',
          bgColor: '#F0F4F8',
          textColor: '#0F1E30',
          accentColor: '#2E5A8F',
          layout: 'standard',
          fontStyle: 'sans',
          heroStyle: 'fullscreen',
          palette: '深海の静寂',
        },
        sections: DEFAULT_SECTIONS.map(s => ({ ...s })),
        heroTitle: 'イトー鍼灸院',
        heroSubtitle: '体の奥から、本当の健康を取り戻す',
        heroCta: 'ご予約はこちら',
        status: 'draft',
        publishedAt: null,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ito-seikotsu',
        name: 'イトー整骨院',
        nameEn: 'Ito Orthopedic Clinic',
        tagline: '骨格から整える、体の本来の力を引き出す',
        taglineEn: 'Realigning Your Body for Natural Strength',
        description:
          '骨格・関節・筋肉の専門家として、体の歪みを整え、本来の動きを取り戻すための整骨施術を提供しています。交通事故後のリハビリから日常的な腰痛まで、幅広く対応いたします。',
        aboutText:
          'イトー整骨院は、骨格矯正と筋肉調整を専門とする整骨院です。体の歪みが引き起こす様々な不調に対して、根本的なアプローチで改善を目指します。',
        phone: '04X-XXX-XXXX',
        address: '千葉県 （詳細は院にお問い合わせください）',
        mapUrl: '',
        website: '',
        hours: [
          { day: '月曜日', time: '8:30 - 12:00 / 14:00 - 18:30' },
          { day: '火曜日', time: '8:30 - 12:00 / 14:00 - 18:30' },
          { day: '水曜日', time: '8:30 - 12:00 / 14:00 - 18:30' },
          { day: '木曜日', time: '8:30 - 12:00 / 14:00 - 18:30' },
          { day: '金曜日', time: '8:30 - 12:00 / 14:00 - 18:30' },
          { day: '土曜日', time: '8:30 - 13:00' },
          { day: '日曜日・祝日', time: '休診' },
        ],
        services: [
          {
            id: 's1',
            name: '骨格矯正',
            desc: '背骨・骨盤・関節の歪みを整える骨格矯正施術。姿勢改善や慢性的な痛みの解消に効果的です。',
            icon: '🦴',
          },
          {
            id: 's2',
            name: '交通事故対応',
            desc: '交通事故によるむち打ち・打撲・捻挫などのリハビリを専門的にサポートします。自賠責保険対応。',
            icon: '🚗',
          },
          {
            id: 's3',
            name: 'テーピング施術',
            desc: 'スポーツ障害や日常生活での怪我に対するテーピング施術。再発予防にも取り組みます。',
            icon: '🏃',
          },
          {
            id: 's4',
            name: '産後骨盤矯正',
            desc: '出産後の骨盤の歪みを整える専門施術。体型回復や腰痛改善をサポートします。',
            icon: '💕',
          },
        ],
        features: [
          {
            id: 'f1',
            title: '自賠責・労災保険対応',
            desc: '交通事故や労働災害による症状の治療に対応。保険手続きのサポートも丁寧に行います。',
          },
          {
            id: 'f2',
            title: '根本治療へのこだわり',
            desc: '痛みをただ取り除くのではなく、原因となる体の歪みから改善する根本治療を心がけています。',
          },
          {
            id: 'f3',
            title: '予防医学のアドバイス',
            desc: '施術後の生活指導やセルフケアのアドバイスで、症状の再発防止をサポートします。',
          },
        ],
        contactText: 'お気軽にご相談・ご予約ください。保険診療についてもお気軽にお問い合わせください。',
        theme: {
          primaryColor: '#8B5E3C',
          secondaryColor: '#F2C078',
          bgColor: '#FDF6EE',
          textColor: '#2A1A0F',
          accentColor: '#B07D55',
          layout: 'card',
          fontStyle: 'sans',
          heroStyle: 'minimal',
          palette: '秋の温もり',
        },
        sections: DEFAULT_SECTIONS.map(s => ({ ...s })),
        heroTitle: 'イトー整骨院',
        heroSubtitle: '骨格から整え、あなたらしい毎日を',
        heroCta: 'ご予約・お問い合わせ',
        status: 'draft',
        publishedAt: null,
        updatedAt: new Date().toISOString(),
      },
    ],
  }
}

export function getDefaultData() {
  return makeDefaultData()
}

export function loadHPData() {
  try {
    const v = localStorage.getItem(HP_PAGES_KEY)
    if (!v) return makeDefaultData()
    const saved = JSON.parse(v)
    // Merge with defaults to ensure new fields are present
    const defaults = makeDefaultData()
    return {
      company: { ...defaults.company, ...saved.company },
      clinics: defaults.clinics.map((defaultClinic) => {
        const savedClinic = (saved.clinics || []).find(c => c.id === defaultClinic.id)
        if (!savedClinic) return defaultClinic
        return {
          ...defaultClinic,
          ...savedClinic,
          theme: { ...defaultClinic.theme, ...savedClinic.theme },
          sections: savedClinic.sections || defaultClinic.sections,
        }
      }),
    }
  } catch {
    return makeDefaultData()
  }
}

export function saveHPData(data) {
  try {
    localStorage.setItem(HP_PAGES_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}
