'use client'

import Image from 'next/image'
import { useActionState, useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createTeamAction, type CreateTeamState } from './actions'

const initialState: CreateTeamState = {
  status: 'idle',
  message: '',
}

export function TeamForm() {
  const [state, formAction, pending] = useActionState(createTeamAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (state.status !== 'success') return

    queueMicrotask(() => {
      formRef.current?.reset()

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setPreview('')
      setFileName('')
    })
  }, [state.status, state.message])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function selectFile(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return

    if (preview) URL.revokeObjectURL(preview)

    setPreview(URL.createObjectURL(file))
    setFileName(file.name)

    if (fileInputRef.current) {
      const transfer = new DataTransfer()
      transfer.items.add(file)
      fileInputRef.current.files = transfer.files
    }
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Team / country name" name="name" placeholder="Argentina" autoComplete="off" required />
        <Field
          label="Team code"
          name="code"
          placeholder="Optional, e.g. ARG"
          autoComplete="off"
          transform="uppercase"
        />
        <Field label="Flag API" name="flag_api" placeholder="https://..." autoComplete="off" type="url" required />
      </div>

      <div>
        <span className="mb-2 block text-sm font-semibold text-dark">Flag image</span>
        <label
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragging(false)
            selectFile(event.dataTransfer.files[0])
          }}
          className={cn(
            'flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-5 text-center transition',
            isDragging ? 'border-gold bg-gold-bg' : 'border-border-2 hover:border-gold-border hover:bg-gold-bg/60'
          )}
        >
          <input
            ref={fileInputRef}
            name="flag"
            type="file"
            accept="image/*"
            className="sr-only"
            required
            onChange={(event) => selectFile(event.target.files?.[0])}
          />

          {preview ? (
            <span className="flex w-full flex-col items-center gap-4">
              <span className="relative h-28 w-40 overflow-hidden rounded-xl border border-border bg-bg">
                <Image src={preview} alt="" fill sizes="160px" className="object-contain p-3" unoptimized />
              </span>
              <span className="flex max-w-full items-center gap-2 rounded-full border border-border bg-bg px-3 py-1.5 text-xs font-semibold text-mid">
                <ImagePlus className="h-4 w-4 shrink-0 text-gold" />
                <span className="truncate">{fileName}</span>
              </span>
            </span>
          ) : (
            <span className="flex flex-col items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-bg text-gold">
                <Upload className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-dark">Drop the team flag here</span>
                <span className="mt-1 block text-xs text-muted">The file will be saved as public/flag/CODE.ext</span>
              </span>
            </span>
          )}
        </label>
      </div>

      {state.message && (
        <div
          className={cn(
            'flex items-start gap-2 rounded-xl border px-4 py-3 text-sm',
            state.status === 'success'
              ? 'border-green-border bg-green-bg text-green'
              : 'border-red/20 bg-red-bg text-red'
          )}
        >
          {state.status === 'error' && <X className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{state.message}</span>
        </div>
      )}

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {pending ? 'Saving team...' : 'Add team'}
      </Button>
    </form>
  )
}

function Field({
  label,
  name,
  transform,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  name: string
  transform?: 'uppercase'
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-dark">{label}</span>
      <input
        name={name}
        className={cn(
          'h-12 w-full rounded-xl border border-border-2 bg-white px-3.5 text-sm text-dark outline-none transition placeholder:text-muted focus:border-gold focus:ring-2 focus:ring-gold/15',
          transform === 'uppercase' && 'uppercase'
        )}
        {...props}
      />
    </label>
  )
}
