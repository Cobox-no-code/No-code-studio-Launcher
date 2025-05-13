// import { getData } from '@/services/requests.services'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
export type ModalType =
  | null
  | 'Items'
  | 'Party'
  | 'AdjustItems'
  | 'PaymentIn'
  | 'PaymentOut'
  | 'BankAccount'
  | 'BankAccountTransaction'
  | 'Expense'
  | unknown

interface ModalState {
  activeModal: ModalType
  data: unknown
  editData: [] | null
  onModalClose?: (() => void) | null
  getData?: () => Promise<void> | null
  types?: string
  index?: string
}

const initialState: ModalState = {
  activeModal: null,
  data: [],
  editData :null
}
const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModal(
      state,
      action: PayloadAction<{
        type: ModalType
        onModalClose?: () => void
        data?: [] 
        editData?: []
        types?: string
        index?: string
        getData?: () => Promise<void>
      }>
    ) {
      state.activeModal = action.payload.type
      state.onModalClose = action.payload.onModalClose
      state.data = action.payload.data ?? []
      state.editData = action.payload.editData ?? null
      state.types = action.payload.types
      state.index = action.payload.index
      state.getData = action.payload.getData
    },
    closeModal(state) {
      state.activeModal = null
      if (state.onModalClose) {
        state.onModalClose()
        state.onModalClose = null
      }
    },
  },
})

export const { openModal, closeModal } = modalSlice.actions

export default modalSlice.reducer
