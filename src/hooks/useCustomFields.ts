import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/services/api";

export type CustomFieldVisibility = {
  card: boolean;
  page: boolean;
};

export type CustomField = {
  id: string;
  type: "text" | "textarea" | "number" | "date" | "select" | "boolean";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  visibility: CustomFieldVisibility;
  icon?: string;
};

const CUSTOM_FIELDS_KEY = ["custom_fields"];

export function useCustomFields() {
  return useQuery({
    queryKey: CUSTOM_FIELDS_KEY,
    queryFn: async () => {
      const res = await apiGet<CustomField[]>("/api/admin/fields");
      return res.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveCustomFields() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CustomField[]) => {
      const res = await apiPut<CustomField[]>("/api/admin/fields", payload);
      return res.data ?? [];
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CUSTOM_FIELDS_KEY, data);
    },
  });
}
