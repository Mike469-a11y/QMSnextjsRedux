import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  activeSection: 'hunting',
  adminDropdown: false,
  isLoading: false,
  error: null,
  sidebarCollapsed: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveSection: (state, action) => {
      state.activeSection = action.payload
    },
    setAdminDropdown: (state, action) => {
      state.adminDropdown = action.payload
    },
    toggleAdminDropdown: (state) => {
      state.adminDropdown = !state.adminDropdown
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
  },
})

export const {
  setActiveSection,
  setAdminDropdown,
  toggleAdminDropdown,
  setLoading,
  setError,
  clearError,
  toggleSidebar,
} = uiSlice.actions

export default uiSlice.reducer