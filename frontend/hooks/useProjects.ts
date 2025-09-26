"use client";
import { useQuery } from '@tanstack/react-query'
import { projectsApi, type FetchProjectsParams, type ProjectsListResponse } from '../lib/api/projects'

export const PROJECTS_QUERY_KEY = 'projects'

export const useProjects = (params: FetchProjectsParams = {}) => {
  const query = useQuery<ProjectsListResponse, Error>({
    queryKey: [PROJECTS_QUERY_KEY, params],
    queryFn: () => projectsApi.list(params),
    placeholderData: (previousData) => previousData,
  })
  return query
}

export default useProjects
