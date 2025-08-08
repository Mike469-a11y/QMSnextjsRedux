import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../api/endpoints'
import { queryKeys } from '../api/queryKeys'

// User Management Hooks
export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.userData(),
    queryFn: userApi.getUsers,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export const useUserById = (id) => {
  return useQuery({
    queryKey: queryKeys.userById(id),
    queryFn: () => userApi.getUserById(id),
    enabled: !!id,
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userData() })
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: userApi.updateUser,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.userById(data.id), data)
      queryClient.invalidateQueries({ queryKey: queryKeys.userData() })
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: userApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userData() })
    },
  })
}