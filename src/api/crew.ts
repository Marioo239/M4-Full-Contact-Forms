import { crewMemberSchema, type CrewMember, type CrewPayload, type Role } from "../schemas/crew";

export class ApiError extends Error {
  status: number;
  field?: string;
  constructor(message: string, status: number, field?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.field = field;
  }
}

export interface CrewFilters {
  role: Role | "all";
  chaos: boolean; // pide a la API registros corruptos (demo del bonus)
}

export interface RejectedRecord {
  index: number;
  raw: unknown;
  issues: string[];
}

export interface CrewListResult {
  members: CrewMember[];
  rejected: RejectedRecord[];
}

async function request(url: string, init?: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError("No hay conexión con el servidor. ¿Está arrancada la API (npm run dev)?", 0);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string; field?: string } | null;
    throw new ApiError(body?.message ?? `Error ${res.status}`, res.status, body?.field);
  }
  return res.status === 204 ? undefined : res.json();
}

/**
 * BONUS: cada registro se valida con safeParse.
 * Los datos corruptos no rompen la pantalla: se apartan en `rejected`
 * (con el motivo) y los válidos se muestran con normalidad.
 */
export async function fetchCrew(filters: CrewFilters, signal?: AbortSignal): Promise<CrewListResult> {
  const params = new URLSearchParams();
  if (filters.role !== "all") params.set("role", filters.role);
  if (filters.chaos) params.set("chaos", "1");

  const raw = await request(`/api/crew?${params}`, { signal });
  if (!Array.isArray(raw)) {
    throw new ApiError("La API devolvió un formato inesperado (se esperaba una lista)", 200);
  }

  const members: CrewMember[] = [];
  const rejected: RejectedRecord[] = [];
  raw.forEach((item, index) => {
    const parsed = crewMemberSchema.safeParse(item);
    if (parsed.success) members.push(parsed.data);
    else {
      rejected.push({
        index,
        raw: item,
        issues: parsed.error.issues.map((i) => `${i.path.join(".") || "(registro)"}: ${i.message}`),
      });
    }
  });
  return { members, rejected };
}

export async function createCrewMember(payload: CrewPayload): Promise<CrewMember> {
  const raw = await request("/api/crew", { method: "POST", body: JSON.stringify(payload) });
  const parsed = crewMemberSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError("La API respondió con un registro que no cumple el contrato", 200);
  }
  return parsed.data;
}

export async function deleteCrewMember(id: string): Promise<void> {
  await request(`/api/crew/${id}`, { method: "DELETE" });
}
