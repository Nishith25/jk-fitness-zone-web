import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppLogo from '../components/AppLogo'

export default function Login() {
  const navigate = useNavigate()

  const [role, setRole] = useState('admin')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setErrorMessage('')

    try {
      const cleanedMobile =
        mobile.replace(/\D/g, '')

      if (cleanedMobile.length !== 10) {
        throw new Error(
          'Enter a valid 10-digit mobile number.'
        )
      }

      const loginEmail =
        `${cleanedMobile}@jkfitnesszone.com`

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        })

      if (error) {
        throw error
      }

      const user = data.user

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('staff_profiles')
        .select(`
          id,
          full_name,
          role,
          is_active
        `)
        .eq('id', user.id)
        .single()

      if (
        profileError ||
        !profile
      ) {
        await supabase.auth.signOut()

        throw new Error(
          'Staff profile not found.'
        )
      }

      if (!profile.is_active) {
        await supabase.auth.signOut()

        throw new Error(
          'This account has been disabled.'
        )
      }

      if (
        profile.role !== role
      ) {
        await supabase.auth.signOut()

        throw new Error(
          `This account is registered as ${profile.role}.`
        )
      }

      await supabase.rpc('log_staff_event', {
        event_action: 'login',
        event_details: {
          role: profile.role,
          portal: profile.role === 'admin'
            ? 'admin'
            : 'trainer',
          mobile: cleanedMobile,
        },
      })

      navigate(
        profile.role === 'admin'
          ? '/admin'
          : '/trainer'
      )
    } catch (error) {
      setErrorMessage(
        error.message ||
          'Unable to sign in.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mono-login-page">

      <div className="mono-login-shell">

        <div className="mono-login-brand">
          <AppLogo />
        </div>

        <main className="mono-login-card">

          <div className="mono-login-heading">

            <span>
              MANAGEMENT PORTAL
            </span>

            <h1>
              Welcome back.
            </h1>

            <p>
              Sign in to manage members, personal training and monthly collections.
            </p>

          </div>

          <div className="mono-role-switch">

            <button
              type="button"
              className={
                role === 'admin'
                  ? 'active'
                  : ''
              }
              onClick={() => {
                setRole('admin')
                setErrorMessage('')
              }}
            >
              Admin
            </button>

            <button
              type="button"
              className={
                role === 'trainer'
                  ? 'active'
                  : ''
              }
              onClick={() => {
                setRole('trainer')
                setErrorMessage('')
              }}
            >
              Trainer
            </button>

          </div>

          <form
            className="mono-login-form"
            onSubmit={handleSubmit}
          >

            <label>
              Mobile Number

              <div className="mono-phone-field">

                <span>
                  +91
                </span>

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength="10"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(
                      e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 10)
                    )
                  }
                  required
                />

              </div>
            </label>

            <label>
              Password

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                required
              />
            </label>

            {errorMessage && (
              <div className="mono-login-error">
                {errorMessage}
              </div>
            )}

            <button
              className="mono-login-submit"
              disabled={loading}
              type="submit"
            >
              {loading
                ? 'Signing in...'
                : `Sign in as ${
                    role === 'admin'
                      ? 'Admin'
                      : 'Trainer'
                  }`}
            </button>

          </form>

          <div className="mono-login-security">
            Secure access for JK Fitness Zone staff only
          </div>

        </main>

        <div className="mono-login-footer">
          JK FITNESS ZONE · INTERNAL MANAGEMENT SYSTEM
        </div>

      </div>

    </div>
  )
}
