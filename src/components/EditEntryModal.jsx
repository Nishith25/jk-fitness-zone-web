import { useEffect, useState } from 'react'
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
        trainer_id: entry.trainer_id || '',
        joined_on: entry.joined_on || '',

        gym_fee_paid: Boolean(
          entry.gym_fee_paid ||
          Number(entry.gym_amount || 0) > 0
        ),
        gym_same_as_pt:
          Boolean(entry.gym_start) &&
          Boolean(entry.pt_start) &&
          entry.gym_start === entry.pt_start &&
          entry.gym_end === entry.pt_end,
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

  useEffect(() => {
    if (
      form?.gym_fee_paid &&
      form?.gym_same_as_pt
    ) {
      setForm((prev) => ({
        ...prev,
        gym_start: prev.pt_start || '',
        gym_end: prev.pt_end || '',
      }))
    }
  }, [
    form?.gym_fee_paid,
    form?.gym_same_as_pt,
    form?.pt_start,
    form?.pt_end,
  ])

  if (!open || !form) return null

  const gymEnabled =
    Boolean(form.gym_fee_paid)

  const ptEnabled =
    Number(form.pt_amount || 0) > 0

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

      if (
        form.gym_fee_paid &&
        (!form.gym_start ||
          !form.gym_end)
      ) {
        throw new Error(
          'Gym start and expiry dates are required.'
        )
      }

      if (
        ptAmount > 0 &&
        (!form.pt_start ||
          !form.pt_end)
      ) {
        throw new Error(
          'PT start and expiry dates are required.'
        )
      }

      const {
        error: updateError,
      } = await supabase
        .from('member_entries')
        .update({
          customer_name:
            form.customer_name.trim(),

          trainer_id:
            form.trainer_id || null,

          joined_on:
            form.joined_on,

          gym_fee_paid:
            Boolean(form.gym_fee_paid),

          gym_amount:
            0,

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
        err.message ||
          'Unable to update entry.'
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
            type="button"
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

                  {trainers.map(
                    (trainer) => (
                      <option
                        value={trainer.id}
                        key={trainer.id}
                      >
                        {trainer.full_name}
                      </option>
                    )
                  )}
                </select>
              </label>

            </div>

          </div>

          <div className="form-section">

            <h3>Gym membership</h3>

            <label className="gym-fee-check">
              <input
                type="checkbox"
                checked={Boolean(form.gym_fee_paid)}
                onChange={(e) =>
                  update(
                    'gym_fee_paid',
                    e.target.checked
                  )
                }
              />

              <div>
                <strong>Gym fee paid</strong>
                <span>
                  Controls the PT commission percentage.
                </span>
              </div>
            </label>

            {form.gym_fee_paid && (
              <label className="same-date-check">
                <input
                  type="checkbox"
                  checked={Boolean(form.gym_same_as_pt)}
                  onChange={(e) =>
                    update(
                      'gym_same_as_pt',
                      e.target.checked
                    )
                  }
                />

                <div>
                  <strong>Same dates as PT</strong>
                  <span>
                    Keep Gym validity equal to PT validity.
                  </span>
                </div>
              </label>
            )}

            <div className="form-grid">

              

              <label>
                Start date
                <input
                  type="date"
                  value={form.gym_start}
                  disabled={!gymEnabled || form.gym_same_as_pt}
                  onChange={(e) =>
                    update(
                      'gym_start',
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Expiry date
                <input
                  type="date"
                  value={form.gym_end}
                  disabled={!gymEnabled || form.gym_same_as_pt}
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

            <h3>Personal training</h3>

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
                Start date
                <input
                  type="date"
                  value={form.pt_start}
                  disabled={!ptEnabled}
                  onChange={(e) =>
                    update(
                      'pt_start',
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Expiry date
                <input
                  type="date"
                  value={form.pt_end}
                  disabled={!ptEnabled}
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
                placeholder="Optional notes..."
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
              type="submit"
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
