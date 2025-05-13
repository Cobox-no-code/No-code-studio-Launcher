'use client'

import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/redux/store'
import { closeForm as closeTransactionForm } from '@/redux/slices/transactionFormSlice'

import Item_modal from './ItemsModal'
import Party_modal from './PartyModal'
import Adjust_item from './AdjustmentItemModal'
import Category from './CategoryModal.tsx'
import AddBankAccountModal from './BankModal'
import TransactionModal from './TransactionModal'
import AddUnit from './AddUnitModal'
import UnitConversionForm from './UnitConversion'
import PaymentInForm from './Payment/PaymentIn' // Import PaymentIn component
import PaymentOutForm from './Payment/PaymentOut' // Already importing PaymentOut

const ModalManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Get states from various slices
  const { isOpen: isItemOpen } = useSelector(
    (state: RootState) => state.items
  )
  const { isOpen: isPartyOpen } = useSelector(
    (state: RootState) => state.partyForm || { isOpen: false }
  )
  const { isOpen: isAdjustmentOpen } = useSelector(
    (state: RootState) => state.items || { isOpen: false }
  )
  const { isOpen: isCategoryOpen } = useSelector(
    (state: RootState) => state.categories || { isOpen: false }
  )
  const { isOpen: isUnitOpen } = useSelector(
    (state: RootState) => state.units || { isOpen: false }
  )
  const { isOpen: isBankingOpen } = useSelector(
    (state: RootState) => state.bankAccountForm || { isOpen: false }
  )
  
  // Get unit conversion form state
  const { isOpen: isUnitConversionOpen } = useSelector(
    (state: RootState) => state.unitConversion || { isOpen: false }
  )
  
  // Get payment form state
  const { 
    isOpen: isPaymentOpen,
    formData: paymentFormData
  } = useSelector(
    (state: RootState) => state.paymentForm || { isOpen: false, formData: {} }
  )
  
  // Get transaction form state including the transaction type
  const { 
    isOpen: isTransactionOpen, 
    transactionType, 
    formData 
  } = useSelector(
    (state: RootState) => state.transactionForm || { isOpen: false, transactionType: null ,formData:null}
  )

  // Check if any modal is open
  const isAnyModalOpen = isItemOpen || isPartyOpen || isAdjustmentOpen || 
                         isCategoryOpen || isBankingOpen || isTransactionOpen || 
                         isUnitOpen || isUnitConversionOpen || isPaymentOpen;

  // Handle body scroll
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      setTimeout(() => {
        document.body.style.overflow = 'auto'
      }, 300)
    }
  }, [isAnyModalOpen])

  // Handle transaction modal close
  const handleTransactionClose = () => {
    dispatch(closeTransactionForm());
  };

  return (
    <section>
      {isAnyModalOpen && (
        <div className="w-full h-full fixed top-0 left-0 z-40 grid content-center items-center justify-items-center overflow-y-auto p-5 bg-black/50">
          <main className="relative bg-white z-50">
            {/* Render the appropriate modal based on state */}
            {isItemOpen && <Item_modal />}
            {isPartyOpen && <Party_modal />}
            {isAdjustmentOpen && <Adjust_item />}
            {isCategoryOpen && <Category />}
            {isBankingOpen && <AddBankAccountModal />}
            {isUnitOpen && <AddUnit />}
            {isUnitConversionOpen && <UnitConversionForm />}
            
            {/* Only show transaction modal if it's open AND we have a transaction type */}
            {isTransactionOpen && transactionType && (
              <TransactionModal 
                transactionType={transactionType}
                isOpen={isTransactionOpen}
                onClose={handleTransactionClose}
                selectedBankId={formData.bankAccountId || undefined}
              />
            )}

            {/* Render payment forms - they internally check if they should display based on direction */}
            {isPaymentOpen && (
              <>
                <PaymentInForm />
                <PaymentOutForm />
              </>
            )}
          </main>
        </div>
      )}
    </section>
  )
}

export default ModalManager