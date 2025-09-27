"use client";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import tasksApi, { type CreateTaskPayload, type Task } from '@/lib/api/tasks'
import { projectKeys } from './useProject'
import { PROJECTS_QUERY_KEY } from './useProjects'
import { type Project } from '@/lib/api/projects'

interface Ctx { previousProject?: Project }

export function useCreateTask(projectId: string, options?: { onSuccess?: (t: Task) => void; onError?: (e: Error) => void }) {
  const qc = useQueryClient()
  return useMutation<Task, Error, CreateTaskPayload, Ctx>({
    mutationFn: (payload) => tasksApi.create(payload),
    onMutate: async (vars) => {
      const key = projectKeys.detail(projectId)
      await qc.cancelQueries({ queryKey: key })
      const previousProject = qc.getQueryData<Project>(key)
      if (previousProject) {
        const optimistic: Task = {
          _id: `temp-${Date.now()}`,
          title: vars.title,
          description: vars.description,
            projectId: projectId,
          assignedTo: vars.assignedTo,
          status: 'open',
          priority: vars.priority || 'medium',
          category: vars.category || 'feature',
          dueDate: vars.dueDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        qc.setQueryData<Project>(key, {
          ...previousProject,
          tasks: [...(previousProject.tasks || []), optimistic],
          taskCount: (previousProject.taskCount || 0) + 1
        })
      }
      return { previousProject }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousProject) {
        qc.setQueryData(projectKeys.detail(projectId), ctx.previousProject)
      }
      options?.onError?.(err)
    },
    onSuccess: (created, vars) => {
      const key = projectKeys.detail(projectId)
      const existing = qc.getQueryData<Project>(key)
      if (existing) {
        qc.setQueryData<Project>(key, {
          ...existing,
          tasks: (existing.tasks || []).map(t => t._id.startsWith('temp-') && t.title === vars.title ? created : t),
        })
      }
      // Invalidate projects list to refresh task/complete counts
      qc.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] })
      options?.onSuccess?.(created)
    }
  })
}

export default useCreateTask
