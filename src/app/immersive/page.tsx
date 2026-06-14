import type { Metadata } from 'next'
import ImmersiveExperience from './ImmersiveExperience'

export const metadata: Metadata = {
  title: '夜に灯る家 — 没入型デジタルアート',
  description:
    'スクロールで巡る、光と影の建築。夕暮れの邸宅を旅する没入型デジタルアート体験。',
}

export default function ImmersivePage() {
  return <ImmersiveExperience />
}
