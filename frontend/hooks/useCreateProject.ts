"use client";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi, type CreateProjectPayload, type Project, type ProjectsListResponse } from '../lib/api/projects'
import { PROJECTS_QUERY_KEY } from './useProjects'

interface UseCreateProjectOptions {
  onSuccess?: (project: Project) => void
  onError?: (error: Error) => void
}

interface MutationContext {
  previousData: Array<[readonly unknown[], ProjectsListResponse | undefined]>
}

export const useCreateProject = (options: UseCreateProjectOptions = {}) => {
  const queryClient = useQueryClient()

  return useMutation<Project, Error, CreateProjectPayload, MutationContext>({
    mutationFn: (payload) => projectsApi.create(payload),
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: [PROJECTS_QUERY_KEY] })

      const previousData = queryClient.getQueriesData<ProjectsListResponse>({ queryKey: [PROJECTS_QUERY_KEY] }) as MutationContext['previousData']

      // Optimistically add a temp project to each cached variant
      previousData.forEach(([key, value]) => {
        if (!value) return
        const optimistic: Project = {
          _id: `temp-${Date.now()}`,
          title: newProject.title,
          description: newProject.description,
          priority: newProject.priority || 'medium',
          status: 'active',
          createdBy: value.projects[0]?.createdBy || { _id: '', name: 'You', email: '', role: 'moderator' },
          teamMembers: [],
          startDate: new Date().toISOString(),
          completedDate: null,
          taskCount: 0,
          completedTaskCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        queryClient.setQueryData<ProjectsListResponse>(key, {
          ...value,
          projects: [optimistic, ...value.projects]
        })
      })

      return { previousData }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData<ProjectsListResponse | undefined>(key, data)
        })
      }
      options.onError?.(_err)
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] })
      options.onSuccess?.(created)
    }
  })
}

export default useCreateProject
