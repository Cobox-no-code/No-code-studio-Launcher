'use client'
import { Button } from '@/components/ui/button'
import FloatingInput from '@/components/ui/floating-input'
import { openModal } from '@/redux/slices/modal'
import {
  EllipsisVertical,
  LoaderCircle,
  Plus,
  SlidersVertical,
  X,
} from 'lucide-react'
import React, { ChangeEvent, Suspense, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AppDispatch } from '@/redux/store'

const Category = () => {
  const dispatch = useDispatch<AppDispatch>()

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [selectProduct, setSelectProduct] = useState()

  const [filterProduct, setFilterProduct] = useState('')
  const [filterTransaction, setFilterTransaction] = useState('')

  const open = (types: string, id: string) => {
    if (types === 'AdjustItems') {
      dispatch(
        openModal({
          type: types,
          index: id,
        })
      )
    } else {
      dispatch(
        openModal({
          type: types,
        })
      )
    }
  }

  return (
    <main className="w-full flex gap-3 h-full ">
      <section className="bg-white shadow-lg  w-1/4 my-3 ml-3 p-3 space-y-3 ">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <FloatingInput
              label="Search Products...."
              className="w-full"
              removeText={() => setFilterProduct('')}
              type="text"
              value={filterProduct}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFilterProduct(e.target.value)
              }
            />
            <Button variant={'destructive'} onClick={() => open('Party', '')}>
              <Plus /> Add Expense
            </Button>
            {/* <Button onClick={handleCreateItem}>
              <Plus /> Add Item
            </Button> */}
          </div>
        </div>
        <div className="overflow-y-auto whitespace-nowrap">
          <Table className="h-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">CATEGORY</TableHead>
                <TableHead className="text-right">AMOUNT</TableHead>
                <TableHead className="text-right w-5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className=" ">
              <TableRow className="">
                <TableCell className="font-semibold">{'item.name'}</TableCell>

                <TableCell className="text-right">{0}</TableCell>
                <TableCell className="text-right w-5">
                  <EllipsisVertical size={15} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>
      <section className=" w-3/4 my-3 mr-3 flex flex-col gap-3">
        {/* ITEM DETAILS-------------------------------------------------------------------------------------------------- */}

        <div className=" bg-white shadow-lg h-1/5 w-full p-3 ">
          <div className="flex justify-between">
            <p className="text-lg font-semibold">Party Name</p>
            <p className="text-md">Total : 323</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm font-medium text-gray-500">
              {'expense type'}
            </p>
            <p className="text-md ">Balance : 323</p>
          </div>
        </div>

        {/* TABLE INFORMATION---------------------------------------------------------------------------------------------- */}
        <div className=" bg-white shadow-lg p-3 h-full space-y-2">
          <div className="flex justify-between">
            <p className="text-md font-semibold">TRANSACTION</p>
            <FloatingInput
              label="Search by Name | Type"
              type="text"
              value={filterTransaction}
              removeText={() => setFilterTransaction('')}
              onChange={(e) => setFilterTransaction(e.target.value)}
            />
          </div>
          <div className=" overflow-y-scroll h-[71dvh]">
            <Table>
              {/* <TableCaption>
                {transaction.length > 0
                  ? ' A list of your recent invoices.'
                  : 'Select Product to see invoices '}
              </TableCaption> */}
              <TableHeader>
                <TableRow>
                  <TableHead className="w-5">DATE</TableHead>
                  <TableHead className="border-l">EXP. NO</TableHead>
                  <TableHead className="w-24 border-l">PARTY</TableHead>
                  <TableHead className="w-24 border-l">PAYMENT</TableHead>
                  <TableHead className="w-24 border-l">AMOUNT</TableHead>
                  <TableHead className="w-24 border-l">BALANCE</TableHead>
                  <TableHead className="w-5 border-l"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableHead className="w-5">12/12/1212</TableHead>
                  <TableHead className="border-l">1</TableHead>
                  <TableHead className="w-24 border-l">CASH</TableHead>
                  <TableHead className="w-24 border-l">CASH</TableHead>
                  <TableHead className="w-24 border-l">1000</TableHead>
                  <TableHead className="w-24 border-l">0.00</TableHead>
                  <TableHead className="w-5 border-l"><EllipsisVertical size={20} color="gray" /></TableHead>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Category
