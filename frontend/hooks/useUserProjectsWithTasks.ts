"use client";
import { useQuery } from '@tanstack/react-query'
import { projectsApi, UserProjectsWithTasksResponse } from '@/lib/api/projects'

export const USER_PROJECTS_WITH_TASKS_KEY = ['user-projects-with-tasks'] as const

export function useUserProjectsWithTasks() {
  return useQuery<UserProjectsWithTasksResponse, Error>({
    queryKey: USER_PROJECTS_WITH_TASKS_KEY,
    queryFn: () => projectsApi.listUserWithTasks(),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export default useUserProjectsWithTasks
