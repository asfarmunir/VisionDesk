"use client";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, type UserSummary } from '@/lib/api/users'
import type { UsersListResponse } from '@/lib/api/users'
import { USERS_QUERY_KEY } from './useUsers'

interface UseAssignUserRoleOptions {
  onSuccess?: (user: UserSummary) => void
  onError?: (error: Error) => void
}

export function useAssignUserRole(opts: UseAssignUserRoleOptions = {}) {
  const qc = useQueryClient()
  return useMutation<UserSummary, Error, { id: string; role: 'admin' | 'moderator' | 'user' }, { previous?: UsersListResponse }>({
    mutationFn: ({ id, role }) => usersApi.assignRole(id, role),
    onMutate: async ({ id, role }) => {
      await qc.cancelQueries({ queryKey: [USERS_QUERY_KEY] })
      const previous = qc.getQueryData<UsersListResponse>([USERS_QUERY_KEY])
      if (previous?.users) {
        const updatedUsers = previous.users.map(u => u._id === id ? { ...u, role } : u)
        qc.setQueryData<UsersListResponse>([USERS_QUERY_KEY], { ...previous, users: updatedUsers })
      }
      return { previous }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData([USERS_QUERY_KEY], ctx.previous)
      opts.onError?.(err)
    },
    onSuccess: (user) => {
      qc.setQueryData<UsersListResponse>([USERS_QUERY_KEY], (prev) => {
        if (!prev) return prev
        return { ...prev, users: prev.users.map(u => u._id === user._id ? user : u) }
      })
      opts.onSuccess?.(user)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [USERS_QUERY_KEY] })
    }
  })
}

export default useAssignUserRole
