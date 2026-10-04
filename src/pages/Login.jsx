import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dumbbell,
  LockKeyhole,
  Phone,
  ShieldCheck,
  UserRound
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()

  const [role, setRole] = useState('admin')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const formatIndianPhone = (number) => {
    const cleaned = number.replace(/\D/g, '')

    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+${cleaned}`
    }

    return `+91${cleaned}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setErrorMessage('')

    try {
      const cleanedMobile = mobile.replace(/\D/g, '')

      if (cleanedMobile.length !== 10) {
        throw new Error('Enter a valid 10-digit mobile number.')
      }

      const loginEmail = `${cleanedMobile}@jkfitnesszone.com`

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })

      if (error) {
        throw error
      }

      const user = data.user

      const { data: profile, error: profileError } = await supabase
        .from('staff_profiles')
        .select('id, full_name, role, is_active')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        await supabase.auth.signOut()
        throw new Error('Staff profile not found.')
      }

      if (!profile.is_active) {
        await supabase.auth.signOut()
        throw new Error('This account has been disabled.')
      }

      if (profile.role !== role) {
        await supabase.auth.signOut()

        throw new Error(
          `This account is registered as ${profile.role}. Select the correct login type.`
        )
      }

      if (profile.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/trainer')
      }
    } catch (error) {
      setErrorMessage(
        error.message || 'Unable to sign in. Check your mobile number and password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />

      <div className="login-shell">

        <section className="login-brand">
          <div className="brand-mark">
            <Dumbbell size={28} strokeWidth={2.2} />
          </div>

          <div className="brand-copy">
            <span>JK</span>
            <strong>FITNESS ZONE</strong>
          </div>
        </section>

        <main className="login-card">

          <div className="login-card-top">
            <p className="eyebrow">MANAGEMENT PORTAL</p>

            <h1>Welcome back.</h1>

            <p className="login-description">
              Sign in to manage members, personal training and monthly collections.
            </p>
          </div>

          <div className="role-switch">

            <button
              type="button"
              className={
                role === 'admin'
                  ? 'role-button active'
                  : 'role-button'
              }
              onClick={() => {
                setRole('admin')
                setErrorMessage('')
              }}
            >
              <ShieldCheck size={18} />
              Admin
            </button>

            <button
              type="button"
              className={
                role === 'trainer'
                  ? 'role-button active'
                  : 'role-button'
              }
              onClick={() => {
                setRole('trainer')
                setErrorMessage('')
              }}
            >
              <UserRound size={18} />
              Trainer
            </button>

          </div>

          <form onSubmit={handleSubmit}>

            <label className="field-label">
              Mobile Number

              <div className="input-wrap">

                <Phone size={18} />

                <span style={{
                  color: '#777',
                  fontSize: '14px',
                  whiteSpace: 'nowrap'
                }}>
                  +91
                </span>

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength="10"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    setMobile(value.slice(0, 10))
                  }}
                  required
                />

              </div>
            </label>

            <label className="field-label">
              Password

              <div className="input-wrap">

                <LockKeyhole size={18} />

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

              </div>
            </label>

            {errorMessage && (
              <div className="login-error">
                {errorMessage}
              </div>
            )}

            <button
              className="sign-in-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Signing in...'
                : `Sign in as ${
                    role === 'admin'
                      ? 'Admin'
                      : 'Trainer'
                  }`
              }
            </button>

          </form>

          <div className="login-security">
            <LockKeyhole size={14} />
            Secure access for JK Fitness Zone staff only
          </div>

        </main>

        <p className="login-footer">
          JK FITNESS ZONE · INTERNAL MANAGEMENT SYSTEM
        </p>

      </div>
    </div>
  )
}
