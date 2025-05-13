// // import { useState, useRef, useEffect } from 'react'
// // import FloatingInput from '../ui/floating-input'
// // import { parse, format, isValid, startOfMonth, startOfDay } from 'date-fns'
// // import { Button } from '../ui/button'

// // type Props = {
// //   onDateChange: (date1: string, date2: string) => void
// // }

// // export default function DateRangeInput({ onDateChange }: Props) {

// //   const today = startOfDay(new Date())
// //   const firstDayOfMonth = startOfMonth(today)

// //   // Initial state values converted to 'DD-MM-YYYY' format
// //   const [date1, setDate1] = useState<string>(
// //     format(firstDayOfMonth, 'dd-MM-yyyy')
// //   )
// //   const [date2, setDate2] = useState<string>(format(today, 'dd-MM-yyyy'))
// //   const date2Ref = useRef<HTMLInputElement>(null)

// //   // Converts DD-MM-YYYY to YYYY-MM-DD
// //   const convertToISOFormat = (dateStr: string): string | null => {
// //     const parsedDate = parse(dateStr, 'dd-MM-yyyy', new Date())
// //     return isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : null
// //   }

// //   const formatDateInput = (value: string) => {
// //     value = value.replace(/[^\d]/g, '') // Remove non-numeric characters

// //     if (value.length > 2) value = value.slice(0, 2) + '-' + value.slice(2)
// //     if (value.length > 5) value = value.slice(0, 5) + '-' + value.slice(5, 9)

// //     return value.length > 10 ? value.slice(0, 10) : value
// //   }

// //   const handleDate1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const formattedValue = formatDateInput(e.target.value)
// //     setDate1(formattedValue)

// //     const isoDate = convertToISOFormat(formattedValue)
// //     if (isoDate) onDateChange(isoDate, convertToISOFormat(date2) || '')

// //     if (formattedValue.length === 10 && date2Ref.current) {
// //       date2Ref.current.focus()
// //     }
// //   }

// //   const handleDate2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const formattedValue = formatDateInput(e.target.value)
// //     setDate2(formattedValue)

// //     const isoDate = convertToISOFormat(formattedValue)
// //     if (isoDate) onDateChange(convertToISOFormat(date1) || '', isoDate)
// //   }

// //   useEffect(() => {
// //     onDateChange(
// //       convertToISOFormat(date1) || '',
// //       convertToISOFormat(date2) || ''
// //     )
// //   }, [])

// //   return (
// //     <div className="space-y-4">
// //       <div className="flex gap-2">
// //         <FloatingInput
// //           label="Start Date"
// //           type="text"
// //           placeholder="DD-MM-YYYY"
// //           value={date1}
// //           onChange={handleDate1Change}
// //           maxLength={10}
// //           className="w-1/2 p-2 border rounded"
// //           removeText={() => setDate1('')}
// //         />
// //         <span className="self-center text-lg">-</span>
// //         <FloatingInput
// //           label="End Date"
// //           disabled={date1 === ''}
// //           type="text"
// //           ref={date2Ref}
// //           placeholder="DD-MM-YYYY"
// //           value={date2}
// //           onChange={handleDate2Change}
// //           maxLength={10}
// //           className="w-1/2 p-2 border rounded"
// //         />
// //         <Button> X</Button>
// //       </div>
// //     </div>
// //   )
// // }
// // import { useState, useRef, useEffect } from 'react'
// // import FloatingInput from '../ui/floating-input'
// // import { parse, format, isValid, startOfMonth, startOfDay } from 'date-fns'
// // import { Button } from '../ui/button'

// // type Props = {
// //   onDateChange: (date1: string, date2: string) => void
// // }

// // export default function DateRangeInput({ onDateChange }: Props) {
// //   const today = startOfDay(new Date())
// //   const firstDayOfMonth = startOfMonth(today)

// //   const [date1, setDate1] = useState<string>(
// //     format(firstDayOfMonth, 'dd-MM-yyyy')
// //   )
// //   const [date2, setDate2] = useState<string>(format(today, 'dd-MM-yyyy'))
// //   const date2Ref = useRef<HTMLInputElement>(null)

// //   // Converts DD-MM-YYYY to YYYY-MM-DD
// //   const convertToISOFormat = (dateStr: string): string | null => {
// //     const parsedDate = parse(dateStr, 'dd-MM-yyyy', new Date())
// //     return isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : null
// //   }

