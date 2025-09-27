"use client";
import { useQuery } from '@tanstack/react-query'
import analyticsApi, { CompletionTrendPoint } from '@/lib/api/analytics'

export function useProjectCompletionTrend(days?: number) {
  return useQuery<CompletionTrendPoint[], Error>({
    queryKey: ['analytics','project-completion', days || 30],
    queryFn: () => analyticsApi.getProjectCompletionTrend(days),
    staleTime: 60_000
  })
}

export default useProjectCompletionTrend
