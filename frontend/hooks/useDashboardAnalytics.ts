"use client";
import { useQuery } from '@tanstack/react-query'
import analyticsApi, { DashboardAnalytics } from '@/lib/api/analytics'

export function useDashboardAnalytics(timeFrame?: string) {
  return useQuery<DashboardAnalytics, Error>({
    queryKey: ['analytics','dashboard', timeFrame || 'default'],
    queryFn: () => analyticsApi.getDashboard(timeFrame),
    staleTime: 60_000,
    refetchInterval: 120_000
  })
}

export default useDashboardAnalytics
