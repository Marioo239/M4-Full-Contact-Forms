# Misión 4 · Full Contact Forms

**«Valida o muere.»** Registro de tripulación para una misión espacial ficticia: un formulario serio con **React Hook Form + Zod** y datos remotos con **TanStack Query v5**.

## Qué hace

- **Registro** de tripulantes con validación en cliente (nombre, email, edad, rol, código de misión, contraseña con confirmación y aceptación de protocolo).
- **Listado** con filtro por rol, baja de tripulantes e invalidación automática tras cada cambio.
- **Estados de interfaz** claros: cargando, error, éxito, vacío y "actualizando".
- **Bonus:** la respuesta de la API también se valida con Zod (`safeParse`) y los datos corruptos se apartan sin romper la pantalla.

## Cómo ejecutarlo

Requiere Node 18+ y ejecutar con npm el host.

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
### Modo de validación `onTouched`
- **Elegido:** validar al salir del campo y, desde entonces, en cada cambio.
- **Alternativas:** `onSubmit` (solo al enviar) y `onChange` (en cada pulsación desde el primer carácter).
- **Por qué:** `onChange` muestra errores mientras el usuario aún está escribiendo ("email inválido" tras teclear una `a`), lo cual resulta agresivo. `onSubmit` retrasa demasiado el feedback y el usuario se entera de todo al final. `onTouched` equilibra ambos: no molesta antes de tiempo, pero corrige rápido cuando ya has pasado por el campo.

### `valueAsNumber` en lugar de `z.coerce.number()`
- **Elegido:** `register("age", { valueAsNumber: true })` y `z.number()` con mensajes propios.
- **Alternativa:** dejar el input como texto y convertir con `z.coerce.number()`.
- **Por qué:** `coerce` convierte cadenas vacías en `0`, lo que dejaría pasar un campo en blanco como edad "0" y el error sería confuso. Con `valueAsNumber` el campo vacío da `NaN`, y `invalid_type_error` lo traduce a "Indica tu edad con un número".

### `keepPreviousData` al cambiar de filtro
- **Elegido:** mantener la lista anterior atenuada mientras llega la nueva.
- **Alternativa:** volver a mostrar los esqueletos.
- **Por qué:** los esqueletos hacen "saltar" la pantalla cada vez que se toca el filtro. Mantener lo anterior da sensación de fluidez y el texto "Actualizando…" indica que hay una petición en curso.

### TanStack Query
Claves jerárquicas:

```ts
["crew"]                         // todo lo relacionado con tripulación
["crew", "list"]                 // todas las listas
["crew", "list", { role, chaos }] // una lista concreta (los filtros forman parte de la clave)
```

- Tras `POST` y `DELETE` se hace `invalidateQueries({ queryKey: ["crew"] })`, que refresca cualquier lista con independencia del filtro activo. La promesa se devuelve para que `isPending` dure hasta que la lista está al día.
- `placeholderData: keepPreviousData` evita parpadeos al cambiar de filtro; `signal` cancela peticiones obsoletas.

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

Este proyecto se ha desarrollado con asistencia de **Claude**, que generó el esqueleto inicial (esquemas, componentes, hooks, API mock, estilos y tests) a partir del enunciado del módulo.

Lo que he hecho yo: revisar cada fichero, ejecutar el proyecto y los tests, probar los casos límite descritos arriba y completar la estructura general del proyecto.

