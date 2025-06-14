'use client'
import DateRangeInput from '@/components/DateRangeInput'
import { Button } from '@/components/ui/button'
// import DateRangeInput from '@/components/DateRangeSelector'
import FloatingInput from '@/components/ui/floating-input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
// import { formatDate, formatCurrencyINR } from '@/hooks/hook'
// import { fetchInvoicesOnType } from '@/lib/invoiceAction'
// import { useQuery } from '@tanstack/react-query'
import { EllipsisVertical, Plus, Printer, Share } from 'lucide-react'
import { useState } from 'react'

const Page = () => {
  const [selectedDates, setSelectedDates] = useState<{
    date1: string
    date2: string
  }>({
    date1: '',
    date2: '',
  })
  console.log('🚀 ~ Page ~ selectedDates:', selectedDates)

  // const { data: allInvoice } = useQuery({
  //   queryKey: ['Invoice'],
  //   queryFn: fetchInvoices,
  // })

  // const { data: invoice } = useQuery({
  //   queryKey: ['Invoice', selectedDates.date1, selectedDates.date2],
  //   queryFn: () =>
  //     fetchInvoicesOnType(selectedDates.date1, selectedDates.date2),
  //   enabled: !!selectedDates.date1 && !!selectedDates.date2,
  //   select: (data) =>
  //     data?.filter(
  //       (item) =>
  //         item?.invoice_type?.toLowerCase().includes('cash') ||
  //         item?.invoice_type?.toLowerCase().includes('credit')
  //     ),
  // })
  // const TotalQuantity = () => {
  //   const total = {
  //     totalAmount: 0,
  //     totalPaid: 0,
  //     totalUnpaid: 0,
  //   }
  //   invoice?.forEach((item) => {
  //     total.totalPaid += Number(item.paid_amount) ?? 0
  //   })
  //   invoice?.forEach((item) => {
  //     total.totalUnpaid += Number(item.remaining_amount) ?? 0
  //   })
  //   total.totalAmount = total.totalPaid + total.totalUnpaid
  //   return total
  // }

  // Function to receive data from the child component
  const handleDateChange = (date1: string, date2: string) => {
    setSelectedDates({ date1, date2 })
  }
  const [filter, setFilter] = useState('')

  return (
    <main>
      <div className="m-3 flex flex-col gap-3">
        <section className="w-full bg-white p-3 space-y-4  flex justify-between items-center">
          <DateRangeInput onDateChange={handleDateChange} />
          <div className="flex flex-col ">
            <Printer />
            <p className="text-[10px]">Print</p>
          </div>
        </section>
        <section className=" bg-white shadow-lg p-3 h-full space-y-2">
          <div className="flex justify-between">
            <FloatingInput
              label="Search by Name | Type"
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <Button>
              <Plus /> Add Payment-In
            </Button>
          </div>
          <div className="overflow-y-scroll h-[75.4dvh] scroll-smooth ">
            <Table>
              <TableHeader className=" ">
                <TableRow className="">
                  <TableHead className="  w-5 ">#</TableHead>
                  <TableHead className="  ">Date</TableHead>
                  <TableHead className="  ">REFE. NO.</TableHead>
                  <TableHead className="  ">PARTY NAME</TableHead>
                  <TableHead className="  ">CATEGORY NAME</TableHead>
                  <TableHead className="  ">TYPE</TableHead>
                  <TableHead className="  ">TOTAL</TableHead>
                  <TableHead className="  ">REVIVED/PAID</TableHead>
                  <TableHead className="  ">BALANCE</TableHead>
                  <TableHead className="  ">PRINT/SHARE</TableHead>
                  <TableHead className="  "></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="">1</TableCell>
                  <TableCell className="">12/12/1212</TableCell>
                  <TableCell className="">1234231</TableCell>
                  <TableCell className="">Casg</TableCell>
                  <TableCell className="">Sale</TableCell>
                  <TableCell className="">4324</TableCell>
                  <TableCell className="">4324</TableCell>
                  <TableCell className="">323</TableCell>
                  <TableCell className="">status</TableCell>
                  <TableCell className="flex  gap-2">
                    {' '}
                    <Printer size={20} color="gray" />{' '}
                    <Share size={20} color="gray" />
                  </TableCell>
                  <TableCell className="">
                    <EllipsisVertical size={20} color="gray" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Page
