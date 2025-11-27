import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/services/api";

export type TaxonomyOption = {
  id: string;
  label: string;
  description?: string;
  color?: string;
  accent?: string;
};

export type TaxonomyData = {
  companies: TaxonomyOption[];
  courseTypes: TaxonomyOption[];
  segments: TaxonomyOption[];
  audiences: TaxonomyOption[];
  levels: TaxonomyOption[];
  tags: string[];
};

const TAXONOMY_QUERY_KEY = ["taxonomies"];

export function useTaxonomies() {
  return useQuery({
    queryKey: TAXONOMY_QUERY_KEY,
    queryFn: async () => {
      const response = await apiGet<TaxonomyData>("/api/admin/taxonomies");
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveTaxonomies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TaxonomyData) => {
      const response = await apiPut<TaxonomyData>("/api/admin/taxonomies", payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(TAXONOMY_QUERY_KEY, data);
    },
  });
}
