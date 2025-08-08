import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qmsApi } from '../api/endpoints'
import { queryKeys } from '../api/queryKeys'

// QMS Data Hooks
export const useQmsData = () => {
  return useQuery({
    queryKey: queryKeys.qmsData(),
    queryFn: qmsApi.getQmsData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useQmsById = (id) => {
  return useQuery({
    queryKey: queryKeys.qmsById(id),
    queryFn: () => qmsApi.getQmsById(id),
    enabled: !!id,
  })
}

export const useCreateQmsItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: qmsApi.createQmsItem,
    onSuccess: () => {
      // Invalidate and refetch QMS data
      queryClient.invalidateQueries({ queryKey: queryKeys.qmsData() })
    },
  })
}

export const useUpdateQmsItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: qmsApi.updateQmsItem,
    onSuccess: (data) => {
      // Update the specific item in cache
      queryClient.setQueryData(queryKeys.qmsById(data.id), data)
      // Invalidate list query
      queryClient.invalidateQueries({ queryKey: queryKeys.qmsData() })
    },
  })
}

export const useDeleteQmsItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: qmsApi.deleteQmsItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.qmsData() })
    },
  })
}