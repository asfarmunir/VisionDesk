"use client";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi, type Task, type UpdateTaskPayload } from '@/lib/api/tasks'
import { USER_PROJECTS_WITH_TASKS_KEY } from './useUserProjectsWithTasks'
import type { UserProjectsWithTasksResponse, UserProjectWithTasks, UserProjectTask } from '@/lib/api/projects'

interface UseUpdateTaskOptions {
  onSuccess?: (task: Task) => void
  onError?: (error: Error) => void
}

export function useUpdateTask(opts: UseUpdateTaskOptions = {}) {
  const qc = useQueryClient()
  return useMutation<Task, Error, { id: string; data: UpdateTaskPayload }, { previous?: UserProjectsWithTasksResponse | undefined }>({
    mutationFn: ({ id, data }) => tasksApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: USER_PROJECTS_WITH_TASKS_KEY })
      const previous = qc.getQueryData<UserProjectsWithTasksResponse>(USER_PROJECTS_WITH_TASKS_KEY)
      if (previous?.projects) {
        const next: UserProjectsWithTasksResponse = {
          projects: previous.projects.map((p: UserProjectWithTasks) => ({
            ...p,
            tasks: p.tasks.map((t: UserProjectTask) => (t._id === id ? { ...t, ...data } as UserProjectTask : t))
          }))
        }
        qc.setQueryData<UserProjectsWithTasksResponse>(USER_PROJECTS_WITH_TASKS_KEY, next)
      }
      return { previous }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(USER_PROJECTS_WITH_TASKS_KEY, ctx.previous)
      opts.onError?.(err)
    },
    onSuccess: (task, { id }) => {
      qc.setQueryData<UserProjectsWithTasksResponse>(USER_PROJECTS_WITH_TASKS_KEY, (prev) => {
        if (!prev?.projects) return prev
        return {
          projects: prev.projects.map((p: UserProjectWithTasks) => ({
            ...p,
            tasks: p.tasks.map((t: UserProjectTask) => (t._id === id ? { ...t, ...task } as UserProjectTask : t))
          }))
        }
      })
      opts.onSuccess?.(task)
    },
  })
}

export default useUpdateTask
