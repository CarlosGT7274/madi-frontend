import { get, patch } from "../http";

export const obtenerNotificacionesPorArea = async (area: string) => {
  try {
    return await get(`notificaciones/${area}`);
  } catch (error: any) {
    throw new Error(error.message || "Error al obtener notificaciones");
  }
};

export const marcarNotificacionComoLeida = async (id: number) => {
  try {
    return await patch(`notificaciones/${id}`, {});
  } catch (error: any) {
    throw new Error(error.message || "Error al marcar como leída");
  }
};