// //   const formatDateInput = (value: string) => {
// //     value = value.replace(/[^\d]/g, '') // Remove non-numeric characters
// //     if (value.length > 2) value = value.slice(0, 2) + '-' + value.slice(2)
// //     if (value.length > 5) value = value.slice(0, 5) + '-' + value.slice(5, 9)
// //     return value.length > 10 ? value.slice(0, 10) : value
// //   }

// //   const handleDate1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const formattedValue = formatDateInput(e.target.value)
// //     setDate1(formattedValue)

// //     if (formattedValue.length === 10 && date2Ref.current) {
// //       date2Ref.current.focus()
// //     }
// //   }

// //   const handleDate2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const formattedValue = formatDateInput(e.target.value)
// //     setDate2(formattedValue)
// //   }

// //   const handleSearch = () => {
// //     onDateChange(
// //       convertToISOFormat(date1) || '',
// //       convertToISOFormat(date2) || ''
// //     )
// //   }

// //   const handleClear = () => {
// //     setDate1('')
// //     setDate2('')
// //     onDateChange('', '')
// //   }

// //   useEffect(() => {
// //     onDateChange(
// //       convertToISOFormat(date1) || '',
// //       convertToISOFormat(date2) || ''
// //     )
// //   }, [])

// //   return (
// //     <div className="space-y-4">
// //       <div className="flex gap-2 items-center">
// //         <FloatingInput
// //           label="Start Date"
// //           type="text"
// //           placeholder="DD-MM-YYYY"
// //           value={date1}
// //           onChange={handleDate1Change}
// //           maxLength={10}
// //           className="w-1/3 p-2 border rounded"
// //         />
// //         <span className="text-lg">-</span>
// //         <FloatingInput
// //           label="End Date"
// //           disabled={date1 === ''}
// //           type="text"
// //           ref={date2Ref}
// //           placeholder="DD-MM-YYYY"
// //           value={date2}
// //           onChange={handleDate2Change}
// //           maxLength={10}
// //           className="w-1/3 p-2 border rounded"
// //         />
// //         <Button
// //           onClick={handleSearch}
// //           className="px-4 py-2 bg-blue-600 text-white rounded"
// //         >
// //           Search
// //         </Button>
// //         <Button
// //           onClick={handleClear}
// //           className="px-4 py-2 bg-red-500 text-white rounded"
// //         >
// //           Clear
// //         </Button>
// //       </div>
// //     </div>
// //   )
// // }
// import { useState, useRef, useEffect } from 'react'
// import FloatingInput from '../ui/floating-input'
// import {
//   parse,
//   format,
//   isValid,
//   startOfMonth,
//   startOfDay,
//   isAfter,
//   isBefore,
// } from 'date-fns'
// import { Button } from '../ui/button'
// // import { toast } from 'sonner'
// import DateRangeSelect from '../DateRangeSelect'
// import { getDateRange } from '@/hooks/hook'

// type Props = {
//   onDateChange: (date1: string, date2: string) => void
// }

// export default function DateRangeInput({ onDateChange }: Props) {
//   const [invoiceRange, setInvoiceRange] = useState('today')
//   const { startDate, endDate } = getDateRange(invoiceRange)
//   // console.log('🚀 ~ DateRangeInput ~ startDate:', startDate)

//   const today = startOfDay(new Date())
//   const firstDayOfMonth = startOfMonth(today)

//   const [date1, setDate1] = useState<string>(
//     format(firstDayOfMonth, 'dd-MM-yyyy')
//   )
//   const [date2, setDate2] = useState<string>(format(today, 'dd-MM-yyyy'))
//   const [error, setError] = useState<string | null>(null)
//   useEffect(() => {
//     onDateChange(startDate, endDate)
//     console.log('🚀 ~ useEffect ~ startDate:', startDate)
//     console.log('🚀 ~ useEffect ~ endDate:', endDate)
//     setDate1(format(startDate, 'dd-MM-yyyy'))
//     setDate1(format(endDate, 'dd-MM-yyyy'))
//   }, [invoiceRange])
//   const date2Ref = useRef<HTMLInputElement>(null)

//   // Converts DD-MM-YYYY to YYYY-MM-DD
//   const convertToISOFormat = (dateStr: string): string | null => {
//     const parsedDate = parse(dateStr, 'dd-MM-yyyy', new Date())
//     return isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : null
//   }

