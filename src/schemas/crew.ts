import { z } from "zod";

/**
 * ÚNICA FUENTE DE VERDAD de la validación.
 * De aquí salen: las reglas del formulario, los tipos TypeScript y la
 * validación de lo que devuelve la API (bonus).
 */

export const ROLES = ["comandante", "piloto", "ingeniero", "cientifico", "medico"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  comandante: "Comandante",
  piloto: "Piloto",
  ingeniero: "Ingeniero de vuelo",
  cientifico: "Científico",
  medico: "Médico de a bordo",
};

const MISSION_CODE = /^MC-\d{4}$/i;

// ---------- Formulario de registro ----------
export const crewFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Escribe tu nombre completo (mínimo 3 caracteres)")
      .max(60, "Máximo 60 caracteres")
      .regex(/^[\p{L}][\p{L}\s'.-]*$/u, "Solo letras, espacios, apóstrofos y guiones"),
    email: z
      .string()
      .trim()
      .min(1, "El email es obligatorio")
      .email("Introduce un email válido, p. ej. ana@correo.es"),
    age: z
      .number({
        required_error: "Indica tu edad",
        invalid_type_error: "Indica tu edad con un número",
      })
      .int("La edad debe ser un número entero")
      .min(21, "Se requieren 21 años o más para la misión")
      .max(65, "El límite de edad para la misión es 65"),
    role: z.enum(ROLES, { errorMap: () => ({ message: "Elige un rol para la misión" }) }),
    missionCode: z
      .string()
      .trim()
      .regex(MISSION_CODE, "Formato MC-0000 (cuatro dígitos), p. ej. MC-2031"),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Incluye al menos una mayúscula")
      .regex(/\d/, "Incluye al menos un número"),
    confirmPassword: z.string().min(1, "Repite la contraseña"),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: "Debes aceptar el protocolo de seguridad para volar",
    }),
  })
  // Refinamientos entre campos
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden",
      });
    }
    // La contraseña no puede contener el nombre de pila
    const firstName = data.fullName.trim().split(/\s+/)[0]?.toLowerCase();
    if (firstName && firstName.length >= 3 && data.password.toLowerCase().includes(firstName)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "La contraseña no puede contener tu nombre",
      });
    }
  });

export type CrewFormValues = z.input<typeof crewFormSchema>;

/** Lo que se envía a la API: sin confirmación ni aceptación de términos */
export type CrewPayload = Omit<CrewFormValues, "confirmPassword" | "acceptTerms">;

// ---------- Respuesta de la API (BONUS) ----------
export const crewMemberSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(18).max(99),
  role: z.enum(ROLES),
  missionCode: z.string().regex(MISSION_CODE),
  createdAt: z.string().datetime(),
});
export type CrewMember = z.infer<typeof crewMemberSchema>;
