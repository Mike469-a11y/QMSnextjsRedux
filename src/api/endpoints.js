// Mock API functions for demonstration
// In a real application, these would make actual HTTP requests

export const qmsApi = {
  // QMS Data operations
  getQmsData: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return [
      { id: 1, title: 'QMS Item 1', status: 'active', assignee: 'John Doe' },
      { id: 2, title: 'QMS Item 2', status: 'pending', assignee: 'Jane Smith' },
    ]
  },

  getQmsById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { id, title: `QMS Item ${id}`, status: 'active', details: 'Sample details' }
  },

  createQmsItem: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 800))
    return { id: Date.now(), ...data, createdAt: new Date() }
  },

  updateQmsItem: async ({ id, ...data }) => {
    await new Promise(resolve => setTimeout(resolve, 600))
    return { id, ...data, updatedAt: new Date() }
  },

  deleteQmsItem: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 400))
    return { success: true, id }
  },
}

export const userApi = {
  // User management operations
  getUsers: async () => {
    await new Promise(resolve => setTimeout(resolve, 400))
    return [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'admin' },
    ]
  },

  getUserById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { id, name: `User ${id}`, email: `user${id}@example.com`, role: 'user' }
  },

  createUser: async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 700))
    return { id: Date.now(), ...userData, createdAt: new Date() }
  },

  updateUser: async ({ id, ...userData }) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { id, ...userData, updatedAt: new Date() }
  },

  deleteUser: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true, id }
  },
}

export const workflowApi = {
  // Workflow operations (assignments, approvals, etc.)
  getAssignments: async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return [
      { id: 1, title: 'Assignment 1', status: 'pending', assignee: 'John Doe' },
      { id: 2, title: 'Assignment 2', status: 'completed', assignee: 'Jane Smith' },
    ]
  },

  getApprovals: async () => {
    await new Promise(resolve => setTimeout(resolve, 450))
    return [
      { id: 1, title: 'Approval 1', status: 'pending', approver: 'Manager A' },
      { id: 2, title: 'Approval 2', status: 'approved', approver: 'Manager B' },
    ]
  },

  getSubmissions: async () => {
    await new Promise(resolve => setTimeout(resolve, 600))
    return [
      { id: 1, title: 'Submission 1', status: 'submitted', submitter: 'User A' },
      { id: 2, title: 'Submission 2', status: 'draft', submitter: 'User B' },
    ]
  },

  getSourcing: async () => {
    await new Promise(resolve => setTimeout(resolve, 400))
    return [
      { id: 1, title: 'Sourcing 1', status: 'active', supplier: 'Supplier A' },
      { id: 2, title: 'Sourcing 2', status: 'completed', supplier: 'Supplier B' },
    ]
  },

  getExecutions: async () => {
    await new Promise(resolve => setTimeout(resolve, 350))
    return [
      { id: 1, title: 'Execution 1', status: 'in-progress', executor: 'Team A' },
      { id: 2, title: 'Execution 2', status: 'completed', executor: 'Team B' },
    ]
  },

  getOrderCompletes: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return [
      { id: 1, orderNumber: 'ORD-001', status: 'completed', completedAt: new Date() },
      { id: 2, orderNumber: 'ORD-002', status: 'pending', completedAt: null },
    ]
  },
}