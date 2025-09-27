"use client";
import { useQuery } from '@tanstack/react-query'
import analyticsApi, { TeamPerformanceEntry } from '@/lib/api/analytics'

interface Params { projectId?: string; timeFrame?: string }

export function useTeamPerformance(params: Params = {}) {
  return useQuery<TeamPerformanceEntry[], Error>({
    queryKey: ['analytics','team-performance', params],
    queryFn: () => analyticsApi.getTeamPerformance(params),
    staleTime: 60_000
  })
}

export default useTeamPerformance
