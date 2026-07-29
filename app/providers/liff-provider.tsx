'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import liff from '@line/liff'

interface LiffContextType {
  isInitialized: boolean
  isLoggedIn: boolean
  userId: string | null
  displayName: string | null
  pictureUrl: string | null
  statusMessage: string | null
  error: string | null
}

const LiffContext = createContext<LiffContextType | undefined>(undefined)

export function LiffProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiffContextType>({
    isInitialized: false,
    isLoggedIn: false,
    userId: null,
    displayName: null,
    pictureUrl: null,
    statusMessage: null,
    error: null,
  })

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID
        if (!liffId) {
          console.warn('NEXT_PUBLIC_LIFF_ID is not set')
          setState(prev => ({
            ...prev,
            isInitialized: true,
            error: 'LIFF ID not configured',
          }))
          return
        }

        await liff.init({ liffId })

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile()
          setState(prev => ({
            ...prev,
            isInitialized: true,
            isLoggedIn: true,
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl ?? null,
            statusMessage: profile.statusMessage ?? null,
          }))
        } else {
          // ถ้าไม่ login ใน LINE app ให้ redirect ไปหน้า /order เลย
          setState(prev => ({
            ...prev,
            isInitialized: true,
            isLoggedIn: false,
          }))
        }
      } catch (error) {
        console.error('LIFF initialization error:', error)
        setState(prev => ({
          ...prev,
          isInitialized: true,
          error: error instanceof Error ? error.message : 'LIFF initialization failed',
        }))
      }
    }

    // ต้องมั่นใจว่า script โหลดมาแล้ว
    if (typeof window !== 'undefined') {
      initLiff()
    }
  }, [])

  return <LiffContext.Provider value={state}>{children}</LiffContext.Provider>
}

export function useLiff() {
  const context = useContext(LiffContext)
  if (context === undefined) {
    throw new Error('useLiff must be used within LiffProvider')
  }
  return context
}
