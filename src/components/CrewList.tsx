import { ROLES, ROLE_LABELS, type Role } from "../schemas/crew";
import { useCrewList, useDeleteCrewMember } from "../hooks/useCrew";
import type { CrewFilters } from "../api/crew";

interface Props {
  filters: CrewFilters;
  onChange: (filters: CrewFilters) => void;
}

const dateFmt = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });

export function CrewList({ filters, onChange }: Props) {
  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useCrewList(filters);
  const remove = useDeleteCrewMember();

  return (
    <section className="crew" aria-labelledby="crew-title" aria-busy={isFetching}>
      <header className="crew__head">
        <h2 id="crew-title">
          Tripulación {data && <span className="count">{data.members.length}</span>}
        </h2>
        {isFetching && !isPending && (
          <span className="sync" role="status">
            <span className="spinner spinner--dark" aria-hidden="true" /> Actualizando…
          </span>
        )}
      </header>

      <div className="toolbar">
        <label>
          Filtrar por rol
          <select
            value={filters.role}
            onChange={(e) => onChange({ ...filters, role: e.target.value as Role | "all" })}
          >
            <option value="all">Todos</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={filters.chaos}
            onChange={(e) => onChange({ ...filters, chaos: e.target.checked })}
          />
          Simular datos corruptos de la API
        </label>
      </div>

      {isPending && (
        <ul className="members" aria-label="Cargando tripulación">
          {[0, 1, 2].map((i) => (
            <li key={i} className="member member--skeleton" aria-hidden="true" />
          ))}
        </ul>
      )}

      {isError && (
        <div className="banner banner--error" role="alert">
          <strong>No se pudo cargar la tripulación.</strong> {error.message}
          <button type="button" className="btn btn--small" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {data && data.rejected.length > 0 && (
        <div className="banner banner--warn" role="status">
          <strong>
            {data.rejected.length} registro{data.rejected.length > 1 ? "s" : ""} descartado
            {data.rejected.length > 1 ? "s" : ""} por no cumplir el contrato de la API.
          </strong>{" "}
          Zod los ha atrapado antes de llegar a pantalla.
          <details>
            <summary>Ver detalle</summary>
            {data.rejected.map((r) => (
              <div key={r.index} className="rejected">
                <code>{JSON.stringify(r.raw)}</code>
                <ul>
                  {r.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            ))}
          </details>
        </div>
      )}

      {data && data.members.length === 0 && !isError && (
        <p className="empty">
          {filters.role === "all"
            ? "Aún no hay tripulantes. Rellena el manifiesto para registrar el primero."
            : "Nadie con ese rol todavía. Prueba con otro filtro o registra a alguien."}
        </p>
      )}

      {data && data.members.length > 0 && (
        <ul className="members" style={{ opacity: isPlaceholderData ? 0.55 : 1 }}>
          {data.members.map((m) => {
            const deleting = remove.isPending && remove.variables === m.id;
            return (
              <li key={m.id} className="member">
                <div className="member__main">
                  <strong>{m.fullName}</strong>
                  <span>{m.email}</span>
                  <small>Registrado el {dateFmt.format(new Date(m.createdAt))}</small>
                </div>
                <div className="member__meta">
                  <span className="tag">{ROLE_LABELS[m.role]}</span>
                  <span className="code">{m.missionCode}</span>
                  <span className="age">{m.age} años</span>
                </div>
                <button
                  type="button"
                  className="btn btn--small btn--ghost"
                  onClick={() => remove.mutate(m.id)}
                  disabled={deleting}
                  aria-label={`Dar de baja a ${m.fullName}`}
                >
                  {deleting ? "Dando de baja…" : "Dar de baja"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {remove.isError && (
        <div className="banner banner--error" role="alert">
          <strong>No se pudo dar de baja.</strong> {remove.error.message}
        </div>
      )}
    </section>
  );
}
