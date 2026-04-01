'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

export function useSubscription() {
  const { user, isLoaded } = useUser()
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false)
      return
    }

    supabase
      .from('users')
      .select('subscription_status, trial_end')
      .eq('clerk_id', user.id)
      .single()
      .then(({ data }) => {
        setStatus(data?.subscription_status ?? null)
        setLoading(false)
      })
  }, [user, isLoaded])

  const openPortal = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  return {
    status,
    loading,
    isActive: status === 'active' || status === 'trialing',
    openPortal,
  }
}
