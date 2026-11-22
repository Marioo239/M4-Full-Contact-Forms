# Misión Cañada-1 · Full Contact Forms

> **«Valida o muere.»** Registro de tripulación para una misión espacial ficticia: un formulario serio con **React Hook Form + Zod** y datos remotos con **TanStack Query v5**.

## Qué hace

- **Registro** de tripulantes con validación en cliente (nombre, email, edad, rol, código de misión, contraseña con confirmación y aceptación de protocolo).
- **Listado** con filtro por rol, baja de tripulantes e invalidación automática tras cada cambio.
- **Estados de interfaz** claros: cargando, error, éxito, vacío y "actualizando".
- **Bonus:** la respuesta de la API también se valida con Zod (`safeParse`) y los datos corruptos se apartan sin romper la pantalla.

## Stack

React 18 · TypeScript · Vite · React Hook Form · Zod · `@hookform/resolvers` · TanStack Query v5 · Vitest · API mock en Node (sin dependencias).

## Cómo ejecutarlo

```bash
npm install
npm run dev      # arranca API (http://localhost:3001) y web (http://localhost:5173)
npm test         # tests de los esquemas y del bonus
npm run build    # typecheck + build de producción
```

Requiere Node 18+.

## Estructura

```
server/server.js          API mock (GET/POST/DELETE /api/crew), persiste en server/db.json
src/schemas/crew.ts       Esquemas Zod: formulario + respuesta de la API + tipos inferidos
src/api/crew.ts           fetch tipado, ApiError y validación de respuestas con safeParse
src/hooks/useCrew.ts      query keys, useQuery y useMutation con invalidación
src/components/Field.tsx  Etiqueta + control + hint + error con ARIA cableado
src/components/CrewForm.tsx   Formulario (RHF + zodResolver)
src/components/CrewList.tsx   Listado con todos sus estados
src/schemas/crew.test.ts  Tests
```

## Decisiones de diseño

### React Hook Form
- Formulario **no controlado**: `register` + `handleSubmit`; solo hay estado de React para el "mostrar contraseñas".
- `mode: "onTouched"`: valida al salir del campo y, desde entonces, en cada pulsación. Sin ruido mientras se escribe por primera vez.
- Accesibilidad: `noValidate`, `aria-invalid`, `aria-describedby` hacia hint/error, `role="alert"` en errores, foco automático al primer campo con error y `autoComplete` adecuado por campo.
- Los errores del servidor ligados a un campo (email duplicado → `409`) se pintan en ese campo con `setError`.

### Zod como única fuente de verdad
- `crewFormSchema` define todas las reglas; los tipos salen de `z.input<>` y `z.infer<>`, no se duplican a mano.
- Mensajes propios en español, `regex` Unicode para nombres, `refine`/`superRefine` entre campos (contraseñas iguales; la contraseña no puede contener el nombre de pila).
- `valueAsNumber` + `invalid_type_error` para que un campo numérico vacío dé un mensaje humano, no "Expected number, received nan".

### TanStack Query
Claves jerárquicas:

```ts
["crew"]                         // todo lo relacionado con tripulación
["crew", "list"]                 // todas las listas
["crew", "list", { role, chaos }] // una lista concreta (los filtros forman parte de la clave)
```

- Tras `POST` y `DELETE` se hace `invalidateQueries({ queryKey: ["crew"] })`, que refresca cualquier lista con independencia del filtro activo. La promesa se devuelve para que `isPending` dure hasta que la lista está al día.
- `placeholderData: keepPreviousData` evita parpadeos al cambiar de filtro; `signal` cancela peticiones obsoletas.

### Feedback al usuario

| Situación | Qué ve el usuario |
|---|---|
| Carga inicial | Esqueletos de tarjeta |
| Refresco / cambio de filtro | "Actualizando…" y lista atenuada, sin perder contenido |
| Enviando formulario | Botón deshabilitado con spinner y "Registrando…" |
| Éxito | Banner verde (`role="status"`) y formulario reseteado |
| Error de red / servidor | Banner rojo con el motivo y botón "Reintentar" (en la lista) |
| Error de campo del servidor | Mensaje bajo el campo y foco en él |
| Lista vacía | Mensaje que invita a la acción |

## Cómo probar los casos límite

- **Email duplicado:** registra `valentina@canada.space` → error `409` en el campo email.
- **Error 500:** usa un email que contenga `error500` (p. ej. `error500@correo.es`) → banner de error del servidor.
- **API caída:** para el servidor y recarga → error de conexión con "Reintentar".
- **Refinamientos:** contraseñas distintas, o una que contenga tu nombre.

## ★ Bonus: respuesta de la API validada con Zod

`fetchCrew` pasa cada registro por `crewMemberSchema.safeParse`. Los inválidos no entran a la UI: se guardan en `rejected` con el motivo de cada fallo.

**Demostración en la app:** marca **«Simular datos corruptos de la API»** sobre el listado. La API añade dos registros rotos (UUID inválido, email inválido, edad como texto, rol inexistente, campos que faltan) y aparece el aviso amarillo con el detalle de lo que Zod ha atrapado, mientras los registros válidos se siguen mostrando.

**Demostración automática:** `npm test` incluye un test que simula una respuesta con un registro válido y otro corrupto y comprueba que se separan.

## Declaración de uso de IA

> ⚠️ Completa y ajusta esta sección con lo que realmente hayas hecho tú.

Este proyecto se ha desarrollado con asistencia de **Claude (Anthropic)**, que generó el esqueleto inicial (esquemas, componentes, hooks, API mock, estilos y tests) a partir del enunciado del módulo.

Lo que he hecho yo: revisar y entender cada fichero, ejecutar el proyecto y los tests, probar los casos límite descritos arriba y *(añade aquí tus cambios, decisiones y modificaciones)*.

Soy capaz de explicar el funcionamiento de cualquier parte del código.

## Autor

*Tu nombre* · *Tu curso / módulo*
