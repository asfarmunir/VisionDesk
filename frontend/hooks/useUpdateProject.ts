"use client";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi, type UpdateProjectPayload, type Project, type ProjectsListResponse } from '../lib/api/projects'
import { PROJECTS_QUERY_KEY } from './useProjects'

interface MutationContext {
  previousData: Array<[readonly unknown[], ProjectsListResponse | undefined]>
}

export const useUpdateProject = (id: string, options?: { onSuccess?: (p: Project) => void; onError?: (e: Error) => void }) => {
  const qc = useQueryClient()
  return useMutation<Project, Error, UpdateProjectPayload, MutationContext>({
    mutationFn: (payload) => projectsApi.update(id, payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: [PROJECTS_QUERY_KEY] })
      const previousData = qc.getQueriesData<ProjectsListResponse>({ queryKey: [PROJECTS_QUERY_KEY] }) as MutationContext['previousData']
      previousData.forEach(([key, value]) => {
        if (!value) return
        qc.setQueryData<ProjectsListResponse>(key, {
          ...value,
          projects: value.projects.map(p => p._id === id ? { ...p, ...payload, updatedAt: new Date().toISOString() } : p)
        })
      })
      return { previousData }
    },
    onError: (err, _vars, ctx) => {
      ctx?.previousData?.forEach(([key, data]) => qc.setQueryData(key, data))
      options?.onError?.(err)
    },
    onSuccess: (proj) => {
      qc.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] })
      options?.onSuccess?.(proj)
    }
  })
}

export default useUpdateProject
