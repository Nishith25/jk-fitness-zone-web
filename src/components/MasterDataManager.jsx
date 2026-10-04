import { useEffect, useState } from 'react'
import {
  Edit3,
  Plus,
  Power,
  Trash2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export default function MasterDataManager() {
  const [section, setSection] =
    useState('customers')

  const [customers, setCustomers] =
    useState([])

  const [amounts, setAmounts] =
    useState([])

  const [durations, setDurations] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  async function loadMasters() {
    setLoading(true)
    setError('')

    const [c, a, d] =
      await Promise.all([
        supabase
          .from('customer_presets')
          .select('*')
          .order('name'),

        supabase
          .from('pt_amount_presets')
          .select('*')
          .order('amount'),

        supabase
          .from('duration_presets')
          .select('*')
          .order('sort_order'),
      ])

    if (c.error || a.error || d.error) {
      setError(
        c.error?.message ||
        a.error?.message ||
        d.error?.message
      )
    } else {
      setCustomers(c.data || [])
      setAmounts(a.data || [])
      setDurations(d.data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadMasters()
  }, [])

  async function addCustomer() {
    const name =
      window.prompt('Customer name')

    if (!name?.trim()) return

    const { error } = await supabase
      .from('customer_presets')
      .insert({
        name: name.trim(),
      })

    if (error) {
      window.alert(error.message)
      return
    }

    loadMasters()
  }

  async function editCustomer(item) {
    const name =
      window.prompt(
        'Customer name',
        item.name
      )

    if (!name?.trim()) return

    const { error } = await supabase
      .from('customer_presets')
      .update({
        name: name.trim(),
      })
      .eq('id', item.id)

    if (error) {
      window.alert(error.message)
      return
    }

    loadMasters()
  }

  async function addAmount() {
    const value =
      window.prompt('PT amount')

    const amount = Number(value)

    if (!amount || amount <= 0) return

    const { error } = await supabase
      .from('pt_amount_presets')
      .insert({ amount })

    if (error) {
      window.alert(error.message)
      return
    }

    loadMasters()
  }

  async function editAmount(item) {
    const value =
      window.prompt(
        'PT amount',
        item.amount
      )

    const amount = Number(value)

    if (!amount || amount <= 0) return

    const { error } = await supabase
      .from('pt_amount_presets')
      .update({ amount })
      .eq('id', item.id)

    if (error) {
      window.alert(error.message)
      return
    }

    loadMasters()
  }

  async function addDuration() {
    const code =
      window.prompt(
        'Short code, e.g. 6M or 1.5Y'
      )

    if (!code?.trim()) return

    const label =
      window.prompt(
        'Display name, e.g. 6 Months'
      )

    if (!label?.trim()) return

    const months = Number(
      window.prompt(
        'How many months?'
      )
    )

    if (!months || months <= 0) return

    const nextOrder =
      durations.length
        ? Math.max(
            ...durations.map(
              (x) =>
                Number(x.sort_order || 0)
            )
          ) + 1
        : 1

    const { error } = await supabase
      .from('duration_presets')
      .insert({
        code: code.trim(),
        label: label.trim(),
        months,
        sort_order: nextOrder,
      })

    if (error) {
      window.alert(error.message)
      return
    }

    loadMasters()
  }

  async function editDuration(item) {
    const code =
      window.prompt(
        'Short code',
        item.code
      )

    if (!code?.trim()) return

    const label =
      window.prompt(
        'Display name',
        item.label
      )

    if (!label?.trim()) return

    const months = Number(
      window.prompt(
        'Months',
        item.months
      )
    )

    if (!months || months <= 0) return

    const { error } = await supabase
      .from('duration_presets')
      .update({
        code: code.trim(),
        label: label.trim(),
        months,
      })
      .eq('id', item.id)

    if (error) {
      window.alert(error.message)
      return
    }

    loadMasters()
  }

  async function toggle(
    table,
    item
  ) {
    const { error } = await supabase
      .from(table)
      .update({
        is_active:
          !item.is_active,
      })
      .eq('id', item.id)

    if (error) {
      window.alert(error.message)
      return
    }

    loadMasters()
  }

  async function remove(
    table,
    item,
    label
  ) {
    const confirmed =
      window.confirm(
        `Delete ${label}?`
      )

    if (!confirmed) return

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', item.id)

    if (error) {
      window.alert(
        'Could not delete this value. Deactivate it instead if it is already in use.'
      )
      return
    }

    loadMasters()
  }

  const config = {
    customers: {
      title: 'Customers',
      button: 'Add customer',
      data: customers,
      add: addCustomer,
      table: 'customer_presets',
      edit: editCustomer,
      value: (x) => x.name,
    },

    amounts: {
      title: 'PT amounts',
      button: 'Add amount',
      data: amounts,
      add: addAmount,
      table: 'pt_amount_presets',
      edit: editAmount,
      value: (x) => money(x.amount),
    },

    durations: {
      title: 'Durations',
      button: 'Add duration',
      data: durations,
      add: addDuration,
      table: 'duration_presets',
      edit: editDuration,
      value: (x) =>
        `${x.label} · ${x.code}`,
    },
  }

  const current = config[section]

  return (
    <section className="content-card masters-card">

      <div className="card-heading responsive-heading">
        <div>
          <span className="section-kicker">
            QUICK ENTRY SETUP
          </span>

          <h2>Masters</h2>
        </div>

        <button
          className="primary-button"
          onClick={current.add}
        >
          <Plus size={16} />
          {current.button}
        </button>
      </div>

      <div className="master-tabs">
        <button
          className={
            section === 'customers'
              ? 'active'
              : ''
          }
          onClick={() =>
            setSection('customers')
          }
        >
          Customers
        </button>

        <button
          className={
            section === 'amounts'
              ? 'active'
              : ''
          }
          onClick={() =>
            setSection('amounts')
          }
        >
          PT Amounts
        </button>

        <button
          className={
            section === 'durations'
              ? 'active'
              : ''
          }
          onClick={() =>
            setSection('durations')
          }
        >
          Durations
        </button>
      </div>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          Loading...
        </div>
      ) : (
        <div className="master-list">

          {current.data.map((item) => (
            <div
              className={`master-row ${
                !item.is_active
                  ? 'inactive'
                  : ''
              }`}
              key={item.id}
            >
              <div>
                <strong>
                  {current.value(item)}
                </strong>

                <span>
                  {item.is_active
                    ? 'Active'
                    : 'Inactive'}
                </span>
              </div>

              <div className="master-actions">
                <button
                  title="Edit"
                  onClick={() =>
                    current.edit(item)
                  }
                >
                  <Edit3 size={15} />
                </button>

                <button
                  title={
                    item.is_active
                      ? 'Deactivate'
                      : 'Activate'
                  }
                  onClick={() =>
                    toggle(
                      current.table,
                      item
                    )
                  }
                >
                  <Power size={15} />
                </button>

                <button
                  className="danger"
                  title="Delete"
                  onClick={() =>
                    remove(
                      current.table,
                      item,
                      current.value(item)
                    )
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

        </div>
      )}

    </section>
  )
}