//   const formatDateInput = (value: string) => {
//     value = value.replace(/[^\d]/g, '') // Remove non-numeric characters
//     if (value.length > 2) value = value.slice(0, 2) + '-' + value.slice(2)
//     if (value.length > 5) value = value.slice(0, 5) + '-' + value.slice(5, 9)
//     return value.length > 10 ? value.slice(0, 10) : value
//   }

//   const validateDate = (dateStr: string) => {
//     const parsedDate = parse(dateStr, 'dd-MM-yyyy', new Date())
//     return isValid(parsedDate) ? parsedDate : null
//   }

//   const handleDate1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const formattedValue = formatDateInput(e.target.value)
//     setDate1(formattedValue)

//     const parsedDate1 = validateDate(formattedValue)
//     const parsedDate2 = validateDate(date2)

//     if (!parsedDate1) {
//       setError('Invalid start date')
//       return
//     }
//     setError(null)

//     if (parsedDate2 && isAfter(parsedDate1, parsedDate2)) {
//       setError('Start date cannot be after end date')
//       return
//     }

//     if (formattedValue.length === 10 && date2Ref.current) {
//       date2Ref.current.focus()
//     }
//   }

//   const handleDate2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const formattedValue = formatDateInput(e.target.value)
//     setDate2(formattedValue)

//     const parsedDate1 = validateDate(date1)
//     const parsedDate2 = validateDate(formattedValue)

//     if (!parsedDate2) {
//       setError('Invalid end date')
//       return
//     }
//     setError(null)

//     if (parsedDate1 && isBefore(parsedDate2, parsedDate1)) {
//       setError('End date cannot be before start date')
//       return
//     }
//   }

//   const handleSearch = () => {
//     if (error) return
//     onDateChange(
//       convertToISOFormat(date1) || '',
//       convertToISOFormat(date2) || ''
//     )
//   }

//   const handleClear = () => {
//     setDate1('')
//     setDate2('')
//     setError(null)
//     onDateChange('', '')
//   }

//   // useEffect(() => {
//   //   onDateChange(
//   //     convertToISOFormat(date1) || '',
//   //     convertToISOFormat(date2) || ''
//   //   )
//   // }, [])

//   return (
//     <div className="space-y-4">
//       <div className="flex gap-2 items-center">
//         <DateRangeSelect onChange={setInvoiceRange} initialValue="today" />
//         <FloatingInput
//           label="Start Date"
//           type="text"
//           placeholder="DD-MM-YYYY"
//           value={date1}
//           onChange={handleDate1Change}
//           maxLength={10}
//           className="w-1/3 p-2 border rounded"
//         />
//         <span className="text-lg">-</span>
//         <FloatingInput
//           label="End Date"
//           disabled={date1 === ''}
//           type="text"
//           ref={date2Ref}
//           placeholder="DD-MM-YYYY"
//           value={date2}
//           onChange={handleDate2Change}
//           maxLength={10}
//           className="w-1/3 p-2 border rounded"
//         />
//         <Button
//           onClick={handleSearch}
//           className="px-4 py-2 bg-blue-600 text-white rounded"
//           disabled={!!error}
//         >
//           Search
//         </Button>
//         <Button
//           onClick={handleClear}
//           className="px-4 py-2 bg-red-500 text-white rounded"
//         >
//           Clear
//         </Button>
//       </div>
//     </div>
//   )
// }
import { useState, useRef, useEffect } from 'react'
import FloatingInput from '../ui/floating-input'
import { parse, format, isValid, isAfter, isBefore } from 'date-fns'
import { Button } from '../ui/button'
import DateRangeSelect from '../DateRangeSelect'
import { getDateRange } from '@/hooks/utils'
import { Calendar } from '../ui/calendar'

type Props = {
  onDateChange: (date1: string, date2: string) => void
}

