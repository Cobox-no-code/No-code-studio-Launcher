'use client'

import React, { useState, useRef, useEffect } from 'react'
import FloatingInput from '../ui/floating-input'
import { FaTrashAlt } from 'react-icons/fa'

interface SaleFormProps {
  formId: string
  formData: {
    amount: string
    creditDetails?: string
    invoiceNumber?: string
    invoiceDate?: string
    stateOfSupply?: string
    billingName?: string
    searchName?: string
    address?: string
    phone?: string

  }
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onSubmit: (e: React.FormEvent) => void
  customerList: string[]
  updateCustomerName: (name: string) => void
  paymentType: 'cash' | 'credit'
  onTogglePaymentType: () => void
}

const indianStates = [
  'None',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
]

const unitOptions = ['pcs', 'kg', 'litre', 'box', 'meter']
const priceTypes = ['Without Tax', 'With Tax']
const taxTypes = ['None', 'GST', 'SGST']

interface ItemRow {
  item: string
  qty: string
  unit: string
  priceType: string
  price: string
  taxType: string
  taxAmount: string
  amount: string
}

export default function SaleForm({
  formId,
  formData,
  onChange,
  onSubmit,
  customerList,
  updateCustomerName,
  paymentType,
  onTogglePaymentType,
}: SaleFormProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [items, setItems] = useState<ItemRow[]>([
    {
      item: '',
      qty: '',
      unit: 'pcs',
      priceType: 'Without Tax',
      price: '',
      taxType: 'None',
      taxAmount: '',
      amount: '',
    },
    {
      item: '',
      qty: '',
      unit: 'pcs',
      priceType: 'Without Tax',
      price: '',
      taxType: 'None',
      taxAmount: '',
      amount: '',
    },
  ])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleStateSelect = (state: string) => {
    onChange({
      target: {
        name: 'stateOfSupply',
        value: state,
      },
    } as React.ChangeEvent<HTMLInputElement>)
    setShowDropdown(false)
  }

  const handleItemChange = (
    index: number,
    field: keyof ItemRow,
    value: string
  ) => {
    const updatedItems = [...items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    }
    setItems(updatedItems)
  }

  const addRow = () => {
    setItems([
      ...items,
      {
        item: '',
        qty: '',
        unit: 'pcs',
        priceType: 'Without Tax',
        price: '',
        taxType: 'None',
        taxAmount: '',
        amount: '',
      },
    ])
  }

  const deleteRow = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index)
    setItems(updatedItems)
  }

  return (
    <div className="bg-white h-full">
      <div className="w-full h-full bg-white p-6 overflow-auto text-gray-400 mx-auto">
        <form className="space-y-10" onSubmit={onSubmit}>
          <div className="flex justify-between">
            <div className="flex flex-col gap-5 w-[40%]">
              {paymentType === 'credit' && (
                <>
                  <div className="flex gap-3">
                    <FloatingInput
                      label="Billing Name (Optional)"
                      name="billingName"
                      type="text"
                      value={formData.billingName}
                      onChange={onChange}
                      className="w-[150px] border-gray-400"
                      inputClassName="text-gray-600"
                    />
                    <FloatingInput
                      label="Phone No."
                      name="phone"
                      type="number"
                      value={formData.phone || ''}
                      onChange={onChange}
                      className="w-[150px] border-gray-400"
                      inputClassName="text-gray-600"
                    />
                  </div>
                  <FloatingInput
                    label="Billing Address"
                    name="address"
                    type="text"
                    value={formData.address || ''}
                    onChange={onChange}
                    className="w-[200px] h-[70px] border-gray-400"
                    inputClassName="text-gray-600"
                  />
                </>
              )}

              {paymentType === 'cash' && (
                <>
                  <FloatingInput
                    label="Search By Name/Phone*"
                    name="searchName"
                    type="text"
                    value={formData.searchName }
                    onChange={onChange}
                    className="w-[250px]  border-gray-400 "
                    inputClassName="text-gray-600"
                  />
                  <FloatingInput
                    label="Phone No."
                    name="creditDetails"
                    type="number"
                    value={formData.creditDetails || ''}
                    onChange={onChange}
                    className="w-[250px]  border-gray-400"
                    inputClassName="text-gray-600"
                  />
                </>
              )}
            </div>

            {/* right column */}

            <div className="flex flex-col  gap-3 w-1/2 items-center">
              <FloatingInput
                label="Invoice Number"
                name="invoiceNumber"
                value={formData.invoiceNumber || ''}
                onChange={onChange}
                className="w-[200px] border-gray-400"
                inputClassName="text-gray-500"
              />
              <FloatingInput
                label="Invoice Date"
                name="invoiceDate"
                type="date"
                value={formData.invoiceDate || ''}
                onChange={onChange}
                className="w-[200px] border-gray-400"
                inputClassName="text-gray-400"
              />

              

              <div className="relative w-[230px]" ref={dropdownRef}>
                <label className="text-xs mb-1 font-semibold text-gray-400">
                  State of Supply
                </label>
                <div
                  className="border p-2 rounded-md cursor-pointer border-gray-400 bg-white text-gray-500 flex justify-between items-center"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <span className='text-gray-400'>{formData.stateOfSupply || 'Select'}</span>
                  <span className="ml-2">&#x25BC;</span>
                </div>
                {showDropdown && (
                  <div className="absolute mt-1 w-full max-h-40 overflow-y-auto border bg-white rounded shadow z-10">
                    {indianStates.map((state) => (
                      <div
                        key={state}
                        onClick={() => handleStateSelect(state)}
                        className="p-2 hover:bg-blue-100 cursor-pointer"
                      >
                        {state}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mt-10">
            <table className="w-full border border-gray-300 text-gray-700 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">#</th>
                  <th className="border p-2">ITEM</th>
                  <th className="border p-2">QTY</th>
                  <th className="border p-2">UNIT</th>
                  <th className="border p-2">PRICE/UNIT</th>
                  <th className="border p-2">Price Type</th>
                  <th className="border p-2">TAX</th>
                  <th className="border p-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => (
                  <tr
                    key={index}
                    className="group hover:bg-gray-50 transition-colors"
                  >
                    <td className="border px-7 text-center relative">
                      {index + 1}
                      <button
                        type="button"
                        onClick={() => deleteRow(index)}
                        className="absolute top-1/2 -translate-y-1/2 right-3 opacity-0 group-hover:opacity-100 text-gray-500 hover:cursor-pointer"
                      >
                        <FaTrashAlt size={20} />
                      </button>
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full p-1 border rounded"
                        value={row.item}
                        onChange={(e) =>
                          handleItemChange(index, 'item', e.target.value)
                        }
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        className="w-full p-1 border rounded"
                        value={row.qty}
                        onChange={(e) =>
                          handleItemChange(index, 'qty', e.target.value)
                        }
                      />
                    </td>
                    <td className="border p-2">
                      <select
                        className="w-full p-1 border rounded"
                        value={row.unit}
                        onChange={(e) =>
                          handleItemChange(index, 'unit', e.target.value)
                        }
                      >
                        {unitOptions.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        className="w-full p-1 border rounded"
                        value={row.price}
                        onChange={(e) =>
                          handleItemChange(index, 'price', e.target.value)
                        }
                      />
                    </td>
                    <td className="border p-2">
                      <select
                        className="w-full p-1 border rounded"
                        value={row.priceType}
                        onChange={(e) =>
                          handleItemChange(index, 'priceType', e.target.value)
                        }
                      >
                        {priceTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border p-2">
                      <div className="flex gap-1">
                        <select
                          className="w-1/2 p-1 border rounded"
                          value={row.taxType}
                          onChange={(e) =>
                            handleItemChange(index, 'taxType', e.target.value)
                          }
                        >
                          {taxTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          className="w-1/2 p-1 border rounded"
                          value={row.taxAmount}
                          onChange={(e) =>
                            handleItemChange(index, 'taxAmount', e.target.value)
                          }
                        />
                      </div>
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        className="w-full p-1 border rounded"
                        value={row.amount}
                        onChange={(e) =>
                          handleItemChange(index, 'amount', e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex justify-start">
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:cursor-pointer hover:bg-blue-700"
                onClick={addRow}
              >
                + Add Row
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
