"use client";
import { useQuery } from '@tanstack/react-query'
import usersApi, { type FetchUsersParams, type UsersListResponse } from '@/lib/api/users'

export const USERS_QUERY_KEY = 'users'

export default function useUsers(params: FetchUsersParams = {}) {
  return useQuery<UsersListResponse, Error>({
    queryKey: [USERS_QUERY_KEY, params],
    queryFn: () => usersApi.list(params),
    placeholderData: (prev) => prev
  })
}
