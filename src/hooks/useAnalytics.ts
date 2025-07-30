// import { useQuery } from '@tanstack/react-query';
import { useJobs } from './useJobs';
import { useMemo } from 'react';

export interface AnalyticsData {
  gpuUsageOverTime: Array<{
    time: string;
    gpuUsed: number;
  }>;
  costBreakdownByRegion: Array<{
    region: string;
    cost: number;
  }>;
  modelUsageFrequency: Array<{
    model: string;
    frequency: number;
  }>;
  totalJobs: number;
  totalCost: number;
  averageRuntime: number;
  topRegions: Array<{
    region: string;
    count: number;
  }>;
}

export function useAnalytics(timeRange: string = '7d') {
  const { data: jobs, isLoading: jobsLoading, error: jobsError } = useJobs();

  const analyticsData = useMemo<AnalyticsData | null>(() => {
    if (!jobs || jobs.length === 0) return null;

    // Filter jobs based on time range
    const now = new Date();
    const filterDate = new Date();

    switch (timeRange) {
      case '7d':
        filterDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        filterDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        filterDate.setDate(now.getDate() - 90);
        break;
      default:
        filterDate.setDate(now.getDate() - 7);
    }

    const filteredJobs = jobs.filter((job) => new Date(job.createdAt) >= filterDate);

    // GPU Usage Over Time - group by day
    const gpuUsageMap = new Map<string, number>();
    filteredJobs.forEach((job) => {
      const date = new Date(job.createdAt).toISOString().split('T')[0];
      gpuUsageMap.set(date, (gpuUsageMap.get(date) || 0) + 1);
    });

    const gpuUsageOverTime = Array.from(gpuUsageMap.entries())
      .map(([date, count]) => ({
        time: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        gpuUsed: count,
      }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .slice(-14); // Show last 14 days max

    // Cost Breakdown by Region
    const regionCostMap = new Map<string, number>();
    filteredJobs.forEach((job) => {
      const cost = job.cost * (job.runtime / 3600); // Convert runtime to hours
      regionCostMap.set(job.region, (regionCostMap.get(job.region) || 0) + cost);
    });

    const costBreakdownByRegion = Array.from(regionCostMap.entries())
      .map(([region, cost]) => ({ region, cost: Math.round(cost * 100) / 100 }))
      .sort((a, b) => b.cost - a.cost);

    // Model Usage Frequency (based on GPU types as proxy for models)
    const modelFrequencyMap = new Map<string, number>();
    filteredJobs.forEach((job) => {
      modelFrequencyMap.set(job.gpu, (modelFrequencyMap.get(job.gpu) || 0) + 1);
    });

    const modelUsageFrequency = Array.from(modelFrequencyMap.entries())
      .map(([model, frequency]) => ({ model, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10); // Top 10 models

    // Summary statistics
    const totalJobs = filteredJobs.length;
    const totalCost = filteredJobs.reduce((sum, job) => sum + job.cost * (job.runtime / 3600), 0);
    const averageRuntime =
      filteredJobs.length > 0
        ? filteredJobs.reduce((sum, job) => sum + job.runtime, 0) / filteredJobs.length
        : 0;

    // Top regions by job count
    const regionCountMap = new Map<string, number>();
    filteredJobs.forEach((job) => {
      regionCountMap.set(job.region, (regionCountMap.get(job.region) || 0) + 1);
    });

    const topRegions = Array.from(regionCountMap.entries())
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      gpuUsageOverTime,
      costBreakdownByRegion,
      modelUsageFrequency,
      totalJobs,
      totalCost: Math.round(totalCost * 100) / 100,
      averageRuntime: Math.round(averageRuntime),
      topRegions,
    };
  }, [jobs, timeRange]);

  return {
    data: analyticsData,
    isLoading: jobsLoading,
    error: jobsError,
  };
}
