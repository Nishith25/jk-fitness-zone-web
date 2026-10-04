import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  MEMBERSHIP_DURATIONS,
  calculateExpiryDate,
  detectDuration,
} from '../utils/membershipDuration'

function nextDay(date) {
  if (!date) {
    return new Date()
      .toISOString()
      .split('T')[0]
  }

  const d =
    new Date(`${date}T00:00:00`)

  d.setDate(d.getDate() + 1)

  return d
    .toISOString()
    .split('T')[0]
}

function addMonth(date) {
  if (!date) return ''

  const d =
    new Date(`${date}T00:00:00`)

  d.setMonth(
    d.getMonth() + 1
  )

  return d
    .toISOString()
    .split('T')[0]
}

export default function RenewEntryModal({
  open,
  entry,
  currentRole,
  currentUserId,
  onClose,
  onSaved,
}) {
  const [form, setForm] =
    useState(null)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  useEffect(() => {
    if (!open || !entry) return

    const hasGym =
      Number(
        entry.gym_amount || 0
      ) > 0

    const hasPT =
      Number(
        entry.pt_amount || 0
      ) > 0

    const gymStart =
      nextDay(entry.gym_end)

    const ptStart =
      nextDay(entry.pt_end)

    setForm({
      renew_gym:
        Boolean(
          entry.gym_fee_paid ||
          hasGym
        ),

      gym_same_as_pt:
        Boolean(entry.gym_start) &&
        Boolean(entry.pt_start) &&
        entry.gym_start === entry.pt_start &&
        entry.gym_end === entry.pt_end,
      renew_pt: hasPT,

      gym_amount:
        Number(
          entry.gym_amount || 0
        ),

      gym_start:
        gymStart,

      gym_duration:
        detectDuration(
          entry.gym_start,
          entry.gym_end
        ),

      gym_end:
        calculateExpiryDate(
          gymStart,
          detectDuration(
            entry.gym_start,
            entry.gym_end
          )
        ),

      pt_amount:
        Number(
          entry.pt_amount || 0
        ),

      pt_start:
        ptStart,

      pt_duration:
        detectDuration(
          entry.pt_start,
          entry.pt_end
        ),

      pt_end:
        calculateExpiryDate(
          ptStart,
          detectDuration(
            entry.pt_start,
            entry.pt_end
          )
        ),

      payment_status:
        'paid',

      payment_mode:
        entry.payment_mode ||
        'cash',

      amount_paid: '',

      notes: '',
    })
  }, [open, entry])

  useEffect(() => {
    if (
      form?.renew_gym &&
      form?.gym_same_as_pt
    ) {
      setForm((prev) => ({
        ...prev,
        gym_start: prev.pt_start || '',
        gym_end: prev.pt_end || '',
      }))
    }
  }, [
    form?.renew_gym,
    form?.gym_same_as_pt,
    form?.pt_start,
    form?.pt_end,
  ])

  if (
    !open ||
    !entry ||
    !form
  ) {
    return null
  }

  function update(
    key,
    value
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  async function submit(e) {
    e.preventDefault()

    setSaving(true)
    setError('')

    try {
      const gym =
        form.renew_gym
          ? Number(
              form.gym_amount || 0
            )
          : 0

      const pt =
        form.renew_pt
          ? Number(
              form.pt_amount || 0
            )
          : 0

      if (
        gym <= 0 &&
        pt <= 0
      ) {
        throw new Error(
          'Select Gym or PT to renew.'
        )
      }

      if (
        form.renew_gym &&
        (!form.gym_start ||
          !form.gym_end)
      ) {
        throw new Error(
          'Enter Gym renewal dates.'
        )
      }

      if (
        form.renew_pt &&
        (!form.pt_start ||
          !form.pt_end)
      ) {
        throw new Error(
          'Enter PT renewal dates.'
        )
      }

      const {
        error: insertError,
      } = await supabase
        .from('member_entries')
        .insert({
          renewal_of:
            entry.id,

          customer_name:
            entry.customer_name,

          trainer_id:
            currentRole ===
            'trainer'
              ? currentUserId
              : entry.trainer_id,

          joined_on:
            new Date()
              .toISOString()
              .split('T')[0],

          gym_fee_paid:
            Boolean(form.renew_gym),

          gym_amount:
            0,

          gym_start:
            form.renew_gym
              ? form.gym_start
              : null,

          gym_end:
            form.renew_gym
              ? form.gym_end
              : null,

          pt_amount:
            pt,

          pt_start:
            form.renew_pt
              ? form.pt_start
              : null,

          pt_end:
            form.renew_pt
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
            form.notes.trim() ||
            'Membership renewal',
        })

      if (insertError) {
        throw insertError
      }

      onSaved?.()
      onClose()
    } catch (err) {
      setError(
        err.message ||
          'Unable to renew membership.'
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
              MEMBERSHIP RENEWAL
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
          onSubmit={submit}
        >

          <div className="renew-choice-grid">

            <label
              className={
                form.renew_gym
                  ? 'renew-choice active'
                  : 'renew-choice'
              }
            >
              <input
                type="checkbox"
                checked={
                  form.renew_gym
                }
                onChange={(e) =>
                  update(
                    'renew_gym',
                    e.target.checked
                  )
                }
              />

              <strong>
                Renew Gym
              </strong>

              <span>
                Previous ₹
                {Number(
                  entry.gym_amount || 0
                ).toLocaleString(
                  'en-IN'
                )}
              </span>
            </label>

            <label
              className={
                form.renew_pt
                  ? 'renew-choice active'
                  : 'renew-choice'
              }
            >
              <input
                type="checkbox"
                checked={
                  form.renew_pt
                }
                onChange={(e) =>
                  update(
                    'renew_pt',
                    e.target.checked
                  )
                }
              />

              <strong>
                Renew PT
              </strong>

              <span>
                Previous ₹
                {Number(
                  entry.pt_amount || 0
                ).toLocaleString(
                  'en-IN'
                )}
              </span>
            </label>

          </div>

          {form.renew_gym && (
            <div className="form-section">

              <h3>
                Gym membership
              </h3>

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
                    Use the PT renewal dates for Gym.
                  </span>
                </div>
              </label>

              <div className="form-grid">

                

                <label>
                  Start date
                  <input
                    type="date"
                    disabled={form.gym_same_as_pt}
                    value={
                      form.gym_start
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value

                      setForm(
                        (prev) => ({
                          ...prev,
                          gym_start:
                            value,
                          gym_end:
                            addMonth(
                              value
                            ),
                        })
                      )
                    }}
                  />
                </label>

                <label>
                  Duration
                  <select
                    value={form.gym_duration}
                    disabled={form.gym_same_as_pt}
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
                    disabled
                    value={
                      form.gym_end
                    }
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
          )}

          {form.renew_pt && (
            <div className="form-section">

              <h3>
                Personal training
              </h3>

              <div className="form-grid">

                <label>
                  PT amount
                  <input
                    type="number"
                    min="0"
                    value={
                      form.pt_amount
                    }
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
                    value={
                      form.pt_start
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value

                      setForm(
                        (prev) => ({
                          ...prev,
                          pt_start:
                            value,
                          pt_end:
                            addMonth(
                              value
                            ),
                        })
                      )
                    }}
                  />
                </label>

                <label>
                  Duration
                  <select
                    value={form.pt_duration}
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
                    disabled
                    value={
                      form.pt_end
                    }
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
          )}

          <div className="form-section">

            <h3>Payment</h3>

            <div className="form-grid">

              <label>
                Payment status
                <select
                  value={
                    form.payment_status
                  }
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
                  value={
                    form.payment_mode
                  }
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
                  value={
                    form.amount_paid
                  }
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
                ? 'Renewing...'
                : 'Confirm Renewal'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}
