'use client'

import { useLiffUser } from '@/app/hooks/use-liff-user'
import { User, LogIn } from 'lucide-react'

export function LiffUserInfo() {
  const { isInitialized, isLoggedIn, displayName, pictureUrl } = useLiffUser()

  if (!isInitialized) {
    return null
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <LogIn className="w-4 h-4" />
        <span className="text-sm">ไม่ได้เข้า LINE</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {pictureUrl && (
        <img
          src={pictureUrl}
          alt={displayName || 'User'}
          className="w-8 h-8 rounded-full"
        />
      )}
      {!pictureUrl && <User className="w-5 h-5 text-gray-400" />}
      <span className="text-sm font-medium text-gray-900">{displayName}</span>
    </div>
  )
}
