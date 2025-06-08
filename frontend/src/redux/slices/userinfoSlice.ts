import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
  sync_enabled: boolean;
  login: boolean;
  isExpired: boolean;
};

const initialState: UserInfo = {
  customer_id: 0,
  name: "",
  phone: "",
  email: "",
  login: false,
  subscription: null,
  isExpired: false,
  sync_enabled: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
  setUserInfo(state, action: PayloadAction<UserInfo>) {
  const incoming = action.payload;

  console.log("Setting user info:", incoming);
  // Only update localStorage if sync_enabled value changed
  const storedSync = localStorage.getItem("sync_enabled");
  if (storedSync === null) {
    localStorage.setItem("sync_enabled", String(incoming.sync_enabled));
  }
  const currentSync = storedSync === "true"; // localStorage stores strings

  if (incoming.sync_enabled !== currentSync) {
    localStorage.setItem("sync_enabled", String(incoming.sync_enabled));
  }

  return incoming;
},

    clearUserInfo(state) {
      return initialState;
    },
    updateSubscription(state, action: PayloadAction<SubscriptionInfo>) {
      state.subscription = action.payload;
    },
    updateSubscriptionStatus: (
      state,
      action: PayloadAction<{
        subscription: any;
        isExpired: boolean;
      }>
    ) => {
      state.subscription = action.payload.subscription;
      state.isExpired = action.payload.isExpired;
    },

    // Add a separate reducer if you just want to update the isExpired flag
    updateIsExpired: (state, action: PayloadAction<boolean>) => {
      state.isExpired = action.payload;
    },

    // Add a reducer to clear subscription when logging out
    clearSubscription: (state) => {
      state.subscription = null;
      state.isExpired = false;
    },
  },
});

export const {
  setUserInfo,
  clearUserInfo,
  updateSubscription,
  updateIsExpired,
  updateSubscriptionStatus,
} = userSlice.actions;

export default userSlice.reducer;
