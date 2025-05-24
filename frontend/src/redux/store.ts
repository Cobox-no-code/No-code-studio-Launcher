import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  baseApi,
  partiesBaseApi,
  salesBaseApi,
  bankingBaseApi,
  purchaseBaseApi,
} from "./api/baseApis";
import itemsReducer from "./slices/itemsSlice";
import categoriesReducer from "./slices/categorySlice";
import unitsReducer from "./slices/unitSlice";
import unitConversionReducer from "./slices/unitConversionSlice";
import groupFormReducer from "./slices/groupSlice";
import partyFormReducer from "./slices/partySlice";
import modalReducer from "./slices/modal";
import bankingReducer from "./slices/bankAccountFormSlice"; // ✅ Import banking reducer
import transactionReducer from "./slices/transactionFormSlice"; // ✅ Import transaction reducer
import { documentsBaseApi } from "./api/documentApi"; // ✅ Import document API
import { paymentApi } from "./api/paymentApi"; // ✅ Import payment API
import paymentReducer from "./slices/paymentSlice"; // ✅ Import payment slice
import userinfoReducer from "./slices/userinfoSlice";
import firmReducer from "./slices/firmSlice";
export function makeStore() {
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      [partiesBaseApi.reducerPath]: partiesBaseApi.reducer,
      [salesBaseApi.reducerPath]: salesBaseApi.reducer,
      [bankingBaseApi.reducerPath]: bankingBaseApi.reducer, // ✅ Added banking reducer
      [documentsBaseApi.reducerPath]: documentsBaseApi.reducer,
      [paymentApi.reducerPath]: paymentApi.reducer,
      items: itemsReducer,
      categories: categoriesReducer,
      units: unitsReducer,
      modal: modalReducer,
      unitConversion: unitConversionReducer,
      groupForm: groupFormReducer,
      partyForm: partyFormReducer,
      bankAccountForm: bankingReducer,
      transactionForm: transactionReducer,
      paymentForm: paymentReducer, // ✅ Added payment reducer
      userinfo: userinfoReducer,
      firm: firmReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(baseApi.middleware)
        .concat(partiesBaseApi.middleware)
        .concat(paymentApi.middleware)
        .concat(bankingBaseApi.middleware) // ✅ Added banking middleware
        .concat(documentsBaseApi.middleware),
  });
}

export const store = makeStore();

setupListeners(store.dispatch);

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
