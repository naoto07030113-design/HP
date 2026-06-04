import CSVImporter from '../components/import/CSVImporter.jsx'

export default function Import() {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="text-xs text-gray-500">
        GoogleマップからエクスポートしたCSVや、既存の顧客リストを取り込めます。
      </div>
      <CSVImporter />
    </div>
  )
}
