import { useQuery } from '@tanstack/react-query'
import { workflowApi } from '../api/endpoints'
import { queryKeys } from '../api/queryKeys'

// Workflow Hooks
export const useAssignments = () => {
  return useQuery({
    queryKey: queryKeys.assignments(),
    queryFn: workflowApi.getAssignments,
    staleTime: 1000 * 60 * 3, // 3 minutes
  })
}

export const useApprovals = () => {
  return useQuery({
    queryKey: queryKeys.approvals(),
    queryFn: workflowApi.getApprovals,
    staleTime: 1000 * 60 * 3,
  })
}

export const useSubmissions = () => {
  return useQuery({
    queryKey: queryKeys.submissions(),
    queryFn: workflowApi.getSubmissions,
    staleTime: 1000 * 60 * 3,
  })
}

export const useSourcing = () => {
  return useQuery({
    queryKey: queryKeys.sourcing(),
    queryFn: workflowApi.getSourcing,
    staleTime: 1000 * 60 * 3,
  })
}

export const useExecutions = () => {
  return useQuery({
    queryKey: queryKeys.executions(),
    queryFn: workflowApi.getExecutions,
    staleTime: 1000 * 60 * 3,
  })
}

export const useOrderCompletes = () => {
  return useQuery({
    queryKey: queryKeys.orderCompletes(),
    queryFn: workflowApi.getOrderCompletes,
    staleTime: 1000 * 60 * 3,
  })
}