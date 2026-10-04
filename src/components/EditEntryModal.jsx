import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function EditEntryModal({
  open,
  entry,
  trainers,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (entry && open) {
      setForm({
        customer_name: entry.customer_name || '',
        customer_phone: entry.customer_phone || '',
        trainer_id: entry.trainer_id || '',
        joined_on: entry.joined_on || '',

        gym_amount: entry.gym_amount || '',
        gym_start: entry.gym_start || '',
        gym_end: entry.gym_end || '',

        pt_amount: entry.pt_amount || '',
        pt_start: entry.pt_start || '',
        pt_end: entry.pt_end || '',

        payment_status:
          entry.payment_status || 'paid',

        payment_mode:
          entry.payment_mode || 'cash',

        amount_paid:
          entry.amount_paid || '',

        notes:
          entry.notes || '',
      })
    }
  }, [entry, open])

  const preview = useMemo(() => {
    if (!form) return null

    const gym = Number(form.gym_amount || 0)
    const pt = Number(form.pt_amount || 0)

    const overlap =
      gym > 0 &&
      pt > 0 &&
      form.gym_start &&
      form.gym_end &&
      form.pt_start &&
      form.pt_end &&
      form.gym_start <= form.pt_end &&
      form.pt_start <= form.gym_end

    if (overlap) {
      const total = gym + pt

      return {
        title: 'Gym + PT active together',
        text: '50 / 50',
        jk: total * 0.5,
        trainer: total * 0.5,
      }
    }

    if (pt > 0) {
      return {
        title:
          gym > 0
            ? 'Gym + PT do not overlap'
            : 'PT only',

        text:
          gym > 0
            ? 'Gym 100% + PT 60/40'
            : '60 / 40',

        jk:
          gym +
          pt * 0.6,

        trainer:
          pt * 0.4,
      }
    }

    return {
      title: 'Gym only',
      text: '100 / 0',
      jk: gym,
      trainer: 0,
    }
  }, [form])

  if (!open || !form) return null

  function update(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function save(e) {
    e.preventDefault()

    setSaving(true)
    setError('')

    try {
      const gymAmount =
        Number(form.gym_amount || 0)

      const ptAmount =
        Number(form.pt_amount || 0)

      if (!form.customer_name.trim()) {
        throw new Error(
          'Customer name is required.'
        )
      }

      if (
        gymAmount <= 0 &&
        ptAmount <= 0
      ) {
        throw new Error(
          'Gym or PT amount is required.'
        )
      }

      const { error: updateError } =
        await supabase
          .from('member_entries')
          .update({
            customer_name:
              form.customer_name.trim(),

            customer_phone:
              form.customer_phone.trim() || null,

            trainer_id:
              form.trainer_id || null,

            joined_on:
              form.joined_on,

            gym_amount:
              gymAmount,

            gym_start:
              gymAmount > 0
                ? form.gym_start
                : null,

            gym_end:
              gymAmount > 0
                ? form.gym_end
                : null,

            pt_amount:
              ptAmount,

            pt_start:
              ptAmount > 0
                ? form.pt_start
                : null,

            pt_end:
              ptAmount > 0
                ? form.pt_end
                : null,

            payment_status:
              form.payment_status,

            payment_mode:
              form.payment_mode,

            amount_paid:
              Number(
                form.amount_paid || 0
              ),

            notes:
              form.notes.trim() || null,
          })
          .eq('id', entry.id)

      if (updateError) {
        throw updateError
      }

      onSaved?.()
      onClose()
    } catch (err) {
      setError(
        err.message || 'Unable to update entry.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop">

      <div className="entry-modal">

        <div className="modal-header">

          <div>
            <span className="section-kicker">
              EDIT ENTRY
            </span>

            <h2>
              {entry.customer_name}
            </h2>
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
          onSubmit={save}
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
                />
              </label>

              <label>
                Mobile
                <input
                  maxLength="10"
                  value={form.customer_phone}
                  onChange={(e) =>
                    update(
                      'customer_phone',
                      e.target.value.replace(
                        /\D/g,
                        ''
                      )
                    )
                  }
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
                      value={trainer.id}
                      key={trainer.id}
                    >
                      {trainer.full_name}
                    </option>
                  ))}
                </select>
              </label>

            </div>

          </div>

          <div className="form-section">

            <div className="form-section-heading">
              <h3>Gym</h3>
              <span>Monthly membership</span>
            </div>

            <div className="form-grid">

              <label>
                Gym amount
                <input
                  type="number"
                  min="0"
                  value={form.gym_amount}
                  onChange={(e) =>
                    update(
                      'gym_amount',
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Start
                <input
                  type="date"
                  value={form.gym_start}
                  onChange={(e) =>
                    update(
                      'gym_start',
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Expiry
                <input
                  type="date"
                  value={form.gym_end}
                  onChange={(e) =>
                    update(
                      'gym_end',
                      e.target.value
                    )
                  }
                />
              </label>

            </div>

          </div>

          <div className="form-section">

            <div className="form-section-heading">
              <h3>Personal Training</h3>
              <span>PT membership</span>
            </div>

            <div className="form-grid">

              <label>
                PT amount
                <input
                  type="number"
                  min="0"
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
                Start
                <input
                  type="date"
                  value={form.pt_start}
                  onChange={(e) =>
                    update(
                      'pt_start',
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Expiry
                <input
                  type="date"
                  value={form.pt_end}
                  onChange={(e) =>
                    update(
                      'pt_end',
                      e.target.value
                    )
                  }
                />
              </label>

            </div>

          </div>

          {preview && (
            <div className="split-preview">

              <div>
                <span>
                  CALCULATED SPLIT
                </span>

                <strong>
                  {preview.title}
                </strong>

                <small>
                  {preview.text}
                </small>
              </div>

              <div className="split-money">

                <div>
                  <span>
                    JK Fitness Zone
                  </span>

                  <strong>
                    ₹
                    {preview.jk.toLocaleString(
                      'en-IN'
                    )}
                  </strong>
                </div>

                <div>
                  <span>Trainer</span>

                  <strong>
                    ₹
                    {preview.trainer.toLocaleString(
                      'en-IN'
                    )}
                  </strong>
                </div>

              </div>

            </div>
          )}

          <div className="form-section">

            <h3>Payment</h3>

            <div className="form-grid">

              <label>
                Status
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
                Mode
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
                    Bank
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
              className="secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : 'Save Changes'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}
