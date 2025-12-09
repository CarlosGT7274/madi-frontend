import { get, patch, put, post } from "../http";

/** ===== Tipos ===== */
export interface EstadoMaterial {
  id: number;
  nombre: string;
}

export interface ActualizarMaterialCompras {
  id: number;
  idEstatus: number;
  observacion?: string;
  /** YYYY-MM-DD (si viene vacío no se envía) */
  fechaLlegada?: string;
}

export interface ActualizarComprasDTO {
  requisicionId: number;
  observaciones?: string;
  materiales: ActualizarMaterialCompras[];
}

/** ===== Helpers ===== */
const normTxt = (s?: string) =>
  s && s.trim().length > 0 ? s.trim() : undefined;

const normDate = (d?: string) =>
  d && d.trim().length > 0 ? d.trim() : undefined;

/** ===== API ===== */
export const obtenerEstadosMaterial = async (): Promise<EstadoMaterial[]> => {
  return await get("estado-material");
};

/** (opcional/legacy) solo si aún lo usas en alguna pantalla */
export const actualizarMateriales = async (
  materiales: {
    id: number;
    idEstatus: number;
    observacion?: string;
    fechaLlegada?: string | null;
  }[]
) => {
  // si fechaLlegada viene "", mejor no enviarla
  const body = {
    materiales: materiales.map((m) => ({
      id: m.id,
      idEstatus: m.idEstatus,
      observacion: normTxt(m.observacion),
      fechaLlegada: normDate(m.fechaLlegada || undefined),
    })),
  };
  return await put("requisicion/actualizar-masivo", body);
};

/** Endpoint para Compras */
export const actualizarMaterialesDesdeCompras = async (
  data: ActualizarComprasDTO
) => {
  const payload: ActualizarComprasDTO = {
    requisicionId: data.requisicionId,
    observaciones: normTxt(data.observaciones),
    materiales: data.materiales.map((m) => ({
      id: m.id,
      idEstatus: m.idEstatus,
      observacion: normTxt(m.observacion),
      fechaLlegada: normDate(m.fechaLlegada),
    })),
  };

  // Backend: POST /requisicion/compras/actualizar
  return await post("requisicion/compras/actualizar", payload);
};

/** Si tienes un endpoint para actualizar solo observaciones de la requisición */
export const actualizarObservacionesRequisicion = async (
  id: number,
  observaciones: string
) => {
  return await patch(`requisicion/${id}/observaciones`, {
    observaciones: normTxt(observaciones),
  });
};
