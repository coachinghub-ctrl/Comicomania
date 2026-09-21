import { describe, expect, it } from "vitest";
import { puede, territoriosPermitidos } from "./puede";
import type { Actor, Grant } from "./tipos";

const AHORA = new Date("2027-03-15T12:00:00Z");

function grant(parcial: Partial<Grant> = {}): Grant {
  return {
    rol: "CITY_MANAGER",
    tipoAlcance: "CITY",
    alcancePath: "US.FL.MIA",
    secciones: ["VIDEOS", "VIDEO_REVIEW", "PARTICIPANTS", "CONTESTS"],
    acciones: ["VIEW", "EDIT", "APPROVE", "PUBLISH"],
    nivelFinanciero: "CITY",
    desde: new Date("2027-03-01T00:00:00Z"),
    hasta: new Date("2027-06-30T00:00:00Z"),
    estado: "ACTIVE",
    denegados: [],
    ...parcial,
  };
}

function actor(grants: Grant[], mfaEn: Date | null = null): Actor {
  return { usuarioId: "u1", grants, mfaEn };
}

describe("resolución de autoridad", () => {
  it("concede cuando territorio, sección y acción coinciden", () => {
    const d = puede(
      actor([grant()]),
      { seccion: "VIDEO_REVIEW", accion: "APPROVE", path: "US.FL.MIA" },
      AHORA,
    );
    expect(d.permitido).toBe(true);
    expect(d.motivo).toBe("PERMITIDO");
  });

  it("niega una sección que el grant no incluye", () => {
    const d = puede(
      actor([grant()]),
      { seccion: "FINANCE", accion: "VIEW", path: "US.FL.MIA" },
      AHORA,
    );
    expect(d).toMatchObject({ permitido: false, motivo: "SECCION_NO_INCLUIDA" });
  });

  it("niega una acción que el grant no incluye", () => {
    const d = puede(
      actor([grant()]),
      { seccion: "VIDEOS", accion: "DELETE", path: "US.FL.MIA" },
      AHORA,
    );
    expect(d).toMatchObject({ permitido: false, motivo: "ACCION_NO_INCLUIDA" });
  });

  it("un grant GLOBAL alcanza cualquier territorio", () => {
    const g = grant({ tipoAlcance: "GLOBAL", alcancePath: null, rol: "OWNER" });
    expect(puede(actor([g]), { seccion: "VIDEOS", accion: "VIEW", path: "MX.CDMX.CDMX" }, AHORA).permitido).toBe(true);
    expect(puede(actor([g]), { seccion: "VIDEOS", accion: "VIEW", path: null }, AHORA).permitido).toBe(true);
  });

  it("un grant sobre un concurso concreto no abarca su ciudad", () => {
    const g = grant({ tipoAlcance: "CONTEST", alcanceId: "concurso-1", alcancePath: null });
    expect(puede(actor([g]), { seccion: "VIDEOS", accion: "VIEW", alcanceId: "concurso-1" }, AHORA).permitido).toBe(true);
    expect(puede(actor([g]), { seccion: "VIDEOS", accion: "VIEW", path: "US.FL.MIA" }, AHORA).permitido).toBe(false);
  });
});

describe("ventana temporal", () => {
  it("el grant que todavía no empieza no sirve", () => {
    const g = grant({ desde: new Date("2027-04-01T00:00:00Z") });
    expect(puede(actor([g]), { seccion: "VIDEOS", accion: "VIEW", path: "US.FL.MIA" }, AHORA).motivo)
      .toBe("SIN_GRANT_VIGENTE");
  });

  it("el grant vencido deja de servir sin que nadie lo revoque", () => {
    const g = grant({ hasta: new Date("2027-03-14T23:59:59Z") });
    expect(puede(actor([g]), { seccion: "VIDEOS", accion: "VIEW", path: "US.FL.MIA" }, AHORA).permitido).toBe(false);
  });

  it("un grant sin fecha de fin sigue vigente", () => {
    const g = grant({ hasta: null });
    expect(puede(actor([g]), { seccion: "VIDEOS", accion: "VIEW", path: "US.FL.MIA" }, AHORA).permitido).toBe(true);
  });

  it.each(["SUSPENDED", "EXPIRED", "REVOKED"] as const)("el grant en estado %s no concede", (estado) => {
    const g = grant({ estado });
    expect(puede(actor([g]), { seccion: "VIDEOS", accion: "VIEW", path: "US.FL.MIA" }, AHORA).permitido).toBe(false);
  });
});

describe("lista de denegación", () => {
  it("deny gana sobre la concesión del propio grant", () => {
    const g = grant({
      secciones: ["ORDERS"],
      acciones: ["REFUND"],
      denegados: ["ORDERS.REFUND"],
    });
    expect(puede(actor([g]), { seccion: "ORDERS", accion: "REFUND", path: "US.FL.MIA" }, AHORA))
      .toMatchObject({ permitido: false, motivo: "DENEGADO_POR_ROL" });
  });

  // El caso del admin técnico: tiene INFRA, pero no puede tocar el dinero
  // aunque otro grant se lo conceda.
  it("deny de un rol bloquea aunque otro grant lo permita", () => {
    const tecnico = grant({
      rol: "SUPER_ADMIN_TECH",
      tipoAlcance: "GLOBAL",
      alcancePath: null,
      secciones: ["INFRA"],
      acciones: ["MANAGE"],
      denegados: ["ORDERS.REFUND"],
    });
    const otro = grant({ secciones: ["ORDERS"], acciones: ["REFUND"] });
    expect(puede(actor([tecnico, otro]), { seccion: "ORDERS", accion: "REFUND", path: "US.FL.MIA" }, AHORA))
      .toMatchObject({ permitido: false, motivo: "DENEGADO_POR_ROL" });
  });
});

