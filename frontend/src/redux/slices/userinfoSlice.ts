import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type SubscriptionInfo = {
  plan_name: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  price: number;
  discount: number;
  final_price: number;
};

type UserInfo = {
  customer_id: number;
  name: string;
  phone: string;
  email: string;
  subscription: SubscriptionInfo | null;
};

const initialState: UserInfo = {
  customer_id: 0,
  name: '',
  phone: '',
  email: '',
  subscription: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserInfo(state, action: PayloadAction<UserInfo>) {
      return action.payload;
    },
    clearUserInfo(state) {
      return initialState;
    },
    updateSubscription(state, action: PayloadAction<SubscriptionInfo>) {
      state.subscription = action.payload;
    },
  },
});

export const { setUserInfo, clearUserInfo, updateSubscription } = userSlice.actions;

export default userSlice.reducer;
