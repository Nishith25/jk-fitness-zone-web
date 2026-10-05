import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'

const EMPTY = {
  new_pt_business: 0,
  amount_collected: 0,
  trainer_payout_total: 0,
  current_joining_month_trainer_payout: 0,
  carry_forward_trainer_payout: 0,
  trainer_salary_total: 0,
  trainer_total_payable: 0,
  jk_before_salary_change: 0,
  jk_net_change_after_salary: 0,
  jk_running_balance_after_salary: 0,
}

export default function useMonthlyJkFinance(
  selectedMonth
) {
  const [summary, setSummary] =
    useState(EMPTY)

  const [loading, setLoading] =
    useState(false)

  const reload = useCallback(async () => {
    if (!selectedMonth) {
      setSummary(EMPTY)
      return
    }

    setLoading(true)

    const { data, error } =
      await supabase
        .from('monthly_jk_finance_summary')
        .select('*')
        .eq(
          'month_start',
          `${selectedMonth}-01`
        )
        .maybeSingle()

    if (error) {
      console.error(
        'Unable to load JK monthly finance:',
        error
      )

      setSummary(EMPTY)
      setLoading(false)
      return
    }

    setSummary({
      ...EMPTY,
      ...(data || {}),
    })

    setLoading(false)
  }, [selectedMonth])

  useEffect(() => {
    reload()
  }, [reload])

  return {
    summary,
    loading,
    reload,
  }
}
