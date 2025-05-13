'use client'
import { Button } from '@/components/ui/button'
import FloatingInput from '@/components/ui/floating-input'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ItemType } from '@/models/item/item.model'
import { useGetItemsQuery } from '@/redux/api'
import { openModal } from '@/redux/slices/modal'
import { AppDispatch } from '@/redux/store'
import {
    AlertCircle,
    EllipsisVertical,
    LoaderCircle,
    Plus
} from 'lucide-react'
import { ChangeEvent, useState } from 'react'
import { useDispatch } from 'react-redux'

// Helper to format currency
const formatCurrency = (amount: string | number | bigint) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(numericAmount);
};

const Services = () => {
  const dispatch = useDispatch<AppDispatch>()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterService, setFilterService] = useState('')
  const [filterTransaction, setFilterTransaction] = useState('')

  // Use RTK Query to fetch only services
  const {
    data: services,
    isLoading,
    isError,
    error
  } = useGetItemsQuery({ type: ItemType.SERVICE });

  // Handle service selection
  const handleSelectService = (id: string) => {
    setSelectedId(id);
  };

  // Get the selected service details
  const selectedService = selectedId 
    ? services?.find(service => service.id === selectedId) 
    : null;

  // Open modal with specific type
  const open = (types: string, id: string = '') => {
    dispatch(
      openModal({
        type: types,
        index: id,
      })
    )
  }

  // Filter services based on search
  const filteredServices = services?.filter(service => 
    service.name.toLowerCase().includes(filterService.toLowerCase())
  );

  return (
    <main className="w-full flex gap-3 h-full ">
      <section className="bg-white shadow-lg w-1/4 my-3 ml-3 p-3 space-y-3 ">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <FloatingInput
              label="Search Services..."
              className="w-full"
              removeText={() => setFilterService('')}
              type="text"
              value={filterService}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFilterService(e.target.value)
              }
            />
            <Button 
              onClick={() => {
                // Pre-select service type when opening modal
                dispatch(
                  openModal({
                    type: 'Items',
                 
                  })
                )
              }}
            >
              <Plus /> Add Service
            </Button>
          </div>
        </div>
        <div className="overflow-y-auto whitespace-nowrap h-[calc(100vh-180px)]">
          <Table className="h-full">
            <TableCaption>
              {isLoading ? 'Loading services...' : 
               isError ? 'Error loading services' : 
               filteredServices?.length === 0 ? 'No services found' : 
               'A list of your Services.'}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Service Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right w-5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    <LoaderCircle className="w-5 h-5 mx-auto animate-spin text-blue-500" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-red-500">
                    <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                    {error?.toString() || 'Failed to load services'}
                  </TableCell>
                </TableRow>
              ) : filteredServices?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                    No services found
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices?.map(service => (
                  <TableRow 
                    key={service.id}
                    className={`cursor-pointer ${selectedId === service.id ? 'bg-blue-50' : ''}`} 
                    onClick={() => handleSelectService(service.id)}
                  >
                    <TableCell className="font-semibold">{service.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(service.salePrice || 0)}</TableCell>
                    <TableCell className="text-right w-5">
                      <EllipsisVertical 
                        size={15} 
                        className="cursor-pointer ml-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          open('AdjustItems', service.id);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
      <section className="w-3/4 my-3 mr-3 flex flex-col gap-3">
        {/* SERVICE DETAILS-------------------------------------------------------------------------------------------------- */}

        <div className="bg-white shadow-lg h-1/5 w-full p-3 ">
          <p className="text-lg font-semibold">
            {selectedService ? selectedService.name : 'Select Service / Service Details'}
          </p>
       
          <div className="flex justify-between items-center mt-4">
            <div className="space-y-6">
              <p className="text-base font-semibold text-gray-400">
                SALE PRICE: <span className="text-green-600">
                  {selectedService ? formatCurrency(selectedService.salePrice) : '—'}
                </span>
              </p>
              {selectedService?.hsnCode && (
                <p className="text-base font-semibold text-gray-400">
                  HSN CODE: <span className="text-green-600">{selectedService.hsnCode}</span>
                </p>
              )}
            </div>
            {selectedService?.taxRateId && (
              <div className="space-y-6">
                <p className="text-base font-semibold text-gray-400">
                  TAX RATE: <span className="text-green-600">
                    {selectedService.taxRateId === 'Exempt' ? 'Exempt' : `${selectedService.taxRateId}%`}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* TABLE INFORMATION---------------------------------------------------------------------------------------------- */}
        <div className="bg-white shadow-lg p-3 h-full space-y-2">
          <div className="flex justify-between">
            <p className="text-lg font-semibold">TRANSACTION HISTORY</p>
            <FloatingInput
              label="Search by Invoice | Date"
              type="text"
              value={filterTransaction}
              removeText={() => setFilterTransaction('')}
              onChange={(e) => setFilterTransaction(e.target.value)}
            />
          </div>
          <div className="overflow-y-scroll h-[71.5dvh]">
            <Table>
              <TableCaption>
                {selectedService 
                  ? 'A list of transactions for this service.' 
                  : 'Select a service to see its transactions'}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[20px]">Sl.no</TableHead>
                  <TableHead className="">Type</TableHead>
                  <TableHead className="w-24">Invoice no.</TableHead>
                  <TableHead className="w-24">Date</TableHead>
                  <TableHead className="w-24">Customer</TableHead>
                  <TableHead className="text-right w-24">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!selectedService ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                      Select a service to view transactions
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                      No transactions found for this service
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Services