/**
 * 患者向け予約サイトの背景。
 * ゆっくり漂う3つの光のかたまりを敷いて、白い画面の単調さをやわらげる。
 * transform / opacity だけで動かすため描画負荷は低く、
 * OS側で「動きを減らす」設定をしている方には静止して見える（globals.css 側で制御）。
 */
export function AmbientBackground() {
  return (
    <div className="rs-aurora" aria-hidden>
      <div className="rs-blob rs-blob-1" />
      <div className="rs-blob rs-blob-2" />
      <div className="rs-blob rs-blob-3" />
    </div>
  )
}
