"use client";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import tasksApi, { type CreateTaskPayload, type Task } from '@/lib/api/tasks'
import { type ProjectTask } from '@/lib/api/projects'
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
        const optimistic: ProjectTask = {
          _id: `temp-${Date.now()}`,
          title: vars.title,
          description: vars.description,
          projectId: projectId,
          assignedTo: { _id: vars.assignedTo, name: 'Assigning…', email: '' },
          status: 'open',
          priority: (vars.priority || 'medium') as ProjectTask['priority'],
          category: vars.category,
          dueDate: vars.dueDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        qc.setQueryData<Project>(key, {
          ...previousProject,
          tasks: ([...(previousProject.tasks || []), optimistic]) as ProjectTask[],
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
          tasks: (existing.tasks || []).map(t => {
            if (t._id.startsWith('temp-') && t.title === vars.title) {
              const at = created.assignedTo
              const rawCreatedBy = created.createdBy
              type UserLike = { _id: string; name: string; email: string; role?: string }
              const isUserLike = (u: unknown): u is UserLike => {
                if (!u || typeof u !== 'object') return false
                return '_id' in (u as Record<string, unknown>)
              }
              const assigned = typeof at === 'string' ? { _id: at, name: '', email: '' } : { _id: at._id, name: at.name, email: at.email }
              const createdBy = isUserLike(rawCreatedBy) ? { _id: rawCreatedBy._id, name: rawCreatedBy.name, email: rawCreatedBy.email } : undefined
              const mapped: ProjectTask = {
                _id: created._id,
                id: created._id,
                title: created.title,
                description: created.description,
                status: created.status,
                priority: created.priority as ProjectTask['priority'],
                category: created.category as ProjectTask['category'],
                projectId: created.projectId,
                assignedTo: assigned,
                createdBy,
                dueDate: created.dueDate,
                startDate: created.startDate,
                completedDate: created.completedDate,
                createdAt: created.createdAt,
                updatedAt: created.updatedAt,
              }
              return mapped
            }
            return t
          }) as ProjectTask[],
        })
      }
      // Invalidate projects list to refresh task/complete counts
      qc.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] })
      options?.onSuccess?.(created)
    }
  })
}

export default useCreateTask
