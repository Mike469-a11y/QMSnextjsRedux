import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  qmsData: [],
  assignments: [],
  approvals: [],
  submissions: [],
  sourcing: [],
  executions: [],
  orderCompletes: [],
  selectedQms: null,
  filters: {
    status: 'all',
    dateRange: null,
    assignee: null,
  },
}

const qmsSlice = createSlice({
  name: 'qms',
  initialState,
  reducers: {
    setQmsData: (state, action) => {
      state.qmsData = action.payload
    },
    addQmsItem: (state, action) => {
      state.qmsData.push(action.payload)
    },
    updateQmsItem: (state, action) => {
      const index = state.qmsData.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        state.qmsData[index] = action.payload
      }
    },
    setSelectedQms: (state, action) => {
      state.selectedQms = action.payload
    },
    setAssignments: (state, action) => {
      state.assignments = action.payload
    },
    setApprovals: (state, action) => {
      state.approvals = action.payload
    },
    setSubmissions: (state, action) => {
      state.submissions = action.payload
    },
    setSourcing: (state, action) => {
      state.sourcing = action.payload
    },
    setExecutions: (state, action) => {
      state.executions = action.payload
    },
    setOrderCompletes: (state, action) => {
      state.orderCompletes = action.payload
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
  },
})

export const {
  setQmsData,
  addQmsItem,
  updateQmsItem,
  setSelectedQms,
  setAssignments,
  setApprovals,
  setSubmissions,
  setSourcing,
  setExecutions,
  setOrderCompletes,
  setFilters,
  clearFilters,
} = qmsSlice.actions

export default qmsSlice.reducer