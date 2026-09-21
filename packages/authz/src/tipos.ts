export type TipoAlcance =
  | "GLOBAL"
  | "COUNTRY"
  | "REGION"
  | "CITY"
  | "CONTEST"
  | "EVENT"
  | "VENUE";

export type EstadoGrant = "ACTIVE" | "SUSPENDED" | "EXPIRED" | "REVOKED";

export type NivelFinanciero = "NONE" | "LOCAL" | "CITY" | "COUNTRY" | "GLOBAL";

export type Grant = {
  rol: string;
  tipoAlcance: TipoAlcance;
  /** Id del objeto para CONTEST / EVENT / VENUE. */
  alcanceId?: string | null;
  /** Territorio materializado: 'US', 'US.FL', 'US.FL.MIA'. Null si es GLOBAL. */
  alcancePath?: string | null;
  secciones: string[];
  acciones: string[];
  nivelFinanciero: NivelFinanciero;
  desde: Date;
  hasta?: Date | null;
  estado: EstadoGrant;
  /** Lista de denegación del rol: gana sobre cualquier concesión. */
  denegados: string[];
};

export type Actor = {
  usuarioId: string;
  grants: Grant[];
  /** Última verificación de segundo factor. */
  mfaEn?: Date | null;
};

/**
 * Lo que se pide. `path` y `alcanceId` describen el OBJETO, y quien llama
 * los resuelve desde la base de datos — nunca desde el request del cliente.
 */
export type Solicitud = {
  seccion: string;
  accion: string;
  path?: string | null;
  tipoAlcance?: TipoAlcance;
  alcanceId?: string | null;
};

export type Motivo =
  | "PERMITIDO"
  | "SIN_GRANT_VIGENTE"
  | "FUERA_DE_TERRITORIO"
  | "SECCION_NO_INCLUIDA"
  | "ACCION_NO_INCLUIDA"
  | "DENEGADO_POR_ROL"
  | "MFA_REQUERIDA";

export type Decision = {
  permitido: boolean;
  motivo: Motivo;
  /** El grant que concedió el acceso, para dejarlo en auditoría. */
  grant?: Grant;
};
