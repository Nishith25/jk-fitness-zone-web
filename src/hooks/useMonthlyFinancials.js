import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'

export default function useMonthlyFinancials(
  selectedMonth
) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!selectedMonth) return

    setLoading(true)

    const monthStart =
      `${selectedMonth}-01`

    const { data, error } =
      await supabase
        .from(
          'monthly_pt_effective_allocations'
        )
        .select('*')
        .eq(
          'allocation_month',
          monthStart
        )
        .order('customer_name', {
          ascending: true,
        })

    if (error) {
      console.error(
        'Monthly financial load failed:',
        error
      )

      setRows([])
      setLoading(false)
      return
    }

    setRows(data || [])
    setLoading(false)
  }, [selectedMonth])

  useEffect(() => {
    load()
  }, [load])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.ptBusiness +=
          Number(
            row.final_pt_amount || 0
          )

        acc.adminShare +=
          Number(
            row.final_admin_share || 0
          )

        acc.trainerShare +=
          Number(
            row.final_trainer_share || 0
          )

        return acc
      },
      {
        ptBusiness: 0,
        adminShare: 0,
        trainerShare: 0,
      }
    )
  }, [rows])

  return {
    rows,
    totals,
    loading,
    reload: load,
  }
}
