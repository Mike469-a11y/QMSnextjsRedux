// Query keys for React Query
export const queryKeys = {
  // QMS queries
  qms: ['qms'],
  qmsData: () => [...queryKeys.qms, 'data'],
  qmsById: (id) => [...queryKeys.qms, 'detail', id],
  
  // User queries
  users: ['users'],
  userData: () => [...queryKeys.users, 'data'],
  userById: (id) => [...queryKeys.users, 'detail', id],
  
  // Workflow queries
  workflow: ['workflow'],
  assignments: () => [...queryKeys.workflow, 'assignments'],
  approvals: () => [...queryKeys.workflow, 'approvals'],
  submissions: () => [...queryKeys.workflow, 'submissions'],
  sourcing: () => [...queryKeys.workflow, 'sourcing'],
  executions: () => [...queryKeys.workflow, 'executions'],
  orderCompletes: () => [...queryKeys.workflow, 'orderCompletes'],
}