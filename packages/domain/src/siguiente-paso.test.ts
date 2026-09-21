import { describe, expect, it } from "vitest";
import { accionesPendientes, siguientePaso } from "./siguiente-paso";
import type { EstadoUsuario } from "./siguiente-paso";

function estado(parcial: Partial<EstadoUsuario> = {}): EstadoUsuario {
  return {
    emailVerificado: true,
    completitudPerfil: 100,
    esHumorista: false,
    concursoAbierto: null,
    participacion: null,
    votacionAbierta: false,
    haVotado: false,
    talentosQueSigue: 0,
    entradas: 0,
    cursosActivos: 0,
    diasSinActividad: 0,
    ...parcial,
  };
}

const MIAMI = { nombre: "COMICOMANÍA Miami", href: "/concursos/us/miami/2027" };

describe("siguiente paso", () => {
  it("verificar el email gana sobre todo lo demás", () => {
    const e = estado({
      emailVerificado: false,
      completitudPerfil: 10,
      esHumorista: true,
      concursoAbierto: MIAMI,
      votacionAbierta: true,
    });
    expect(siguientePaso(e).codigo).toBe("VERIFICAR_EMAIL");
  });

  it("pide completar el perfil cuando está por debajo del mínimo", () => {
    expect(siguientePaso(estado({ completitudPerfil: 30 })).codigo).toBe(
      "COMPLETAR_PERFIL",
    );
  });

  it("no lo pide cuando ya llegó al mínimo", () => {
    expect(siguientePaso(estado({ completitudPerfil: 60 })).codigo).not.toBe(
      "COMPLETAR_PERFIL",
    );
  });

  it("invita a inscribirse solo a humoristas con concurso abierto", () => {
    const humorista = estado({ esHumorista: true, concursoAbierto: MIAMI });
    expect(siguientePaso(humorista).codigo).toBe("INSCRIBIRSE");
    expect(siguientePaso(humorista).titulo).toContain("Miami");

    const espectador = estado({ esHumorista: false, concursoAbierto: MIAMI });
    expect(siguientePaso(espectador).codigo).not.toBe("INSCRIBIRSE");

    const sinConcurso = estado({ esHumorista: true, concursoAbierto: null });
    expect(siguientePaso(sinConcurso).codigo).not.toBe("INSCRIBIRSE");
  });

  it("acompaña al participante por toda la cadena del concurso", () => {
    const base = { esHumorista: true, concursoAbierto: MIAMI } as const;
    const esperado = {
      INSCRITO: "SUBIR_VIDEO",
      CAMBIOS_SOLICITADOS: "CORREGIR_VIDEO",
      PUBLICADO: "COMPARTIR_VIDEO",
    } as const;
    for (const [participacion, codigo] of Object.entries(esperado)) {
      expect(
        siguientePaso(estado({ ...base, participacion: participacion as never }))
          .codigo,
      ).toBe(codigo);
    }
  });

  it("no insiste mientras el video está en revisión", () => {
    const e = estado({
      esHumorista: true,
      concursoAbierto: MIAMI,
      participacion: "EN_REVISION",
    });
    const codigo = siguientePaso(e).codigo;
    expect(["SUBIR_VIDEO", "CORREGIR_VIDEO"]).not.toContain(codigo);
  });

  it("recorre la escalera del espectador: votar, seguir, entrada, academia", () => {
    expect(siguientePaso(estado({ votacionAbierta: true })).codigo).toBe("VOTAR");
    expect(
      siguientePaso(estado({ haVotado: true, talentosQueSigue: 0 })).codigo,
    ).toBe("SEGUIR_TALENTO");
    expect(siguientePaso(estado({ talentosQueSigue: 3 })).codigo).toBe(
      "COMPRAR_ENTRADA",
    );
    expect(
      siguientePaso(estado({ talentosQueSigue: 3, entradas: 1 })).codigo,
    ).toBe("EXPLORAR_ACADEMIA");
  });

  it("no vuelve a pedir el voto a quien ya votó", () => {
    const e = estado({ votacionAbierta: true, haVotado: true, talentosQueSigue: 5 });
    expect(siguientePaso(e).codigo).not.toBe("VOTAR");
  });

  it("reactiva al inactivo", () => {
    expect(siguientePaso(estado({ diasSinActividad: 45 })).codigo).toBe("REACTIVAR");
    expect(siguientePaso(estado({ diasSinActividad: 29 })).codigo).toBe("EXPLORAR");
  });

  it("siempre devuelve algo, nunca deja al usuario sin siguiente paso", () => {
    expect(siguientePaso(estado()).codigo).toBe("EXPLORAR");
    expect(siguientePaso(estado()).href).toBeTruthy();
  });
});

describe("acciones pendientes", () => {
  it("las devuelve todas, ordenadas por prioridad", () => {
    const e = estado({
      emailVerificado: false,
      completitudPerfil: 20,
      votacionAbierta: true,
    });
    const acciones = accionesPendientes(e);
    expect(acciones.map((a) => a.codigo)).toContain("VERIFICAR_EMAIL");
    expect(acciones.map((a) => a.codigo)).toContain("COMPLETAR_PERFIL");
    const prioridades = acciones.map((a) => a.prioridad);
    expect(prioridades).toEqual([...prioridades].sort((a, b) => a - b));
  });

  it("no devuelve nada cuando el usuario está al día", () => {
    expect(accionesPendientes(estado())).toEqual([]);
  });
});
