"use client";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi, type ProjectsListResponse, type Project } from '../lib/api/projects'
import { PROJECTS_QUERY_KEY } from './useProjects'
import { projectKeys } from './useProject'

interface MutationContext {
  listSnapshots: Array<[readonly unknown[], ProjectsListResponse | undefined]>
  detailSnapshot?: Project
}

export const useDeleteProject = (id: string, options?: { onSuccess?: () => void; onError?: (e: Error) => void }) => {
  const qc = useQueryClient()
  return useMutation<null, Error, void, MutationContext>({
    mutationFn: () => projectsApi.remove(id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: [PROJECTS_QUERY_KEY] })
      const listSnapshots = qc.getQueriesData<ProjectsListResponse>({ queryKey: [PROJECTS_QUERY_KEY] })
      listSnapshots.forEach(([key, snapshot]) => {
        if (!snapshot || !Array.isArray(snapshot.projects)) return
        qc.setQueryData<ProjectsListResponse>(key, {
          ...snapshot,
          projects: snapshot.projects.filter(p => p._id !== id)
        })
      })
      const detailKey = projectKeys.detail(id)
      const detailSnapshot = qc.getQueryData<Project>(detailKey)
      if (detailSnapshot) {
        // remove detail cache so navigation back or effects refetch
        qc.removeQueries({ queryKey: detailKey })
      }
      return { listSnapshots, detailSnapshot }
    },
    onError: (err, _vars, ctx) => {
      ctx?.listSnapshots?.forEach(([key, data]) => qc.setQueryData(key, data))
      if (ctx?.detailSnapshot) {
        qc.setQueryData(projectKeys.detail(id), ctx.detailSnapshot)
      }
      options?.onError?.(err)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] })
      options?.onSuccess?.()
    }
  })
}

export default useDeleteProject
