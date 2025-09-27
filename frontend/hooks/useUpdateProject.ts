"use client";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi, type UpdateProjectPayload, type Project, type ProjectsListResponse } from '../lib/api/projects'
import { PROJECTS_QUERY_KEY } from './useProjects'
import { projectKeys } from './useProject'

interface MutationContext {
  listSnapshots: Array<[readonly unknown[], ProjectsListResponse | undefined]>
  detailSnapshot?: Project
}

export const useUpdateProject = (id: string, options?: { onSuccess?: (p: Project) => void; onError?: (e: Error) => void }) => {
  const qc = useQueryClient()
  return useMutation<Project, Error, UpdateProjectPayload, MutationContext>({
    mutationFn: (payload) => projectsApi.update(id, payload),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: [PROJECTS_QUERY_KEY] })

      const listSnapshots = qc.getQueriesData<ProjectsListResponse>({ queryKey: [PROJECTS_QUERY_KEY] })
      listSnapshots.forEach(([key, snapshot]) => {
        if (!snapshot || !Array.isArray(snapshot.projects)) return
        qc.setQueryData<ProjectsListResponse>(key, {
          ...snapshot,
          projects: snapshot.projects.map(p => p._id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)
        })
      })

      const detailKey = projectKeys.detail(id)
      const detailSnapshot = qc.getQueryData<Project>(detailKey)
      if (detailSnapshot) {
        qc.setQueryData<Project>(detailKey, {
          ...detailSnapshot,
          ...patch,
          updatedAt: new Date().toISOString()
        })
      }

      return { listSnapshots, detailSnapshot }
    },
    onError: (err, _vars, ctx) => {
      ctx?.listSnapshots?.forEach(([key, snap]) => qc.setQueryData(key, snap))
      if (ctx?.detailSnapshot) qc.setQueryData(projectKeys.detail(id), ctx.detailSnapshot)
      options?.onError?.(err)
    },
    onSuccess: (serverProject) => {
      const detailKey = projectKeys.detail(id)
      const existing = qc.getQueryData<Project>(detailKey)
      const merged = existing ? { ...existing, ...serverProject } : serverProject
      qc.setQueryData(detailKey, merged)
      qc.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] })
      options?.onSuccess?.(merged)
    }
  })
}

export default useUpdateProject