describe("segundo factor", () => {
  const g = grant({
    tipoAlcance: "GLOBAL",
    alcancePath: null,
    rol: "OWNER",
    secciones: ["ACCESS_CONTROL", "FINANCE"],
    acciones: ["MANAGE", "VIEW"],
  });

  it("exige MFA en las acciones sensibles", () => {
    expect(puede(actor([g], null), { seccion: "ACCESS_CONTROL", accion: "MANAGE" }, AHORA))
      .toMatchObject({ permitido: false, motivo: "MFA_REQUERIDA" });
  });

  it("acepta MFA reciente", () => {
    const hace1h = new Date(AHORA.getTime() - 60 * 60 * 1000);
    expect(puede(actor([g], hace1h), { seccion: "ACCESS_CONTROL", accion: "MANAGE" }, AHORA).permitido).toBe(true);
  });

  it("rechaza MFA de hace más de doce horas", () => {
    const hace13h = new Date(AHORA.getTime() - 13 * 60 * 60 * 1000);
    expect(puede(actor([g], hace13h), { seccion: "ACCESS_CONTROL", accion: "MANAGE" }, AHORA).motivo)
      .toBe("MFA_REQUERIDA");
  });

  it("no exige MFA en acciones ordinarias", () => {
    const ordinario = grant({ secciones: ["VIDEOS"], acciones: ["VIEW"] });
    expect(puede(actor([ordinario], null), { seccion: "VIDEOS", accion: "VIEW", path: "US.FL.MIA" }, AHORA).permitido).toBe(true);
  });
});

// El test que el documento exige: el operador de Miami intentando llegar a
// datos de Orlando por todas las vías imaginables. Ninguna puede funcionar.
describe("aislamiento de territorio", () => {
  const miami = actor([grant()]);

  const rutasOrlando = [
    { nombre: "path directo de la ciudad", s: { seccion: "PARTICIPANTS", accion: "VIEW", path: "US.FL.ORLANDO" } },
    { nombre: "path de un barrio inventado", s: { seccion: "PARTICIPANTS", accion: "VIEW", path: "US.FL.ORLANDO.CENTRO" } },
    { nombre: "prefijo parcial de Miami", s: { seccion: "PARTICIPANTS", accion: "VIEW", path: "US.FL.MIAMIBEACH" } },
    { nombre: "región completa", s: { seccion: "PARTICIPANTS", accion: "VIEW", path: "US.FL" } },
    { nombre: "país completo", s: { seccion: "PARTICIPANTS", accion: "VIEW", path: "US" } },
    { nombre: "otro país", s: { seccion: "PARTICIPANTS", accion: "VIEW", path: "MX.CDMX.CDMX" } },
    { nombre: "sin path", s: { seccion: "PARTICIPANTS", accion: "VIEW" } },
    { nombre: "path vacío", s: { seccion: "PARTICIPANTS", accion: "VIEW", path: "" } },
    { nombre: "id de concurso ajeno", s: { seccion: "CONTESTS", accion: "VIEW", alcanceId: "concurso-orlando" } },
    { nombre: "id ajeno con path propio falseado", s: { seccion: "CONTESTS", accion: "VIEW", alcanceId: "concurso-orlando", path: "US.FL.ORLANDO" } },
    { nombre: "sección fuera del grant en su ciudad", s: { seccion: "FINANCE", accion: "VIEW", path: "US.FL.MIA" } },
    { nombre: "acción fuera del grant en su ciudad", s: { seccion: "VIDEOS", accion: "DELETE", path: "US.FL.MIA" } },
  ] as const;

  it.each(rutasOrlando)("niega: $nombre", ({ s }) => {
    expect(puede(miami, s, AHORA).permitido).toBe(false);
  });

  it("y sí permite lo suyo", () => {
    expect(puede(miami, { seccion: "PARTICIPANTS", accion: "VIEW", path: "US.FL.MIA" }, AHORA).permitido).toBe(true);
  });
});

describe("filtro de territorios para listados", () => {
  it("junta los paths de todos los grants que aplican", () => {
    const a = actor([
      grant({ alcancePath: "US.FL.MIA" }),
      grant({ alcancePath: "US.FL.ORLANDO" }),
      grant({ alcancePath: "MX", tipoAlcance: "COUNTRY", secciones: ["FINANCE"] }),
    ]);
    const r = territoriosPermitidos(a, "PARTICIPANTS", "VIEW", AHORA);
    expect(r.global).toBe(false);
    expect(r.paths.sort()).toEqual(["US.FL.MIA", "US.FL.ORLANDO"]);
  });

  it("marca global cuando corresponde", () => {
    const a = actor([grant({ tipoAlcance: "GLOBAL", alcancePath: null })]);
    expect(territoriosPermitidos(a, "VIDEOS", "VIEW", AHORA).global).toBe(true);
  });

  it("ignora grants vencidos", () => {
    const a = actor([grant({ hasta: new Date("2027-01-01T00:00:00Z") })]);
    expect(territoriosPermitidos(a, "VIDEOS", "VIEW", AHORA).paths).toEqual([]);
  });
});
