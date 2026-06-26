'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tokenGrantSchema } from '@/schemas'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import { ADMIN_USERS } from '@/lib/mock/admin-data'

type GrantInput = z.infer<typeof tokenGrantSchema>

export function ManualGrantForm() {
  const pushToast = useAppStore((s) => s.pushToast)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof tokenGrantSchema>, unknown, GrantInput>({
    resolver: zodResolver(tokenGrantSchema),
    defaultValues: { amount: 10 },
  })

  async function onSubmit(data: GrantInput) {
    await new Promise((r) => setTimeout(r, 500))
    const user = ADMIN_USERS.find((u) => u.id === data.userId)
    pushToast(`Granted ${data.amount} tokens to ${user?.name ?? data.userId}`, 'success')
    reset({ userId: '', amount: 10, note: '' })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <Field label="User" error={errors.userId?.message}>
        <select
          {...register('userId')}
          className="w-full rounded-lg border border-border-2 bg-bg px-3 py-2.5 text-sm text-dark focus:border-gold-border focus:outline-none"
        >
          <option value="">Select a user…</option>
          {ADMIN_USERS.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} · {u.phone}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Amount (negative to deduct)" error={errors.amount?.message}>
        <input
          type="number"
          {...register('amount')}
          className="w-full rounded-lg border border-border-2 bg-bg px-3 py-2.5 text-sm text-dark focus:border-gold-border focus:outline-none"
        />
      </Field>

      <Field label="Note" error={errors.note?.message}>
        <input
          {...register('note')}
          placeholder="e.g. Goodwill credit"
          className="w-full rounded-lg border border-border-2 bg-bg px-3 py-2.5 text-sm text-dark focus:border-gold-border focus:outline-none"
        />
      </Field>

      <Button type="submit" block disabled={isSubmitting}>
        {isSubmitting ? 'Granting…' : 'Grant tokens'}
      </Button>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-mid">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red">{error}</span>}
    </label>
  )
}
