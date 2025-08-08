import { configureStore } from '@reduxjs/toolkit'
import uiSlice from './slices/uiSlice'
import userSlice from './slices/userSlice'
import qmsSlice from './slices/qmsSlice'

export const store = configureStore({
  reducer: {
    ui: uiSlice,
    user: userSlice,
    qms: qmsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

// Export types for TypeScript (these will be ignored in JavaScript)
// export type RootState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch