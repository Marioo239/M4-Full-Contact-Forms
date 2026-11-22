import { useState } from "react";
import { CrewForm } from "./components/CrewForm";
import { CrewList } from "./components/CrewList";
import type { CrewFilters } from "./api/crew";

export default function App() {
  const [filters, setFilters] = useState<CrewFilters>({ role: "all", chaos: false });

  return (
    <div className="shell">
      <header className="masthead">
        <p className="masthead__mission">Misión Cañada-1</p>
        <h1>Valida o muere.</h1>
        <p className="masthead__lead">
          Un formulario sin margen de error. Si el manifiesto no valida, no se despega.
        </p>
      </header>

      <main className="layout">
        <CrewForm />
        <CrewList filters={filters} onChange={setFilters} />
      </main>
    </div>
  );
}
