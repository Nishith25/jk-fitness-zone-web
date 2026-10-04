import { useEffect, useState } from 'react'
import {
  IndianRupee,
  Plus,
  Power,
  Save,
  UserPlus,
  X,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

export default function TrainerManagerModal({
  open,
  onClose,
  onChanged,
}) {
  const [trainers, setTrainers] = useState([])

  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [salary, setSalary] = useState('')

  const [saving, setSaving] = useState(false)
  const [salarySaving, setSalarySaving] =
    useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadTrainers() {
    const { data } = await supabase
      .from('staff_profiles')
      .select(`
        id,
        full_name,
        role,
        is_active,
        monthly_salary,
        created_at
      `)
      .eq('role', 'trainer')
      .order('created_at', {
        ascending: false,
      })

    setTrainers(
      (data || []).map((trainer) => ({
        ...trainer,

        editable_salary:
          trainer.monthly_salary || 0,
      }))
    )
  }

  useEffect(() => {
    if (open) {
      loadTrainers()
    }
  }, [open])

  async function createTrainer(e) {
    e.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const cleanedMobile =
        mobile.replace(/\D/g, '')

      if (!name.trim()) {
        throw new Error(
          'Trainer name is required.'
        )
      }

      if (cleanedMobile.length !== 10) {
        throw new Error(
          'Enter a valid 10-digit mobile number.'
        )
      }

      if (password.length < 6) {
        throw new Error(
          'Password must be at least 6 characters.'
        )
      }

      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        'create-trainer',
        {
          body: {
            full_name: name.trim(),
            mobile: cleanedMobile,
            password,
          },
        }
      )

      if (functionError) {
        throw functionError
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      if (Number(salary || 0) > 0) {
        const { error: salaryError } =
          await supabase
            .from('staff_profiles')
            .update({
              monthly_salary:
                Number(salary),
              updated_at:
                new Date().toISOString(),
            })
            .eq('id', data.trainer.id)

        if (salaryError) {
          throw salaryError
        }
      }

      setSuccess(
        `${name.trim()} created successfully.`
      )

      setName('')
      setMobile('')
      setPassword('')
      setSalary('')

      await loadTrainers()
      onChanged?.()
    } catch (err) {
      setError(
        err.message ||
          'Unable to create trainer.'
      )
    } finally {
      setSaving(false)
    }
  }

  function changeLocalSalary(
    trainerId,
    value
  ) {
    setTrainers((current) =>
      current.map((trainer) =>
        trainer.id === trainerId
          ? {
              ...trainer,
              editable_salary:
                value,
            }
          : trainer
      )
    )
  }

  async function saveSalary(trainer) {
    setSalarySaving(trainer.id)

    try {
      const newSalary = Number(
        trainer.editable_salary || 0
      )

      if (newSalary < 0) {
        throw new Error(
          'Salary cannot be negative.'
        )
      }

      const { error } = await supabase
        .from('staff_profiles')
        .update({
          monthly_salary: newSalary,

          updated_at:
            new Date().toISOString(),
        })
        .eq('id', trainer.id)

      if (error) throw error

      await loadTrainers()
      onChanged?.()
    } catch (error) {
      alert(error.message)
    } finally {
      setSalarySaving(null)
    }
  }

  async function toggleTrainer(trainer) {
    const { error } = await supabase
      .from('staff_profiles')
      .update({
        is_active:
          !trainer.is_active,

        updated_at:
          new Date().toISOString(),
      })
      .eq('id', trainer.id)

    if (!error) {
      await loadTrainers()
      onChanged?.()
    }
  }

  if (!open) return null

  return (
    <div className="modal-backdrop">

      <div className="entry-modal trainer-manager-modal">

        <div className="modal-header">

          <div>
            <span className="section-kicker">
              TRAINER MANAGEMENT
            </span>

            <h2>
              Manage trainers
            </h2>
          </div>

          <button
            className="icon-button"
            onClick={onClose}
          >
            <X size={20} />
          </button>

        </div>

        <div className="trainer-manager-body">

          <form
            className="trainer-create-card"
            onSubmit={createTrainer}
          >

            <div className="trainer-create-title">
              <UserPlus size={20} />

              <div>
                <strong>
                  Create trainer
                </strong>

                <span>
                  Login + monthly salary
                </span>
              </div>
            </div>

            <div className="form-grid">

              <label>
                Trainer name
                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="e.g. Satish"
                />
              </label>

              <label>
                Mobile number
                <input
                  maxLength="10"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(
                      e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 10)
                    )
                  }
                  placeholder="10 digits"
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Monthly salary
                <input
                  type="number"
                  min="0"
                  value={salary}
                  onChange={(e) =>
                    setSalary(
                      e.target.value
                    )
                  }
                  placeholder="₹0"
                />
              </label>

            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            {success && (
              <div className="form-success">
                {success}
              </div>
            )}

            <button
              className="primary-button"
              disabled={saving}
            >
              <Plus size={17} />

              {saving
                ? 'Creating...'
                : 'Create Trainer'}
            </button>

          </form>

          <div className="trainer-list-section">

            <div className="trainer-list-heading">

              <strong>
                Existing trainers
              </strong>

              <span>
                {trainers.length} trainers
              </span>

            </div>

            <div className="trainer-management-list">

              {trainers.map((trainer) => (
                <div
                  className="trainer-management-row salary-row"
                  key={trainer.id}
                >

                  <div className="avatar-circle">
                    {trainer.full_name?.[0] ||
                      'T'}
                  </div>

                  <div className="trainer-management-info">

                    <strong>
                      {trainer.full_name}
                    </strong>

                    <span>
                      {trainer.is_active
                        ? 'Active'
                        : 'Disabled'}
                    </span>

                  </div>

                  <div className="salary-editor">

                    <IndianRupee size={14} />

                    <input
                      type="number"
                      min="0"
                      value={
                        trainer.editable_salary
                      }
                      onChange={(e) =>
                        changeLocalSalary(
                          trainer.id,
                          e.target.value
                        )
                      }
                    />

                    <button
                      onClick={() =>
                        saveSalary(trainer)
                      }
                      disabled={
                        salarySaving ===
                        trainer.id
                      }
                    >
                      <Save size={14} />

                      {salarySaving ===
                      trainer.id
                        ? 'Saving'
                        : 'Save'}
                    </button>

                  </div>

                  <button
                    className={
                      trainer.is_active
                        ? 'trainer-toggle danger'
                        : 'trainer-toggle'
                    }
                    onClick={() =>
                      toggleTrainer(
                        trainer
                      )
                    }
                  >
                    <Power size={15} />

                    {trainer.is_active
                      ? 'Disable'
                      : 'Enable'}
                  </button>

                </div>
              ))}

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