export default function DateRangeInput({ onDateChange }: Props) {
  const [invoiceRange, setInvoiceRange] = useState('this_month')
  const { startDate, endDate } = getDateRange(invoiceRange)
  console.log("🚀 ~ DateRangeInput ~ startDate:", startDate , endDate)

  // const [date1, setDate1] = useState<string>(startDate)
  // const [date2, setDate2] = useState<string>(endDate)
  // const [error, setError] = useState<string | null>(null)
  // const date2Ref = useRef<HTMLInputElement>(null)

  // Ensure values update when invoiceRange changes
  // useEffect(() => {
  //   if (invoiceRange !== 'custom') {
  //     setDate1(format(startDate, 'dd-MM-yyyy'))
  //     setDate2(format(endDate, 'dd-MM-yyyy'))
  //     onDateChange(
  //       format(startDate, 'yyyy-MM-dd'),
  //       format(endDate, 'yyyy-MM-dd')
  //     )
  //   }
  // }, [invoiceRange, startDate, endDate])

  // const formatDateInput = (value: string) => {
  //   value = value.replace(/[^\d]/g, '') // Remove non-numeric characters
  //   if (value.length > 2) value = value.slice(0, 2) + '-' + value.slice(2)
  //   if (value.length > 5) value = value.slice(0, 5) + '-' + value.slice(5, 9)
  //   return value.length > 10 ? value.slice(0, 10) : value
  // }

  // const validateDate = (dateStr: string) => {
  //   const parsedDate = parse(dateStr, 'dd-MM-yyyy', new Date())
  //   return isValid(parsedDate) ? parsedDate : null
  // }

  // const handleDate1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const formattedValue = formatDateInput(e.target.value)
  //   setDate1(formattedValue)

  //   if (invoiceRange !== 'custom') return

  //   const parsedDate1 = validateDate(formattedValue)
  //   const parsedDate2 = validateDate(date2)

  //   if (!parsedDate1) {
  //     setError('Invalid start date')
  //     return
  //   }
  //   setError(null)

  //   if (parsedDate2 && isAfter(parsedDate1, parsedDate2)) {
  //     setError('Start date cannot be after end date')
  //     return
  //   }

  //   if (formattedValue.length === 10 && date2Ref.current) {
  //     date2Ref.current.focus()
  //   }
  // }

  // const handleDate2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const formattedValue = formatDateInput(e.target.value)
  //   setDate2(formattedValue)

  //   if (invoiceRange !== 'custom') return

  //   const parsedDate1 = validateDate(date1)
  //   const parsedDate2 = validateDate(formattedValue)

  //   if (!parsedDate2) {
  //     setError('Invalid end date')
  //     return
  //   }
  //   setError(null)

  //   if (parsedDate1 && isBefore(parsedDate2, parsedDate1)) {
  //     setError('End date cannot be before start date')
  //     return
  //   }
  // }

  // const handleSearch = () => {
  //   if (error) return
  //   onDateChange(format(date1, 'yyyy-MM-dd'), format(date2, 'yyyy-MM-dd'))
  // }
  //   console.log("🚀 ~ handleSearch ~ date2:", date2)
  //   console.log("🚀 ~ handleSearch ~ date1:", date1)

  // const handleClear = () => {
  //   setDate1('')
  //   setDate2('')
  //   setError(null)
  //   onDateChange('', '')
  // }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <DateRangeSelect
          onChange={setInvoiceRange}
          initialValue="this_month"
          className="w-40 text-xl border-none shadow-none focus:outline-none focus-visible:outline-none focus-within:outline-none"
        />{' '}
        <div className="h-8 border flex items-center  ">
          <span className="bg-[#aaaaaa] flex justify-center items-center w-fit p-3 text-xs font-bold text-white h-full">
            Between
          </span>
          <input
            type="text"
            value={startDate}
            className=" text-center w-28 px-2 text-sm font-medium text-gray-700 focus-within:outline-none  custom-date "
          />

          <span>To</span>
          <input
            type="text"
            value={endDate}
            className=" text-center w-28 px-2 text-sm font-medium text-gray-700 focus-within:outline-none  custom-date "
          />
        </div>
        {/* <FloatingInput
          label="Start Date"
          type="text"
          placeholder="DD-MM-YYYY"
          value={date1}
          onChange={handleDate1Change}
          maxLength={10}
          disabled={invoiceRange !== 'custom'}
          className="w-1/3 p-2 border rounded"
        />
        <span className="text-lg">-</span>
        <FloatingInput
          label="End Date"
          disabled={invoiceRange !== 'custom'}
          type="text"
          ref={date2Ref}
          placeholder="DD-MM-YYYY"
          value={date2}
          onChange={handleDate2Change}
          maxLength={10}
          className="w-1/3 p-2 border rounded"
        /> */}
        {/* {invoiceRange == 'custom' && (
          <>
            <Button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded"
              disabled={!!error}
            >
              Search
            </Button>
            <Button
              onClick={handleClear}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Clear
            </Button>
          </>
        )} */}
      </div>
      {/* {error && <p className="text-red-500">{error}</p>} */}
    </div>
  )
}
