import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const bookingSchema = z.object({
  date: z.string().min(1),
  menuId: z.string().min(1),
  staffId: z.string().min(1),
  referredBy: z.string().optional(),
})

type BookingInput = z.infer<typeof bookingSchema>

export default function PatientBooking() {
  const { register, handleSubmit, formState: { errors } } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
  })

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-xl font-bold text-forest">患者予約</h1>
      <form onSubmit={handleSubmit(console.log)} className="space-y-3 rounded-2xl border bg-white p-4">
        <input {...register('date')} type="date" className="w-full rounded-xl border p-3" />
        <select {...register('menuId')} className="w-full rounded-xl border p-3"><option value="">メニュー</option><option value="m1">美容鍼 75分</option></select>
        <select {...register('staffId')} className="w-full rounded-xl border p-3"><option value="">担当</option><option value="free">指名なし</option><option value="s1">田中先生</option></select>
        <input {...register('referredBy')} placeholder="紹介者氏名（任意）" className="w-full rounded-xl border p-3" />
        <button className="w-full rounded-xl bg-forest p-3 font-semibold text-white">予約する</button>
        {Object.values(errors).length > 0 && <p className="text-sm text-red-500">入力内容を確認してください</p>}
      </form>
    </main>
  )
}
