import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { crewFormSchema, ROLES, ROLE_LABELS, type CrewFormValues } from "../schemas/crew";
import { useCreateCrewMember } from "../hooks/useCrew";
import { ApiError } from "../api/crew";
import { Field } from "./Field";

const EMPTY: Partial<CrewFormValues> = {
  fullName: "",
  email: "",
  role: undefined,
  missionCode: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

export function CrewForm() {
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useCreateCrewMember();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CrewFormValues>({
    resolver: zodResolver(crewFormSchema),
    defaultValues: EMPTY,
    mode: "onTouched", // valida al salir del campo; después, en cada cambio
  });

  const onSubmit = handleSubmit((values) => {
    const { confirmPassword: _c, acceptTerms: _a, ...payload } = values;
    mutation.mutate(payload, {
      onSuccess: () => reset(EMPTY),
      onError: (error) => {
        // Error de servidor ligado a un campo (p. ej. email duplicado) → se pinta en ese campo
        if (error instanceof ApiError && error.field) {
          setError(error.field as keyof CrewFormValues, { type: "server", message: error.message }, { shouldFocus: true });
        }
      },
    });
  });

  const busy = mutation.isPending || isSubmitting;
  const globalError =
    mutation.isError && !(mutation.error instanceof ApiError && mutation.error.field) ? mutation.error : null;

  return (
    <form className="manifest" onSubmit={onSubmit} noValidate aria-busy={busy}>
      <header className="manifest__head">
        <h2>Solicitud de embarque</h2>
        <p>Rellena el manifiesto. Todos los campos son obligatorios.</p>
      </header>

      <Field id="fullName" label="Nombre completo" error={errors.fullName?.message}>
        {(aria) => <input type="text" autoComplete="name" {...aria} {...register("fullName")} />}
      </Field>

      <Field id="email" label="Email" error={errors.email?.message}>
        {(aria) => <input type="email" autoComplete="email" inputMode="email" {...aria} {...register("email")} />}
      </Field>

      <div className="row">
        <Field id="age" label="Edad" error={errors.age?.message}>
          {(aria) => <input type="number" inputMode="numeric" {...aria} {...register("age", { valueAsNumber: true })} />}
        </Field>

        <Field id="role" label="Rol en la misión" error={errors.role?.message}>
          {(aria) => (
            <select {...aria} {...register("role")}>
              <option value="">Elige un rol…</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field
        id="missionCode"
        label="Código de misión"
        hint="Está en tu carta de convocatoria: MC- y cuatro dígitos"
        error={errors.missionCode?.message}
      >
        {(aria) => <input type="text" placeholder="MC-2031" autoComplete="off" {...aria} {...register("missionCode")} />}
      </Field>

      <div className="row">
        <Field id="password" label="Contraseña" hint="8+ caracteres, una mayúscula y un número" error={errors.password?.message}>
          {(aria) => (
            <input type={showPassword ? "text" : "password"} autoComplete="new-password" {...aria} {...register("password")} />
          )}
        </Field>

        <Field id="confirmPassword" label="Repite la contraseña" error={errors.confirmPassword?.message}>
          {(aria) => (
            <input type={showPassword ? "text" : "password"} autoComplete="new-password" {...aria} {...register("confirmPassword")} />
          )}
        </Field>
      </div>

      <label className="check">
        <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
        Mostrar contraseñas
      </label>

      <div className={`terms${errors.acceptTerms ? " field--invalid" : ""}`}>
        <label className="check">
          <input
            type="checkbox"
            aria-invalid={Boolean(errors.acceptTerms)}
            aria-describedby={errors.acceptTerms ? "acceptTerms-error" : undefined}
            {...register("acceptTerms")}
          />
          Acepto el protocolo de seguridad y el examen médico previo al vuelo
        </label>
        {errors.acceptTerms && (
          <p id="acceptTerms-error" className="field__error" role="alert">
            {errors.acceptTerms.message}
          </p>
        )}
      </div>

      {globalError && (
        <div className="banner banner--error" role="alert">
          <strong>No se ha podido registrar.</strong> {globalError.message}
        </div>
      )}

      {mutation.isSuccess && (
        <div className="banner banner--ok" role="status">
          <strong>Registrado.</strong> {mutation.data.fullName} ya figura en la tripulación como{" "}
          {ROLE_LABELS[mutation.data.role].toLowerCase()}.
          <button type="button" className="link" onClick={() => mutation.reset()}>
            Cerrar
          </button>
        </div>
      )}

      <button type="submit" className="btn btn--primary" disabled={busy}>
        {busy ? (
          <>
            <span className="spinner" aria-hidden="true" /> Registrando…
          </>
        ) : (
          "Registrar tripulante"
        )}
      </button>
    </form>
  );
}
