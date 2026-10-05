import {
  RotateCcw,
  Save,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'

function money(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString('en-IN')}`
}

function amountValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return ''
  }

  return String(value)
}

export default function MonthlyFinancialAdjustments({
  month,
  rows,
  onChanged,
}) {
  const [editing, setEditing] =
    useState(null)

  const [form, setForm] = useState({
    pt: '',
    admin: '',
    trainer: '',
    notes: '',
  })

  const [saving, setSaving] =
    useState(false)

  useEffect(() => {
    if (!editing) return

    setForm({
      pt: amountValue(
        editing.final_pt_amount
      ),

      admin: amountValue(
        editing.final_admin_share
      ),

      trainer: amountValue(
        editing.final_trainer_share
      ),

      notes:
        editing.override_notes || '',
    })
  }, [editing])

  async function saveOverride() {
    if (!editing) return

    setSaving(true)

    const { error } =
      await supabase.rpc(
        'set_monthly_pt_override',
        {
          p_entry_id:
            editing.entry_id,

          p_allocation_month:
            `${month}-01`,

          p_pt_business:
            form.pt === ''
              ? null
              : Number(form.pt),

          p_admin_share:
            form.admin === ''
              ? null
              : Number(form.admin),

          p_trainer_share:
            form.trainer === ''
              ? null
              : Number(form.trainer),

          p_notes:
            form.notes || null,
        }
      )

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    setEditing(null)
    await onChanged?.()
  }

  async function resetOverride(row) {
    const confirmed =
      window.confirm(
        `Reset ${row.customer_name} to calculated values for this month?`
      )

    if (!confirmed) return

    const { error } =
      await supabase.rpc(
        'clear_monthly_pt_override',
        {
          p_entry_id:
            row.entry_id,

          p_allocation_month:
            `${month}-01`,
        }
      )

    if (error) {
      alert(error.message)
      return
    }

    setEditing(null)
    await onChanged?.()
  }

  return (
    <section className="content-card monthly-adjustments">

      <div className="card-heading">
        <div>
          <span className="section-kicker">
            MONTHLY FINANCE
          </span>

          <h2>
            Final monthly values
          </h2>

          <p className="section-subtext">
            Auto-calculated first. Admin may
            override final values independently.
          </p>
        </div>
      </div>

      {!rows.length ? (
        <div className="empty-state">
          <strong>
            No PT allocations
          </strong>

          <span>
            No PT value applies to this month.
          </span>
        </div>
      ) : (
        <div className="monthly-adjustment-list">

          {rows.map((row) => (
            <div
              className="monthly-adjustment-row"
              key={`${row.entry_id}-${row.allocation_month}`}
            >

              <div className="monthly-adjustment-customer">

                <div>
                  <strong>
                    {row.customer_name}
                  </strong>

                  <span>
                    Package {money(row.pt_amount)}
                    {' · '}
                    {row.duration_months}M
                  </span>
                </div>

                {row.is_overridden && (
                  <span className="manual-adjusted-badge">
                    MANUALLY ADJUSTED
                  </span>
                )}

              </div>

              <div className="monthly-adjustment-values">

                <div>
                  <span>
                    PT Business
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

                <div>
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

                <div>
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

              </div>

              <div className="monthly-adjustment-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setEditing(row)
                  }
                >
                  Edit Final Values
                </button>

                {row.is_overridden && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      resetOverride(row)
                    }
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>
                )}

              </div>

              {editing?.entry_id ===
                row.entry_id && (
                <div className="monthly-override-editor">

                  <label>
                    <span>
                      Final PT Business
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={form.pt}
                      onChange={(e) =>
                        setForm(
                          (prev) => ({
                            ...prev,
                            pt:
                              e.target.value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Final JK Share
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={form.admin}
                      onChange={(e) =>
                        setForm(
                          (prev) => ({
                            ...prev,
                            admin:
                              e.target.value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Final Trainer Share
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={form.trainer}
                      onChange={(e) =>
                        setForm(
                          (prev) => ({
                            ...prev,
                            trainer:
                              e.target.value,
                          })
                        )
                      }
                    />
                  </label>

                  <label className="monthly-override-notes">
                    <span>
                      Notes
                    </span>

                    <input
                      value={form.notes}
                      onChange={(e) =>
                        setForm(
                          (prev) => ({
                            ...prev,
                            notes:
                              e.target.value,
                          })
                        )
                      }
                      placeholder="Reason for adjustment..."
                    />
                  </label>

                  <div className="monthly-override-buttons">

                    <button
                      type="button"
                      className="primary-button"
                      disabled={saving}
                      onClick={saveOverride}
                    >
                      <Save size={15} />

                      {saving
                        ? 'Saving...'
                        : 'Save Final Values'}
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        setEditing(null)
                      }
                    >
                      Cancel
                    </button>

                  </div>

                </div>
              )}

            </div>
          ))}

        </div>
      )}

    </section>
  )
}
