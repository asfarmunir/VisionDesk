"use client";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi, type Task, type UpdateTaskPayload } from '@/lib/api/tasks'
import { USER_PROJECTS_WITH_TASKS_KEY } from './useUserProjectsWithTasks'
import { projectKeys } from '@/hooks/useProject'
import type { UserProjectsWithTasksResponse, UserProjectWithTasks, UserProjectTask, Project, ProjectTask } from '@/lib/api/projects'

interface UseUpdateTaskOptions {
  onSuccess?: (task: Task) => void
  onError?: (error: Error) => void
}

export function useUpdateTask(opts: UseUpdateTaskOptions = {}) {
  const qc = useQueryClient()
  return useMutation<
    Task,
    Error,
    { id: string; data: UpdateTaskPayload; projectId?: string },
    {
      previous?: UserProjectsWithTasksResponse
      previousProject?: Project
    }
  >({
    mutationFn: ({ id, data }) => tasksApi.update(id, data),
    onMutate: async ({ id, data, projectId }) => {
      // Cancel queries that may be affected
      await Promise.all([
        qc.cancelQueries({ queryKey: USER_PROJECTS_WITH_TASKS_KEY }),
        projectId ? qc.cancelQueries({ queryKey: projectKeys.detail(projectId) }) : Promise.resolve()
      ])

      const previous = qc.getQueryData<UserProjectsWithTasksResponse>(USER_PROJECTS_WITH_TASKS_KEY)
      const previousProject = projectId
        ? qc.getQueryData<Project>(projectKeys.detail(projectId))
        : undefined

      // Optimistic update for user projects (assigned tasks list)
      if (previous?.projects) {
        const next: UserProjectsWithTasksResponse = {
          projects: previous.projects.map((p: UserProjectWithTasks) => ({
            ...p,
            tasks: p.tasks.map((t: UserProjectTask) => (t._id === id ? { ...t, ...data } as UserProjectTask : t))
          }))
        }
        qc.setQueryData<UserProjectsWithTasksResponse>(USER_PROJECTS_WITH_TASKS_KEY, next)
      }

      // Optimistic update for single project detail (admin / project detail page)
      if (previousProject && Array.isArray(previousProject.tasks)) {
        const nextProject: Project = {
          ...previousProject,
          tasks: (previousProject.tasks as ProjectTask[]).map((t) =>
            t._id === id ? { ...t, ...data } as ProjectTask : t
          )
        }
        qc.setQueryData<Project>(projectKeys.detail(previousProject._id), nextProject)
      }

      return { previous, previousProject }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(USER_PROJECTS_WITH_TASKS_KEY, ctx.previous)
      if (ctx?.previousProject) qc.setQueryData(projectKeys.detail(ctx.previousProject._id), ctx.previousProject)
      opts.onError?.(err)
    },
    onSuccess: (task, { id, projectId }) => {
      // Merge server task for user projects cache
      qc.setQueryData<UserProjectsWithTasksResponse>(USER_PROJECTS_WITH_TASKS_KEY, (prev) => {
        if (!prev?.projects) return prev
        return {
          projects: prev.projects.map((p: UserProjectWithTasks) => ({
            ...p,
            tasks: p.tasks.map((t: UserProjectTask) => (t._id === id ? { ...t, ...task } as UserProjectTask : t))
          }))
        }
      })

      // Merge server task for project detail cache
      if (projectId) {
        qc.setQueryData<Project>(projectKeys.detail(projectId), (prev) => {
          if (!prev) return prev
            return {
              ...prev,
              tasks: Array.isArray(prev.tasks)
                ? (prev.tasks as ProjectTask[]).map((t: ProjectTask) =>
                    t._id === id ? { ...t, ...task } as ProjectTask : t
                  )
                : prev.tasks
            }
        })
      }

      opts.onSuccess?.(task)
    },
  })
}

export default useUpdateTask
