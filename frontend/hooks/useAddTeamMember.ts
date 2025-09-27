"use client";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import projectsApi, { type Project } from '@/lib/api/projects'
import { projectKeys } from './useProject'
import { PROJECTS_QUERY_KEY } from './useProjects'

interface Vars {
  projectId: string
  userId: string
  role: 'lead' | 'developer' | 'tester' | 'designer'
}

export default function useAddTeamMember(projectId: string, options?: { onSuccess?: (p: Project) => void; onError?: (e: Error) => void }) {
  const qc = useQueryClient()
  return useMutation<Project, Error, Omit<Vars, 'projectId'>, { previous?: Project }>({
    mutationFn: ({ userId, role }) => projectsApi.addTeamMember(projectId, userId, role),
    onMutate: async (vars) => {
      const key = projectKeys.detail(projectId)
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<Project>(key)
      if (previous && previous.teamMembers) {
        qc.setQueryData<Project>(key, {
          ...previous,
          teamMembers: [
            ...previous.teamMembers,
            {
              user: {
                _id: vars.userId,
                name: 'Adding…',
                email: '',
                role: '',
              },
              role: vars.role,
              joinedAt: new Date().toISOString()
            }
          ]
        })
      }
      return { previous }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(projectKeys.detail(projectId), ctx.previous)
      }
      options?.onError?.(err)
    },
    onSuccess: (proj) => {
      qc.setQueryData(projectKeys.detail(projectId), proj)
      qc.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] })
      options?.onSuccess?.(proj)
    }
  })
}
