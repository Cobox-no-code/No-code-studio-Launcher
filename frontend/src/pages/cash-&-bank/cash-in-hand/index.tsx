'use client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import FloatingInput from '@/components/ui/floating-input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { openModal } from '@/redux/slices/modal'
import { AppDispatch } from '@/redux/store'
import { ChevronDown, IndianRupee, LoaderCircleIcon, SlidersHorizontal } from 'lucide-react'
import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

const CashInHand = () => {
  const dispatch = useDispatch<AppDispatch>()
  const [filterTransaction, setFilterTransaction] = useState('')

  const open = (types: string, id: string, bank: string) => {
    dispatch(
      openModal({
        type: types,
        types: id,
        index: bank,
      })
    )
  }
  return (
    <main className="h-full">
      <div className=" w-full h-14  bg-white flex items-center justify-between p-3 gap-3">
        <p className="flex items-center gap-2 text-lg font-semibold ">
          CASH IN HAND :
          <span className="text-green-600 font-semibold flex items-center gap-1">
            <IndianRupee size={17} />
            200000000
          </span>
        </p>
      </div>

      <div className="bg-white m-3  p-3 space-y-3">
        <div className="flex flex-col justify-between gap-1">
          <p className="text-md font-medium">TRANSACTION</p>
          <div className="flex justify-between gap-3">
            <FloatingInput
              label="Search by Type"
              type="text"
              value={filterTransaction}
              onChange={(e) => setFilterTransaction(e.target.value)}
              removeText={() => setFilterTransaction('')}
            />
                              <Button>
                                <SlidersHorizontal size={17}/>   
                  Adjust Cash 
                </Button>
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
              </DropdownMenuTrigger>
              <DropdownMenuContent className=" text-left">
                <DropdownMenuItem>Cash Withdrawal</DropdownMenuItem>
                <DropdownMenuItem>Cash Deposit</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>
        </div>
        <div className="overflow-y-scroll scroll-smooth h-[75dvh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Sl no.</TableHead>
                <TableHead className="w-[200px]">Type</TableHead>
                <TableHead className="">Name</TableHead>
                <TableHead className=" w-[100px]">Date</TableHead>
                <TableHead className="text-right w-[100px]">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="">{1}</TableCell>
                <TableCell className="">Cash Withdrawal</TableCell>
                <TableCell className=""> From : Phonepay</TableCell>
                <TableCell className="">10/04/2025</TableCell>

                <TableCell className="text-green-600 font-semibold text-right">
                  {2000}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  )
}

export default CashInHand
