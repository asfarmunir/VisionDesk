"use client";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi, type ProjectsListResponse } from '../lib/api/projects'
import { PROJECTS_QUERY_KEY } from './useProjects'

interface MutationContext {
  previousData: Array<[readonly unknown[], ProjectsListResponse | undefined]>
}

export const useDeleteProject = (id: string, options?: { onSuccess?: () => void; onError?: (e: Error) => void }) => {
  const qc = useQueryClient()
  return useMutation<null, Error, void, MutationContext>({
    mutationFn: () => projectsApi.remove(id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: [PROJECTS_QUERY_KEY] })
      const previousData = qc.getQueriesData<ProjectsListResponse>({ queryKey: [PROJECTS_QUERY_KEY] }) as MutationContext['previousData']
      previousData.forEach(([key, value]) => {
        if (!value) return
        qc.setQueryData<ProjectsListResponse>(key, {
          ...value,
          projects: value.projects.filter(p => p._id !== id)
        })
      })
      return { previousData }
    },
    onError: (err, _vars, ctx) => {
      ctx?.previousData?.forEach(([key, data]) => qc.setQueryData(key, data))
      options?.onError?.(err)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] })
      options?.onSuccess?.()
    }
  })
}

export default useDeleteProject
