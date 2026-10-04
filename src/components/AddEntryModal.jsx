import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  MEMBERSHIP_DURATIONS,
  calculateExpiryDate,
} from '../utils/membershipDuration'

const emptyForm = {
  customer_name: '',
  trainer_id: '',
  joined_on: new Date().toISOString().split('T')[0],

  gym_fee_paid: false,
      gym_same_as_pt: false,
      gym_amount: '',
  gym_start: '',
  gym_end: '',

  pt_amount: '',
  pt_start: '',
  pt_end: '',

  payment_status: 'paid',
  payment_mode: 'cash',
  amount_paid: '',
  notes: '',
}

export default function AddEntryModal({
  open,
  onClose,
  onSaved,
  currentUserId,
  currentRole,
}) {
  const [form, setForm] = useState(emptyForm)
  const [trainers, setTrainers] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return

    async function loadTrainers() {
      if (currentRole === 'trainer') {
        setForm((prev) => ({
          ...prev,
          trainer_id: currentUserId,
        }))
        return
      }

      const { data } = await supabase
        .from('staff_profiles')
        .select('id, full_name')
        .eq('role', 'trainer')
        .eq('is_active', true)
        .order('full_name')

      setTrainers(data || [])
    }

    loadTrainers()
  }, [open, currentRole, currentUserId])

  const gymAmount = Number(form.gym_amount || 0)
  const ptAmount = Number(form.pt_amount || 0)

  const gymEnabled = Boolean(form.gym_fee_paid)
  const ptEnabled = ptAmount > 0

  const preview = useMemo(() => {
    const hasGym = gymAmount > 0
    const hasPT = ptAmount > 0

    const overlap =
      hasGym &&
      hasPT &&
      form.gym_start &&
      form.gym_end &&
      form.pt_start &&
      form.pt_end &&
      form.gym_start <= form.pt_end &&
      form.pt_start <= form.gym_end

    if (overlap) {
      const total = gymAmount + ptAmount

      return {
        rule: 'Gym + PT active together',
        admin: total * 0.5,
        trainer: total * 0.5,
        text: '50% / 50%',
      }
    }

    if (hasPT) {
      return {
        rule: hasGym
          ? 'Gym + PT do not overlap'
          : 'PT only',
        admin: gymAmount + ptAmount * 0.6,
        trainer: ptAmount * 0.4,
        text: hasGym
          ? 'Gym 100% + PT 60/40'
          : 'PT 60% / 40%',
      }
    }

    return {
      rule: 'Gym only',
      admin: gymAmount,
      trainer: 0,
      text: '100% JK Fitness Zone',
    }
  }, [
    gymAmount,
    ptAmount,
    form.gym_start,
    form.gym_end,
    form.pt_start,
    form.pt_end,
  ])

  function update(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setSaving(true)
    setError('')

    try {
      if (!form.customer_name.trim()) {
        throw new Error('Customer name is required.')
      }

      if (gymAmount <= 0 && ptAmount <= 0) {
        throw new Error(
          'Enter at least Gym amount or PT amount.'
        )
      }

      if (gymAmount > 0) {
        if (!form.gym_start || !form.gym_end) {
          throw new Error(
            'Gym start and expiry dates are required.'
          )
        }
      }

      if (ptAmount > 0) {
        if (!form.pt_start || !form.pt_end) {
          throw new Error(
            'PT start and expiry dates are required.'
          )
        }
      }

      if (
        currentRole === 'trainer' &&
        !currentUserId
      ) {
        throw new Error('Trainer account not found.')
      }

      const payload = {
        customer_name: form.customer_name.trim(),
        trainer_id:
          currentRole === 'trainer'
            ? currentUserId
            : form.trainer_id || null,

        joined_on: form.joined_on,

        gym_amount: gymAmount,
        gym_start:
          gymAmount > 0
            ? form.gym_start
            : null,
        gym_end:
          gymAmount > 0
            ? form.gym_end
            : null,

        pt_amount: ptAmount,
        pt_start:
          ptAmount > 0
            ? form.pt_start
            : null,
        pt_end:
          ptAmount > 0
            ? form.pt_end
            : null,

        payment_status: form.payment_status,
        payment_mode: form.payment_mode,

        amount_paid:
          Number(form.amount_paid || 0),

        notes:
          form.notes.trim() || null,
      }

      const { error: insertError } = await supabase
        .from('member_entries')
        .insert(payload)

      if (insertError) {
        throw insertError
      }

      setForm(emptyForm)
      onSaved?.()
      onClose()
    } catch (err) {
      setError(
        err.message || 'Unable to save entry.'
      )
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (
      form.gym_fee_paid &&
      form.gym_same_as_pt
    ) {
      setForm((prev) => ({
        ...prev,
        gym_start: prev.pt_start || '',
        gym_end: prev.pt_end || '',
      }))
    }
  }, [
    form.gym_fee_paid,
    form.gym_same_as_pt,
    form.pt_start,
    form.pt_end,
  ])

  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="entry-modal">

        <div className="modal-header">
          <div>
            <span className="section-kicker">
              NEW JOINING
            </span>

            <h2>Add customer entry</h2>
          </div>

          <button
            className="icon-button"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="entry-form"
          onSubmit={handleSubmit}
        >

          <div className="form-section">

            <h3>Customer</h3>

            <div className="form-grid">

              <label>
                Customer name
                <input
                  value={form.customer_name}
                  onChange={(e) =>
                    update(
                      'customer_name',
                      e.target.value
                    )
                  }
                  placeholder="e.g. Rahul Reddy"
                />
              </label>

              <label>
                Joining date
                <input
                  type="date"
                  value={form.joined_on}
                  onChange={(e) =>
                    update(
                      'joined_on',
                      e.target.value
                    )
                  }
                />
              </label>

              {currentRole === 'admin' && (
                <label>
                  Trainer
                  <select
                    value={form.trainer_id}
                    onChange={(e) =>
                      update(
                        'trainer_id',
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      No trainer
                    </option>

                    {trainers.map((trainer) => (
                      <option
                        key={trainer.id}
                        value={trainer.id}
                      >
                        {trainer.full_name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

            </div>
          </div>

          <div className="form-section">

            <h3>Gym membership</h3>

            <div className="gym-options-row">

              <label className="mini-check">
                <input
                  type="checkbox"
                  checked={Boolean(form.gym_fee_paid)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      gym_fee_paid: e.target.checked,
                      gym_same_as_pt: e.target.checked
                        ? prev.gym_same_as_pt
                        : false,
                      gym_start: e.target.checked
                        ? prev.gym_start
                        : '',
                      gym_end: e.target.checked
                        ? prev.gym_end
                        : '',
                    }))
                  }
                />
                <span>Gym fee paid</span>
              </label>

              <label
                className={
                  form.gym_fee_paid
                    ? 'mini-check'
                    : 'mini-check disabled'
                }
              >
                <input
                  type="checkbox"
                  disabled={!form.gym_fee_paid}
                  checked={Boolean(form.gym_same_as_pt)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      gym_same_as_pt: e.target.checked,
                      gym_start: e.target.checked
                        ? prev.pt_start || ''
                        : prev.gym_start,
                      gym_end: e.target.checked
                        ? prev.pt_end || ''
                        : prev.gym_end,
                    }))
                  }
                />
                <span>Same dates as PT</span>
              </label>

            </div>

            <div className="membership-fields">

              <label>
                Start date
                <input
                  type="date"
                  value={form.gym_start}
                  disabled={
                    !form.gym_fee_paid ||
                    form.gym_same_as_pt
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      gym_start: e.target.value,
                      gym_end: calculateExpiryDate(
                        e.target.value,
                        prev.gym_duration
                      ),
                    }))
                  }
                />
              </label>

              <label>
                Duration
                <select
                  value={form.gym_duration}
                  disabled={
                    !form.gym_fee_paid ||
                    form.gym_same_as_pt
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      gym_duration: e.target.value,
                      gym_end: calculateExpiryDate(
                        prev.gym_start,
                        e.target.value
                      ),
                    }))
                  }
                >
                  {MEMBERSHIP_DURATIONS.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Expiry date
                <input
                  type="date"
                  value={form.gym_end}
                  disabled
                />
              </label>

            </div>

          </div>

          <div className="form-section">

            <div className="form-section-heading">
              <h3>Personal training</h3>


            </div>

            <div className="form-grid">

              <label>
                PT amount
                <input
                  type="number"
                  min="0"
                  placeholder="₹0"
                  value={form.pt_amount}
                  onChange={(e) =>
                    update(
                      'pt_amount',
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Start date
                <input
                  type="date"
                  value={form.pt_start}
                  disabled={!ptEnabled}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pt_start: e.target.value,
                      pt_end: calculateExpiryDate(
                        e.target.value,
                        prev.pt_duration
                      ),
                    }))
                  }
                />
              </label>

              <label>
                Duration
                <select
                  value={form.pt_duration}
                  disabled={!ptEnabled}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pt_duration: e.target.value,
                      pt_end: calculateExpiryDate(
                        prev.pt_start,
                        e.target.value
                      ),
                    }))
                  }
                >
                  {MEMBERSHIP_DURATIONS.map((item) => (
                    <option
                      value={item.value}
                      key={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Expiry date
                <input
                  type="date"
                  value={form.pt_end}
                  disabled
                />
              </label>

            </div>
          </div>

          

          <div className="form-section">

            <h3>Payment</h3>

            <div className="form-grid">

              <label>
                Payment status
                <select
                  value={form.payment_status}
                  onChange={(e) =>
                    update(
                      'payment_status',
                      e.target.value
                    )
                  }
                >
                  <option value="paid">
                    Paid
                  </option>

                  <option value="partial">
                    Partial
                  </option>

                  <option value="pending">
                    Pending
                  </option>
                </select>
              </label>

              <label>
                Payment mode
                <select
                  value={form.payment_mode}
                  onChange={(e) =>
                    update(
                      'payment_mode',
                      e.target.value
                    )
                  }
                >
                  <option value="cash">
                    Cash
                  </option>

                  <option value="upi">
                    UPI
                  </option>

                  <option value="card">
                    Card
                  </option>

                  <option value="bank">
                    Bank transfer
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </label>

              <label>
                Amount paid
                <input
                  type="number"
                  min="0"
                  placeholder="₹0"
                  value={form.amount_paid}
                  onChange={(e) =>
                    update(
                      'amount_paid',
                      e.target.value
                    )
                  }
                />
              </label>

            </div>

            <label className="full-label">
              Notes
              <textarea
                rows="3"
                placeholder="Optional notes..."
                value={form.notes}
                onChange={(e) =>
                  update(
                    'notes',
                    e.target.value
                  )
                }
              />
            </label>

          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="modal-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : 'Save Entry'}
            </button>

          </div>

        </form>
      </div>
    </div>
  )
}
