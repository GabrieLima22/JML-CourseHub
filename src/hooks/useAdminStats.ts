import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '../services/api';

export interface DashboardStats {
  overview: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    coursesWithAI: number;
    totalViews: number;
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
  };
  system: {
    totalAnalytics: number;
    totalUploads: number;
    recentUploads: number;
    aiProcessing: number;
    uptime: number;
    memoryUsage: number;
  };
}

export interface RecentActivity {
  type: string;
  action: string;
  title: string;
  timestamp: string;
  status: string;
  metadata: Record<string, any>;
}

export type RecentActivitiesResponse = { activities: RecentActivity[] };

export interface DetailedAnalytics {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  eventsByType: Array<{
    type: string;
    count: number;
  }>;
  topCourses: Array<{
    id: string;
    titulo: string;
    slug: string;
    views_count: number;
    clicks_count: number;
    conversions_count: number;
    empresa: string;
    tipo: string;
    categoria: string;
  }>;
  dailyStats: Array<{
    date: string;
    total: number;
    views: number;
    clicks: number;
    searches: number;
  }>;
  bySegment: Array<{
    segmento: string;
    courses: number;
    views: number;
    clicks: number;
  }>;
  byCompany: Array<{
    empresa: string;
    courses: number;
    views: number;
    clicks: number;
  }>;
}

export interface AIMetrics {
  overview: {
    coursesCreatedByAI: number;
    totalCourses: number;
    percentage: string;
    totalUploads: number;
    completedUploads: number;
    pendingUploads: number;
    processingUploads: number;
  };
  performance: {
    avgProcessingTime: string;
    avgConfidence: number;
    accuracyRate: number;
    errorReduction: number;
    manualReviewRate: string;
  };
  impact: {
    timeSaved: number;
    timeWithoutAI: number;
    timeWithAI: number;
    productivityGain: number;
    costSavings: number;
  };
  trends: Array<{
    month: string;
    uploads: number;
    avgTime: number;
    avgConfidence: number;
  }>;
}

/**
 * Hook para buscar estatísticas do dashboard admin
 */
export function useDashboardStats(): UseQueryResult<DashboardStats> {
  return useQuery<DashboardStats>({
    queryKey: ['admin', 'stats', 'dashboard'],
    queryFn: async () => {
      const response = await api.get('/api/admin/stats/dashboard');
      return response.data;
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    staleTime: 20000
  });
}

/**
 * Hook para buscar atividades recentes
 */
export function useRecentActivities(limit: number = 10): UseQueryResult<RecentActivitiesResponse> {
  return useQuery<RecentActivitiesResponse>({
    queryKey: ['admin', 'activities', limit],
    queryFn: async () => {
      const response = await api.get(`/api/admin/stats/activities?limit=${limit}`);
      return response.data;
    },
    refetchInterval: 15000, // Atualiza a cada 15 segundos
    staleTime: 10000
  });
}

/**
 * Hook para buscar analytics detalhados
 */
export function useDetailedAnalytics(days: number = 30): UseQueryResult<DetailedAnalytics> {
  return useQuery<DetailedAnalytics>({
    queryKey: ['admin', 'analytics', days],
    queryFn: async () => {
      const response = await api.get(`/api/admin/stats/analytics?days=${days}`);
      return response.data;
    },
    refetchInterval: 60000, // Atualiza a cada 1 minuto
    staleTime: 45000
  });
}

/**
 * Hook para buscar métricas de IA
 */
export function useAIMetrics(): UseQueryResult<AIMetrics> {
  return useQuery<AIMetrics>({
    queryKey: ['admin', 'ai-metrics'],
    queryFn: async () => {
      const response = await api.get('/api/admin/stats/ai-metrics');
      return response.data;
    },
    refetchInterval: 30000,
    staleTime: 20000
  });
}
