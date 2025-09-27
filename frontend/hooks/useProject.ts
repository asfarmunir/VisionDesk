import { useQuery } from '@tanstack/react-query'
import projectsApi, { Project } from '@/lib/api/projects'

export const projectKeys = {
  root: ['projects'] as const,
  detail: (id: string) => [...projectKeys.root, 'detail', id] as const,
}

export default function useProject(id: string | undefined) {
  return useQuery<Project, Error>({
    queryKey: id ? projectKeys.detail(id) : ['projects', 'detail', 'undefined'],
    queryFn: () => {
      if (!id) throw new Error('Project id is required')
      return projectsApi.get(id)
    },
    enabled: !!id,
    staleTime: 30_000,
  })
}
