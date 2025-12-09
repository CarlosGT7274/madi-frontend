// types/notificacion.ts
export interface Notificacion {
  id: number;
  mensaje: string;
  destino: string;
  modulo: string;
  leida: boolean;
  fecha: string;
  fechaFormateada: string;
  relacion_id?: number; // ID genérico
  tipo_entidad?: string; // Tipo de entidad
}
