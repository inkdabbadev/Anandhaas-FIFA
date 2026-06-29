'use server'

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

export type CreateTeamState = {
  status: 'idle' | 'success' | 'error'
  message: string
  flagUrl?: string
}

const initialState: CreateTeamState = {
  status: 'idle',
  message: '',
}

const extensionByMime: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
}

const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'])

export async function createTeamAction(
  previousState: CreateTeamState = initialState,
  formData: FormData
): Promise<CreateTeamState> {
  void previousState

  const name = String(formData.get('name') ?? '').trim()
  const codeInput = String(formData.get('code') ?? '').trim().toUpperCase()
  const country = name
  const flagApi = String(formData.get('flag_api') ?? '').trim()
  const flag = formData.get('flag')

  if (name.length < 2) {
    return { status: 'error', message: 'Enter the team or country name.' }
  }

  if (flagApi.length < 3) {
    return { status: 'error', message: 'Enter the flag API. It must have at least 3 characters.' }
  }

  const code = codeInput || flagApi.replace(/\/+$/, '').slice(-3).toUpperCase()

  if (!/^[A-Z0-9-]{2,16}$/.test(code)) {
    return {
      status: 'error',
      message: 'Use a 2-16 character code with letters, numbers, or hyphens, or end the flag API with a valid code.',
    }
  }

  if (!(flag instanceof File) || flag.size === 0) {
    return { status: 'error', message: 'Drop or choose a flag image.' }
  }

  if (!flag.type.startsWith('image/')) {
    return { status: 'error', message: 'The flag file must be an image.' }
  }

  const extension = getImageExtension(flag)
  if (!extension) {
    return { status: 'error', message: 'Use a flag image with jpg, png, webp, gif, avif, or svg extension.' }
  }

  const fileName = `${code}.${extension}`
  const flagUrl = `/flag/${fileName}`
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('teams')
    .insert({
      name,
      code,
      country,
      flag_url: flagUrl,
      flag_api: flagApi,
    })
    .select('id')
    .single()

  if (error || !data) {
    return {
      status: 'error',
      message: error?.message ?? 'Could not insert the team.',
    }
  }

  const flagDirectory = path.join(process.cwd(), 'public', 'flag')
  const flagPath = path.join(flagDirectory, fileName)

  try {
    await mkdir(flagDirectory, { recursive: true })
    await writeFile(flagPath, Buffer.from(await flag.arrayBuffer()))
  } catch (fileError) {
    await admin.from('teams').delete().eq('id', data.id)

    return {
      status: 'error',
      message:
        fileError instanceof Error
          ? `Team was not saved because the flag file could not be written: ${fileError.message}`
          : 'Team was not saved because the flag file could not be written.',
    }
  }

  revalidatePath('/admin/team')
  revalidatePath('/admin/matches')

  return {
    status: 'success',
    message: `${name} was added with flag ${flagUrl}.`,
    flagUrl,
  }
}

function getImageExtension(file: File): string | null {
  const originalExtension = file.name.split('.').pop()?.toLowerCase()

  if (originalExtension && allowedExtensions.has(originalExtension)) {
    return originalExtension === 'jpeg' ? 'jpg' : originalExtension
  }

  return extensionByMime[file.type] ?? null
}
