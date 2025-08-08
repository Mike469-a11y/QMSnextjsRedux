import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentUser: {
    login: 'MFakheem',
    role: 'admin',
    permissions: ['read', 'write', 'admin'],
  },
  users: [],
  isAuthenticated: true,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload
    },
    setUsers: (state, action) => {
      state.users = action.payload
    },
    addUser: (state, action) => {
      state.users.push(action.payload)
    },
    updateUser: (state, action) => {
      const index = state.users.findIndex(user => user.id === action.payload.id)
      if (index !== -1) {
        state.users[index] = action.payload
      }
    },
    removeUser: (state, action) => {
      state.users = state.users.filter(user => user.id !== action.payload)
    },
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload
    },
  },
})

export const {
  setCurrentUser,
  setUsers,
  addUser,
  updateUser,
  removeUser,
  setAuthenticated,
} = userSlice.actions

export default userSlice.reducer