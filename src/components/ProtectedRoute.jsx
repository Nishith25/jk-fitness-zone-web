import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ role, children }) {
  const [state, setState] = useState({
    loading: true,
    allowed: false,
  })

  useEffect(() => {
    let mounted = true

    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        if (mounted) {
          setState({ loading: false, allowed: false })
        }
        return
      }

      const { data: profile } = await supabase
        .from('staff_profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single()

      if (mounted) {
        setState({
          loading: false,
          allowed:
            Boolean(profile?.is_active) &&
            profile?.role === role,
        })
      }
    }

    checkAccess()

    return () => {
      mounted = false
    }
  }, [role])

  if (state.loading) {
    return (
      <div className="screen-loader">
        <div className="loader-ring" />
        <span>Loading JK Fitness Zone...</span>
      </div>
    )
  }

  if (!state.allowed) {
    return <Navigate to="/" replace />
  }

  return children
}
