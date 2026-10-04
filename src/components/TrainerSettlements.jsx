import {
  CheckCircle2,
  Clock3,
  WalletCards,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'

function money(value) {
  return `₹${Number(value || 0).toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 2,
    }
  )}`
}

export default function TrainerSettlements({
  trainers,
  entries,
  selectedMonth,
  onChanged,
}) {
  const [
    settlements,
    setSettlements,
  ] = useState([])

  const [
    savingId,
    setSavingId,
  ] = useState(null)

  async function loadSettlements() {
    const { data } = await supabase
      .from('trainer_settlements')
      .select('*')

    setSettlements(data || [])
  }

  useEffect(() => {
    loadSettlements()
  }, [])

  const monthStart =
    `${selectedMonth}-01`

  const rows = useMemo(() => {
    return trainers.map((trainer) => {

      const trainerEntries =
        entries.filter(
          (entry) =>
            entry.trainer_id ===
              trainer.id &&
            !entry.is_cancelled &&
            entry.joined_on?.slice(
              0,
              7
            ) === selectedMonth
        )

      const calculatedShare =
        trainerEntries.reduce(
          (sum, entry) =>
            sum +
            Number(
              entry.trainer_share || 0
            ),
          0
        )

      const settlement =
        settlements.find(
          (item) =>
            item.trainer_id ===
              trainer.id &&
            item.month_start ===
              monthStart
        )

      const salary =
        settlement?.status === 'paid'
          ? Number(
              settlement.salary_amount ||
                0
            )
          : Number(
              trainer.monthly_salary ||
                0
            )

      const share =
        settlement?.status === 'paid'
          ? Number(
              settlement.share_amount ||
                calculatedShare
            )
          : calculatedShare

      return {
        trainer,
        entryCount:
          trainerEntries.length,
        share,
        salary,
        total:
          share + salary,
        settlement,
      }
    })
  }, [
    trainers,
    entries,
    selectedMonth,
    settlements,
    monthStart,
  ])

  async function markPaid(row) {
    setSavingId(row.trainer.id)

    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser()

      const { error } =
        await supabase
          .from(
            'trainer_settlements'
          )
          .upsert(
            {
              trainer_id:
                row.trainer.id,

              month_start:
                monthStart,

              share_amount:
                row.share,

              salary_amount:
                row.salary,

              amount:
                row.total,

              status:
                'paid',

              paid_at:
                new Date().toISOString(),

              created_by:
                user?.id || null,

              updated_by:
                user?.id || null,

              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict:
                'trainer_id,month_start',
            }
          )

      if (error) throw error

      await loadSettlements()
      onChanged?.()
    } catch (error) {
      alert(error.message)
    } finally {
      setSavingId(null)
    }
  }

  async function markPending(row) {
    if (!row.settlement) return

    setSavingId(row.trainer.id)

    const { error } =
      await supabase
        .from(
          'trainer_settlements'
        )
        .update({
          status: 'pending',
          paid_at: null,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          row.settlement.id
        )

    if (error) {
      alert(error.message)
    }

    await loadSettlements()
    onChanged?.()

    setSavingId(null)
  }

  return (
    <section className="content-card">

      <div className="card-heading">

        <div>
          <span className="section-kicker">
            PAYOUTS
          </span>

          <h2>
            Trainer earnings
          </h2>
        </div>

      </div>

      <div className="settlement-list">

        {rows.map((row) => {

          const paid =
            row.settlement?.status ===
            'paid'

          return (
            <div
              className="settlement-row salary-settlement-row"
              key={row.trainer.id}
            >

              <div className="settlement-trainer">

                <div className="avatar-circle">
                  {row.trainer.full_name?.[0] ||
                    'T'}
                </div>

                <div>
                  <strong>
                    {row.trainer.full_name}
                  </strong>

                  <span>
                    {row.entryCount} entries
                  </span>
                </div>

              </div>

              <div className="settlement-amount">
                <span>Share</span>

                <strong>
                  {money(row.share)}
                </strong>
              </div>

              <div className="settlement-amount">
                <span>Salary</span>

                <strong>
                  {money(row.salary)}
                </strong>
              </div>

              <div className="settlement-amount total-earning">
                <span>
                  Total Earnings
                </span>

                <strong>
                  {money(row.total)}
                </strong>
              </div>

              <div>

                <span
                  className={
                    paid
                      ? 'settlement-status paid'
                      : 'settlement-status pending'
                  }
                >
                  {paid ? (
                    <>
                      <CheckCircle2
                        size={13}
                      />
                      Paid
                    </>
                  ) : (
                    <>
                      <Clock3
                        size={13}
                      />
                      Pending
                    </>
                  )}
                </span>

              </div>

              <div>

                {paid ? (
                  <button
                    className="secondary-button small"
                    onClick={() =>
                      markPending(row)
                    }
                  >
                    Mark Pending
                  </button>
                ) : (
                  <button
                    className="primary-button small"
                    disabled={
                      savingId ===
                      row.trainer.id
                    }
                    onClick={() =>
                      markPaid(row)
                    }
                  >
                    Mark Paid
                  </button>
                )}

              </div>

            </div>
          )
        })}

      </div>

    </section>
  )
}
