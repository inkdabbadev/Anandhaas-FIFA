'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Sheet } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import type { Redemption } from '@/types'

/** Shows the one-time redemption QR that staff scan at the counter. */
export function RewardQR({ redemption, onClose }: { redemption: Redemption | null; onClose: () => void }) {
  const open = !!redemption
  const expires = redemption ? new Date(redemption.qr_expires_at) : null

  return (
    <Sheet open={open} onClose={onClose} labelledBy="qr-title">
      {redemption && (
        <div className="flex flex-col items-center pb-2 text-center">
          <h2 id="qr-title" className="font-serif text-lg font-bold text-dark">
            {redemption.reward?.title ?? 'Your reward'}
          </h2>
          <p className="mt-1 text-[11px] text-muted">Show this at any Anandhaas counter</p>

          <div className="my-5 rounded-2xl border border-border-2 bg-white p-5">
            <QRCodeSVG
              value={redemption.qr_code}
              size={180}
              fgColor="#1a140d"
              bgColor="#ffffff"
              level="M"
            />
          </div>

          <code className="rounded-lg bg-card px-3 py-1.5 text-sm font-semibold tracking-[2px] text-dark">
            {redemption.qr_code}
          </code>

          <div className="mt-4 flex items-center gap-2">
            <Badge variant={redemption.status === 'active' ? 'green' : 'muted'}>
              {redemption.status === 'active' ? 'Active' : redemption.status}
            </Badge>
            {expires && (
              <Badge variant="muted">
                Expires {expires.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Badge>
            )}
          </div>

          <p className="mt-4 max-w-xs text-[10px] leading-relaxed text-muted">
            This code is single-use and tied to your account. Once a staff member scans it, it’s
            marked redeemed and can’t be used again.
          </p>
        </div>
      )}
    </Sheet>
  )
}
