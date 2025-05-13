import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfWeek,
  endOfMonth,
  endOfYear,
  subMonths,
  subYears,
  format,
  startOfQuarter,
  endOfQuarter,
} from 'date-fns'

export const getDateRange = (filter: string) => {
  const today = new Date()
  let startDate: string, endDate: string

  switch (filter) {
    case 'today':
      startDate = endDate = format(startOfDay(today), 'yyyy-MM-dd')
      break

    case 'this_week':
      startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd') // Monday as start of the week
      endDate = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      break

    case 'this_month':
      startDate = format(startOfMonth(today), 'dd-MM-yyyy')
      endDate = format(endOfMonth(today), 'dd-MM-yyyy')
      break

    case 'last_month':
      const lastMonth = subMonths(today, 1)
      startDate = format(startOfMonth(lastMonth), 'dd-MM-yyyy')
      endDate = format(endOfMonth(lastMonth), 'dd-MM-yyyy')
      break

    case 'this_year':
      startDate = format(startOfYear(today), 'dd-MM-yyyy')
      endDate = format(endOfYear(today), 'dd-MM-yyyy')
      break

    case 'this_quarter':
      startDate = format(startOfQuarter(today), 'dd-MM-yyyy')
      endDate = format(endOfQuarter(today), 'dd-MM-yyyy')
      break

    default:
      startDate = endDate = format(startOfDay(today), 'dd-MM-yyyy')
  }

  return { startDate, endDate }
}
export function formatCurrencyINR(amount: number | string): string {
  try {
    // Allow empty string (useful for inputs)
    if (amount === '') return ''

    // Convert to number safely
    const num = Number(amount)

    // If input contains invalid characters, return unformatted
    if (isNaN(num)) return String(amount)

    // Format only valid numbers
    return num.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      style: 'currency',
      currency: 'INR',
    })
  } catch (error) {
    console.error('Error formatting currency', error)
    return String(amount) // Return the original input in case of error
  }
}