import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const today = () => new Date().toISOString().split('T')[0]

const emptyForm = {
  customer_name: '',
  customer_mode: 'saved',
  new_customer_name: '',

  trainer_id: '',
  joined_on: today(),

  gym_fee_paid: false,
  gym_same_as_pt: false,
  gym_start: '',
  gym_duration: '1M',
  gym_end: '',

  pt_amount: '',
  pt_amount_mode: 'saved',
  custom_pt_amount: '',
  pt_start: '',
  pt_duration: '1M',
  pt_end: '',

  payment_status: 'paid',
  payment_mode: 'cash',
  amount_paid: '',
  notes: '',
}

function calculateEndDate(startDate, months) {
  if (!startDate || !months) return ''

  const [year, month, day] = startDate
    .split('-')
    .map(Number)

  const target = new Date(
    year,
    month - 1 + Number(months),
    1
  )

  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate()

  target.setDate(Math.min(day, lastDay))

  const yyyy = target.getFullYear()
  const mm = String(target.getMonth() + 1).padStart(2, '0')
  const dd = String(target.getDate()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}`
}

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
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
  const [customers, setCustomers] = useState([])
  const [amountPresets, setAmountPresets] = useState([])
  const [durationPresets, setDurationPresets] = useState([])

  const [saving, setSaving] = useState(false)
  const [loadingPresets, setLoadingPresets] = useState(false)
  const [error, setError] = useState('')

  const update = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  useEffect(() => {
    if (!open) return

    setError('')
    setLoadingPresets(true)

    async function loadData() {
      try {
        const [
          customersResult,
          amountsResult,
          durationsResult,
        ] = await Promise.all([
          supabase
            .from('customer_presets')
            .select('id, name')
            .eq('is_active', true)
            .order('name'),

          supabase
            .from('pt_amount_presets')
            .select('id, amount')
            .eq('is_active', true)
            .order('amount'),

          supabase
            .from('duration_presets')
            .select('id, code, label, months, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
        ])

        if (customersResult.error) throw customersResult.error
        if (amountsResult.error) throw amountsResult.error
        if (durationsResult.error) throw durationsResult.error

        setCustomers(customersResult.data || [])
        setAmountPresets(amountsResult.data || [])
        setDurationPresets(durationsResult.data || [])

        if (currentRole === 'trainer') {
          setForm((prev) => ({
            ...prev,
            trainer_id: currentUserId,
          }))
        } else {
          const trainersResult = await supabase
            .from('staff_profiles')
            .select('id, full_name')
            .eq('role', 'trainer')
            .eq('is_active', true)
            .order('full_name')

          if (trainersResult.error) {
            throw trainersResult.error
          }

          setTrainers(trainersResult.data || [])
        }
      } catch (err) {
        setError(
          err.message ||
          'Unable to load joining options.'
        )
      } finally {
        setLoadingPresets(false)
      }
    }

    loadData()
  }, [
    open,
    currentRole,
    currentUserId,
  ])

  const selectedPtAmount = useMemo(() => {
    if (form.pt_amount_mode === 'custom') {
      return Number(form.custom_pt_amount || 0)
    }

    return Number(form.pt_amount || 0)
  }, [
    form.pt_amount,
    form.pt_amount_mode,
    form.custom_pt_amount,
  ])

  const ptEnabled = selectedPtAmount > 0

  const getDurationMonths = (code) => {
    const selected = durationPresets.find(
      (item) => item.code === code
    )

    return selected?.months || 0
  }

  useEffect(() => {
    if (
      !ptEnabled ||
      !form.pt_start ||
      !form.pt_duration
    ) {
      return
    }

    const end = calculateEndDate(
      form.pt_start,
      getDurationMonths(form.pt_duration)
    )

    if (end !== form.pt_end) {
      setForm((prev) => ({
        ...prev,
        pt_end: end,
      }))
    }
  }, [
    ptEnabled,
    form.pt_start,
    form.pt_duration,
    durationPresets,
  ])

  useEffect(() => {
    if (!form.gym_fee_paid) {
      return
    }

    if (form.gym_same_as_pt) {
      if (
        form.gym_start !== form.pt_start ||
        form.gym_end !== form.pt_end
      ) {
        setForm((prev) => ({
          ...prev,
          gym_start: prev.pt_start || '',
          gym_end: prev.pt_end || '',
        }))
      }

      return
    }

    if (
      !form.gym_start ||
      !form.gym_duration
    ) {
      return
    }

    const end = calculateEndDate(
      form.gym_start,
      getDurationMonths(form.gym_duration)
    )

    if (end !== form.gym_end) {
      setForm((prev) => ({
        ...prev,
        gym_end: end,
      }))
    }
  }, [
    form.gym_fee_paid,
    form.gym_same_as_pt,
    form.gym_start,
    form.gym_duration,
    form.pt_start,
    form.pt_end,
    durationPresets,
  ])

  async function handleSubmit(e) {
    e.preventDefault()

    setSaving(true)
    setError('')

    try {
      const customerName =
        form.customer_mode === 'new'
          ? form.new_customer_name.trim()
          : form.customer_name.trim()

      if (!customerName) {
        throw new Error(
          'Select or enter a customer name.'
        )
      }

      if (selectedPtAmount <= 0) {
        throw new Error(
          'Select a PT amount.'
        )
      }

      if (!form.pt_start || !form.pt_end) {
        throw new Error(
          'PT start and expiry dates are required.'
        )
      }

      if (
        form.gym_fee_paid &&
        (!form.gym_start || !form.gym_end)
      ) {
        throw new Error(
          'Gym start and expiry dates are required.'
        )
      }

      if (
        currentRole === 'trainer' &&
        !currentUserId
      ) {
        throw new Error(
          'Trainer account not found.'
        )
      }

      if (
        form.customer_mode === 'new'
      ) {
        const { error: customerError } =
          await supabase
            .from('customer_presets')
            .insert({
              name: customerName,
            })

        if (
          customerError &&
          customerError.code !== '23505'
        ) {
          throw customerError
        }
      }

      const payload = {
        customer_name: customerName,

        trainer_id:
          currentRole === 'trainer'
            ? currentUserId
            : form.trainer_id || null,

        joined_on: form.joined_on,

        gym_fee_paid:
          Boolean(form.gym_fee_paid),

        gym_amount: 0,

        gym_start:
          form.gym_fee_paid
            ? form.gym_start
            : null,

        gym_end:
          form.gym_fee_paid
            ? form.gym_end
            : null,

        pt_amount: selectedPtAmount,
        pt_start: form.pt_start,
        pt_end: form.pt_end,

        payment_status:
          form.payment_status,

        payment_mode:
          form.payment_mode,

        amount_paid:
          Number(form.amount_paid || 0),

        notes:
          form.notes.trim() || null,
      }

      const { error: insertError } =
        await supabase
          .from('member_entries')
          .insert(payload)

      if (insertError) {
        throw insertError
      }

      setForm({
        ...emptyForm,
        joined_on: today(),
        trainer_id:
          currentRole === 'trainer'
            ? currentUserId
            : '',
      })

      onSaved?.()
      onClose()
    } catch (err) {
      setError(
        err.message ||
        'Unable to save entry.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="entry-modal">

        <div className="modal-header">
          <div>
            <span className="section-kicker">
              QUICK JOINING
            </span>

            <h2>Add customer</h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="entry-form quick-entry-form"
          onSubmit={handleSubmit}
        >

          {loadingPresets && (
            <div className="form-hint">
              Loading saved options...
            </div>
          )}

          <div className="form-section">
            <h3>Customer</h3>

            <div className="form-grid quick-two">

              <label>
                Customer name

                <select
                  value={
                    form.customer_mode === 'new'
                      ? '__new__'
                      : form.customer_name
                  }
                  onChange={(e) => {
                    if (
                      e.target.value === '__new__'
                    ) {
                      setForm((prev) => ({
                        ...prev,
                        customer_mode: 'new',
                        customer_name: '',
                      }))
                    } else {
                      setForm((prev) => ({
                        ...prev,
                        customer_mode: 'saved',
                        customer_name:
                          e.target.value,
                        new_customer_name: '',
                      }))
                    }
                  }}
                >
                  <option value="">
                    Select customer
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.name}
                    >
                      {customer.name}
                    </option>
                  ))}

                  <option value="__new__">
                    + Add new customer
                  </option>
                </select>
              </label>

              {form.customer_mode === 'new' && (
                <label>
                  New customer

                  <input
                    autoFocus
                    value={form.new_customer_name}
                    onChange={(e) =>
                      update(
                        'new_customer_name',
                        e.target.value
                      )
                    }
                    placeholder="Enter customer name"
                  />
                </label>
              )}

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
            <h3>Personal training</h3>

            <div className="quick-pt-grid">

              <label>
                PT amount

                <select
                  value={
                    form.pt_amount_mode === 'custom'
                      ? '__custom__'
                      : form.pt_amount
                  }
                  onChange={(e) => {
                    if (
                      e.target.value === '__custom__'
                    ) {
                      setForm((prev) => ({
                        ...prev,
                        pt_amount_mode: 'custom',
                        pt_amount: '',
                      }))
                    } else {
                      setForm((prev) => ({
                        ...prev,
                        pt_amount_mode: 'saved',
                        pt_amount:
                          e.target.value,
                        custom_pt_amount: '',
                      }))
                    }
                  }}
                >
                  <option value="">
                    Select amount
                  </option>

                  {amountPresets.map((item) => (
                    <option
                      key={item.id}
                      value={item.amount}
                    >
                      {money(item.amount)}
                    </option>
                  ))}

                  <option value="__custom__">
                    Custom amount
                  </option>
                </select>
              </label>

              {form.pt_amount_mode === 'custom' && (
                <label>
                  Custom amount

                  <input
                    type="number"
                    min="0"
                    value={form.custom_pt_amount}
                    onChange={(e) =>
                      update(
                        'custom_pt_amount',
                        e.target.value
                      )
                    }
                    placeholder="₹0"
                  />
                </label>
              )}

              <label>
                Duration

                <select
                  value={form.pt_duration}
                  onChange={(e) =>
                    update(
                      'pt_duration',
                      e.target.value
                    )
                  }
                >
                  {durationPresets.map((item) => (
                    <option
                      key={item.id}
                      value={item.code}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Start date

                <input
                  type="date"
                  disabled={!ptEnabled}
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
                  disabled
                />
              </label>

            </div>
          </div>

          <div className="form-section compact-gym-section">
            <h3>Gym membership</h3>

            <div className="gym-options-row">

              <label className="mini-check">
                <input
                  type="checkbox"
                  checked={form.gym_fee_paid}
                  onChange={(e) => {
                    const checked =
                      e.target.checked

                    setForm((prev) => ({
                      ...prev,
                      gym_fee_paid: checked,
                      gym_same_as_pt:
                        checked
                          ? prev.gym_same_as_pt
                          : false,
                      gym_start:
                        checked
                          ? prev.gym_start
                          : '',
                      gym_end:
                        checked
                          ? prev.gym_end
                          : '',
                    }))
                  }}
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
                  checked={form.gym_same_as_pt}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      gym_same_as_pt:
                        e.target.checked,
                      gym_start:
                        e.target.checked
                          ? prev.pt_start
                          : prev.gym_start,
                      gym_end:
                        e.target.checked
                          ? prev.pt_end
                          : prev.gym_end,
                    }))
                  }
                />

                <span>Same dates as PT</span>
              </label>

            </div>

            {form.gym_fee_paid &&
              !form.gym_same_as_pt && (
                <div className="membership-fields">

                  <label>
                    Duration

                    <select
                      value={form.gym_duration}
                      onChange={(e) =>
                        update(
                          'gym_duration',
                          e.target.value
                        )
                      }
                    >
                      {durationPresets.map(
                        (item) => (
                          <option
                            key={item.id}
                            value={item.code}
                          >
                            {item.label}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    Start date

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
                      disabled
                    />
                  </label>

                </div>
              )}

            {form.gym_fee_paid &&
              form.gym_same_as_pt && (
                <div className="same-date-summary">
                  Gym dates will use the same PT dates:
                  <strong>
                    {' '}
                    {form.pt_start || '—'}
                    {' → '}
                    {form.pt_end || '—'}
                  </strong>
                </div>
              )}

          </div>

          <div className="form-section">
            <h3>Payment</h3>

            <div className="form-grid quick-payment-grid">

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
                    Bank transfer
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </label>

              <label>
                Amount received

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
                rows="2"
                placeholder="Optional"
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
              disabled={
                saving ||
                loadingPresets
              }
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
