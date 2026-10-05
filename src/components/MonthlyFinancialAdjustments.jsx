import { useState } from 'react'
import { supabase } from '../lib/supabase'

function money(value) {
  return `₹${Number(value || 0).toLocaleString(
    'en-IN'
  )}`
}

function date(value) {
  if (!value) return '—'

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function splitValues(jk, trainer) {
  const a = Number(jk || 0)
  const b = Number(trainer || 0)
  const total = a + b

  if (!total) return '—'

  const jkPercent = Math.round(
    (a / total) * 100
  )

  return `${jkPercent} / ${
    100 - jkPercent
  }`
}

export default function MonthlyFinancialAdjustments({
  rows = [],
  selectedMonth,
  onChanged,
}) {
  const [editingId, setEditingId] =
    useState(null)

  const [form, setForm] = useState({
    pt: '',
    admin: '',
    trainer: '',
    notes: '',
  })

  const [saving, setSaving] =
    useState(false)

  function beginEdit(row) {
    setEditingId(row.entry_id)

    setForm({
      pt: String(
        row.final_pt_amount ?? 0
      ),
      admin: String(
        row.final_admin_share ?? 0
      ),
      trainer: String(
        row.final_trainer_share ?? 0
      ),
      notes:
        row.override_notes || '',
    })
  }

  function stopEdit() {
    setEditingId(null)

    setForm({
      pt: '',
      admin: '',
      trainer: '',
      notes: '',
    })
  }

  async function save(row) {
    try {
      setSaving(true)

      const { error } =
        await supabase.rpc(
          'set_monthly_pt_override',
          {
            p_entry_id:
              row.entry_id,

            p_allocation_month:
              row.allocation_month,

            p_pt_business:
              Number(form.pt || 0),

            p_admin_share:
              Number(
                form.admin || 0
              ),

            p_trainer_share:
              Number(
                form.trainer || 0
              ),

            p_notes:
              form.notes?.trim() ||
              null,
          }
        )

      if (error) throw error

      stopEdit()

      await onChanged?.()
    } catch (error) {
      console.error(
        'Unable to save final values:',
        error
      )

      alert(
        error.message ||
          'Unable to save final values.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function reset(row) {
    const confirmed =
      window.confirm(
        `Reset ${row.customer_name} to calculated values for this month?`
      )

    if (!confirmed) return

    try {
      setSaving(true)

      const { error } =
        await supabase.rpc(
          'clear_monthly_pt_override',
          {
            p_entry_id:
              row.entry_id,

            p_allocation_month:
              row.allocation_month,
          }
        )

      if (error) throw error

      await onChanged?.()
    } catch (error) {
      console.error(
        'Unable to reset final values:',
        error
      )

      alert(
        error.message ||
          'Unable to reset final values.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (!rows.length) {
    return (
      <div className="empty-state">
        <strong>
          No monthly PT allocations
        </strong>

        <span>
          No trainer-share allocation exists
          for this month.
        </span>
      </div>
    )
  }

  return (
    <div className="monthly-financial-list">

      {rows.map((row) => {
        const editing =
          editingId === row.entry_id

        const finalSplit =
          splitValues(
            row.final_admin_share,
            row.final_trainer_share
          )

        const calculatedSplit =
          splitValues(
            row.monthly_admin_share,
            row.monthly_trainer_share
          )

        return (
          <article
            className="monthly-financial-card"
            key={`${row.entry_id}-${row.allocation_month}`}
          >

            <div className="monthly-financial-header">

              <div>
                <h3>
                  {row.customer_name}
                </h3>

                <div className="monthly-customer-meta">

                  <span>
                    Amount Paid{' '}
                    <strong>
                      {money(
                        row.amount_paid
                      )}
                    </strong>
                  </span>

                  <span>
                    Package{' '}
                    <strong>
                      {money(
                        row.pt_amount
                      )}
                    </strong>
                  </span>

                  <span>
                    Duration{' '}
                    <strong>
                      {row.duration_months}{' '}
                      {Number(
                        row.duration_months
                      ) === 1
                        ? 'Month'
                        : 'Months'}
                    </strong>
                  </span>

                  <span>
                    PT Dates{' '}
                    <strong>
                      {date(
                        row.pt_start
                      )}{' '}
                      →{' '}
                      {date(
                        row.pt_end
                      )}
                    </strong>
                  </span>

                </div>
              </div>

              {row.is_overridden && (
                <span className="monthly-manual-badge">
                  MANUALLY ADJUSTED
                </span>
              )}

            </div>


            <div className="monthly-financial-grid">

              <div className="monthly-value-box">
                <span>
                  This Month PT
                </span>

                <strong>
                  {money(
                    row.final_pt_amount
                  )}
                </strong>

                <small>
                  Calculated{' '}
                  {money(
                    row.monthly_pt_amount
                  )}
                </small>
              </div>


              <div className="monthly-value-box">
                <span>
                  JK Share
                </span>

                <strong>
                  {money(
                    row.final_admin_share
                  )}
                </strong>

                <small>
                  Calculated{' '}
                  {money(
                    row.monthly_admin_share
                  )}
                </small>
              </div>


              <div className="monthly-value-box">
                <span>
                  Trainer Share
                </span>

                <strong>
                  {money(
                    row.final_trainer_share
                  )}
                </strong>

                <small>
                  Calculated{' '}
                  {money(
                    row.monthly_trainer_share
                  )}
                </small>
              </div>


              <div className="monthly-value-box">
                <span>
                  Final Split
                </span>

                <strong>
                  {finalSplit}
                </strong>

                <small>
                  {row.is_overridden
                    ? `Calculated ${calculatedSplit}`
                    : row.gym_fee_paid
                      ? 'Gym Paid'
                      : 'Gym Not Paid'}
                </small>
              </div>

            </div>


            {row.is_overridden &&
              row.override_notes && (
                <div className="monthly-adjustment-note">
                  <span>
                    Adjustment Note
                  </span>

                  <strong>
                    {row.override_notes}
                  </strong>
                </div>
              )}


            {editing && (
              <div className="monthly-financial-editor">

                <label>
                  <span>
                    This Month PT
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={form.pt}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        pt: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <span>
                    JK Share
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={form.admin}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        admin:
                          e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <span>
                    Trainer Share
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={form.trainer}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        trainer:
                          e.target.value,
                      })
                    }
                  />
                </label>

                <label className="monthly-note-input">
                  <span>
                    Adjustment note
                  </span>

                  <input
                    type="text"
                    placeholder="Reason for manual adjustment..."
                    value={form.notes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        notes:
                          e.target.value,
                      })
                    }
                  />
                </label>

              </div>
            )}


            <div className="monthly-financial-actions">

              {!editing ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    beginEdit(row)
                  }
                >
                  Edit Final Values
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={saving}
                    onClick={() =>
                      save(row)
                    }
                  >
                    {saving
                      ? 'Saving...'
                      : 'Save Values'}
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      stopEdit
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </>
              )}

              {row.is_overridden &&
                !editing && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      reset(row)
                    }
                    disabled={saving}
                  >
                    Reset
                  </button>
                )}

            </div>

          </article>
        )
      })}

    </div>
  )
}
