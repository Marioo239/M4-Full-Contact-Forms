import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCrewMember, deleteCrewMember, fetchCrew, type CrewFilters } from "../api/crew";

/**
 * Jerarquía de claves: ["crew"] > ["crew","list"] > ["crew","list",{filtros}]
 * Invalidar ["crew"] refresca cualquier lista, sea cual sea el filtro activo.
 */
export const crewKeys = {
  all: ["crew"] as const,
  lists: () => [...crewKeys.all, "list"] as const,
  list: (filters: CrewFilters) => [...crewKeys.lists(), filters] as const,
};

export function useCrewList(filters: CrewFilters) {
  return useQuery({
    queryKey: crewKeys.list(filters),
    queryFn: ({ signal }) => fetchCrew(filters, signal),
    placeholderData: keepPreviousData, // al cambiar de filtro no parpadea la lista
  });
}

export function useCreateCrewMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCrewMember,
    // Devolver la promesa mantiene isPending hasta que la lista se ha refrescado
    onSuccess: () => queryClient.invalidateQueries({ queryKey: crewKeys.all }),
  });
}

export function useDeleteCrewMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCrewMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: crewKeys.all }),
  });
}
