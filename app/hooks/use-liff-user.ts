import { useLiff } from '@/app/providers/liff-provider'

export function useLiffUser() {
  const { isInitialized, isLoggedIn, userId, displayName, pictureUrl, statusMessage } = useLiff()

  return {
    isInitialized,
    isLoggedIn,
    userId,
    displayName,
    pictureUrl,
    statusMessage,
    isInLineApp: isLoggedIn && userId,
  }
}
