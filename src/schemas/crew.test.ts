import { afterEach, describe, expect, it, vi } from "vitest";
import { crewFormSchema, crewMemberSchema } from "./crew";
import { fetchCrew } from "../api/crew";

const validForm = {
  fullName: "Ana Pérez",
  email: "ana@correo.es",
  age: 30,
  role: "piloto",
  missionCode: "MC-2031",
  password: "Secreta123",
  confirmPassword: "Secreta123",
  acceptTerms: true,
};

const validMember = {
  id: "7d3f1c2e-5a4b-4c6d-8e9f-0a1b2c3d4e5f",
  fullName: "Ana Pérez",
  email: "ana@correo.es",
  age: 30,
  role: "piloto",
  missionCode: "MC-2031",
  createdAt: "2026-11-22T10:00:00.000Z",
};

const corruptMember = { ...validMember, id: "no-uuid", email: "nope", age: "treinta", role: "alienigena" };

const messagesFor = (data: unknown, path: string) => {
  const r = crewFormSchema.safeParse(data);
  if (r.success) return [];
  return r.error.issues.filter((i) => i.path.join(".") === path).map((i) => i.message);
};

describe("crewFormSchema", () => {
  it("acepta un formulario válido", () => {
    expect(crewFormSchema.safeParse(validForm).success).toBe(true);
  });

  it("rechaza contraseñas que no coinciden (error en confirmPassword)", () => {
    expect(messagesFor({ ...validForm, confirmPassword: "Otra1234" }, "confirmPassword")).toContain(
      "Las contraseñas no coinciden",
    );
  });

  it("rechaza contraseñas que contienen el nombre", () => {
    const pw = "Ana12345X";
    expect(messagesFor({ ...validForm, password: pw, confirmPassword: pw }, "password")).toContain(
      "La contraseña no puede contener tu nombre",
    );
  });

  it("da un mensaje propio cuando la edad es NaN (campo vacío)", () => {
    expect(messagesFor({ ...validForm, age: NaN }, "age")).toContain("Indica tu edad con un número");
  });

  it("exige edad mínima, código de misión y términos", () => {
    expect(messagesFor({ ...validForm, age: 18 }, "age")).toHaveLength(1);
    expect(messagesFor({ ...validForm, missionCode: "XX-1" }, "missionCode")).toHaveLength(1);
    expect(messagesFor({ ...validForm, acceptTerms: false }, "acceptTerms")).toHaveLength(1);
  });
});

describe("BONUS · validación de la respuesta de la API", () => {
  it("crewMemberSchema atrapa un registro corrupto", () => {
    expect(crewMemberSchema.safeParse(validMember).success).toBe(true);
    const result = crewMemberSchema.safeParse(corruptMember);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toEqual(expect.arrayContaining(["id", "email", "age", "role"]));
    }
  });

  describe("fetchCrew", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("aparta los registros corruptos y conserva los válidos", async () => {
      const body = JSON.stringify([validMember, corruptMember]);
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));

      const { members, rejected } = await fetchCrew({ role: "all", chaos: false });

      expect(members).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].index).toBe(1);
      expect(rejected[0].issues.some((i) => i.startsWith("email"))).toBe(true);
    });
  });
});
