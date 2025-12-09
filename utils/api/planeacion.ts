// utils/api/planeacion.ts
import { Actividad, Asignacion } from "@/types/planeacion";
import { post, get, del, patch } from "../http";

export type EstadoPlaneacion = 'borrador' | 'enviada' | 'aprobada' | 'rechazada';
export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export interface Planeacion {
  id: number;
  semana: number;
  anio: number;
  planta_id: number;
  planta_nombre: string;
  proyecto_id: number;
  proyecto_nombre: string;
  usuario_id: number;
  estado: EstadoPlaneacion;
  fecha_envio?: string;
  fecha_aprobacion?: string;
  fecha_rechazo?: string;
  aprobador_id?: number;
  comentarios_aprobacion?: string;
  actividades: Actividad[];
  asignaciones: Asignacion[];
  fecha_creacion: string;
  fecha_modificacion: string;
  usuario?: {
    id: number;
    nombre: string;
    correo: string;
  };
  aprobador?: {
    id: number;
    nombre: string;
  };
}

export interface ActividadDto {
  id?: number;
  codigo: string;
  nombre: string;
  dia_semana: DiaSemana;
  notas?: string;
  asignaciones?: AsignacionDto[];
}

export interface AsignacionDto {
  id?: number;
  actividad_id: number;
  empleado_id: number;
  empleado_nombre: string;
  dia_semana: DiaSemana;
  estado?: 'asignado' | 'en_progreso' | 'completado' | 'cancelado';
  horas_trabajadas?: number;
}

export interface CrearPlaneacionDto {
  semana: number;
  anio: number;
  planta_id: number;
  planta_nombre: string;
  proyecto_id: number;
  proyecto_nombre: string;
  usuario_id: number;
  actividades?: ActividadDto[];
}

export interface ActualizarPlaneacionDto {
  semana?: number;
  anio?: number;
  planta_id?: number;
  planta_nombre?: string;
  proyecto_id?: number;
  proyecto_nombre?: string;
  actividades?: ActividadDto[];
  asignaciones?: AsignacionDto[];
}

export interface AprobarPlaneacionDto {
  administrador_id: number;
  comentarios?: string;
}

export interface RechazarPlaneacionDto {
  aprobador_id: number;
  comentarios: string;
}

export interface ActualizarHorasDto {
  horas_trabajadas: number;
}

export interface EstadisticasPlaneacion {
  total: number;
  borradores: number;
  enviadas: number;
  aprobadas: number;
  rechazadas: number;
}

// ==========================================
// CONSTANTES
// ==========================================
export const diasSemana: DiaSemana[] = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
];

export function getDiaNombre(dia: DiaSemana): string {
  const nombres: Record<DiaSemana, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };
  return nombres[dia];
}

// ==========================================
// PLANEACIONES
// ==========================================

/**
 * Crear planeación
 * POST /ingenieria/planeaciones
 */
export async function crearPlaneacion(dto: CrearPlaneacionDto): Promise<Planeacion> {
  return await post('ingenieria/planeaciones', dto);
}

/**
 * Obtener planeación por ID
 * GET /ingenieria/planeaciones/:id
 */
export async function obtenerPlaneacion(id: number): Promise<Planeacion> {
  return await get(`ingenieria/planeaciones/${id}`);
}

/**
 * Obtener todas las planeaciones (con filtros)
 * GET /ingenieria/planeaciones?estado=...&semana=...&anio=...
 */
export async function obtenerPlaneaciones(filtros?: {
  estado?: EstadoPlaneacion;
  semana?: number;
  anio?: number;
}): Promise<Planeacion[]> {
  const params = new URLSearchParams();
  if (filtros?.estado) params.append('estado', filtros.estado);
  if (filtros?.semana) params.append('semana', filtros.semana.toString());
  if (filtros?.anio) params.append('anio', filtros.anio.toString());
  
  const query = params.toString();
  return await get(`ingenieria/planeaciones${query ? `?${query}` : ''}`);
}

/**
 * Actualizar planeación
 * PATCH /ingenieria/planeaciones/:id
 */
export async function actualizarPlaneacion(
  id: number,
  dto: ActualizarPlaneacionDto,
): Promise<Planeacion> {
  return await patch(`ingenieria/planeaciones/${id}`, dto);
}

/**
 * Eliminar planeación
 * DELETE /ingenieria/planeaciones/:id
 */
export async function eliminarPlaneacion(id: number): Promise<void> {
  await del(`ingenieria/planeaciones/${id}`);
}

// ==========================================
// FLUJO DE APROBACIÓN
// ==========================================

/**
 * Enviar para aprobación
 * POST /ingenieria/planeaciones/:id/enviar
 */
export async function enviarParaAprobacion(id: number): Promise<Planeacion> {
  return await post(`ingenieria/planeaciones/${id}/enviar`, {});
}

/**
 * Aprobar planeación
 * POST /ingenieria/planeaciones/:id/aprobar
 */
export async function aprobarPlaneacion(
  id: number,
  dto: AprobarPlaneacionDto,
): Promise<Planeacion> {
  return await post(`ingenieria/planeaciones/${id}/aprobar`, dto);
}

/**
 * Rechazar planeación
 * POST /ingenieria/planeaciones/:id/rechazar
 */
export async function rechazarPlaneacion(
  id: number,
  dto: RechazarPlaneacionDto,
): Promise<Planeacion> {
  return await post(`ingenieria/planeaciones/${id}/rechazar`, dto);
}

// ==========================================
// ACTIVIDADES
// ==========================================

/**
 * Agregar actividad a planeación
 * POST /ingenieria/planeaciones/:planeacionId/actividades
 */
export async function agregarActividad(
  planeacionId: number,
  dto: ActividadDto,
): Promise<Actividad> {
  return await post(`ingenieria/planeaciones/${planeacionId}/actividades`, dto);
}

/**
 * Actualizar actividad
 * PATCH /ingenieria/planeaciones/actividades/:id
 */
export async function actualizarActividad(
  id: number,
  dto: Partial<ActividadDto>,
): Promise<Actividad> {
  return await patch(`ingenieria/planeaciones/actividades/${id}`, dto);
}

/**
 * Eliminar actividad
 * DELETE /ingenieria/planeaciones/actividades/:id
 */
export async function eliminarActividad(id: number): Promise<void> {
  await del(`ingenieria/planeaciones/actividades/${id}`);
}

// ==========================================
// ASIGNACIONES
// ==========================================

/**
 * Agregar asignación a actividad
 * POST /ingenieria/planeaciones/actividades/:actividadId/asignaciones
 */
export async function agregarAsignacion(
  actividadId: number,
  dto: AsignacionDto,
): Promise<Asignacion> {
  return await post(`ingenieria/planeaciones/actividades/${actividadId}/asignaciones`, dto);
}

/**
 * Actualizar asignación
 * PATCH /ingenieria/planeaciones/asignaciones/:id
 */
export async function actualizarAsignacion(
  id: number,
  dto: Partial<AsignacionDto>,
): Promise<Asignacion> {
  return await patch(`ingenieria/planeaciones/asignaciones/${id}`, dto);
}

/**
 * Eliminar asignación
 * DELETE /ingenieria/planeaciones/asignaciones/:id
 */
export async function eliminarAsignacion(id: number): Promise<void> {
  await del(`ingenieria/planeaciones/asignaciones/${id}`);
}

/**
 * Actualizar horas trabajadas
 * PATCH /ingenieria/planeaciones/asignaciones/:id/horas
 */
export async function actualizarHorasTrabajadas(
  id: number,
  dto: ActualizarHorasDto,
): Promise<Asignacion> {
  return await patch(`ingenieria/planeaciones/asignaciones/${id}/horas`, dto);
}

// ==========================================
// CONSULTAS
// ==========================================

/**
 * Obtener asignaciones de un empleado
 * GET /ingenieria/planeaciones/empleado/:empleadoId/asignaciones
 */
export async function obtenerAsignacionesPorEmpleado(empleadoId: number): Promise<Asignacion[]> {
  return await get(`ingenieria/planeaciones/empleado/${empleadoId}/asignaciones`);
}

/**
 * Obtener planeaciones por semana
 * GET /ingenieria/planeaciones/semana/:semana/anio/:anio
 */
export async function obtenerPlaneacionesPorSemana(
  semana: number,
  anio: number,
): Promise<Planeacion[]> {
  return await get(`ingenieria/planeaciones/semana/${semana}/anio/${anio}`);
}

/**
 * Obtener estadísticas globales
 * GET /ingenieria/planeaciones/estadisticas/general
 */
export async function obtenerEstadisticas(): Promise<EstadisticasPlaneacion> {
  return await get('ingenieria/planeaciones/estadisticas/general');
}

// ==========================================
// VALIDACIONES (CLIENTE)
// ==========================================

/**
 * Verifica si se puede crear una nueva planeación (lunes a sábado)
 */
export function puedeCrearPlaneacion(): boolean {
  const diaSemana = new Date().getDay();
  return diaSemana >= 1 && diaSemana <= 6;
}

/**
 * Verifica si un usuario puede editar una planeación
 */
export function puedeEditarPlaneacion(
  planeacion: Planeacion,
  usuarioId: number,
  esAdmin: boolean = false,
): boolean {
  if (esAdmin) {
    return planeacion.estado === 'enviada' || 
           planeacion.estado === 'borrador' || 
           planeacion.estado === 'rechazada';
  }
  
  if (planeacion.usuario_id !== usuarioId) return false;
  
  return planeacion.estado === 'borrador' || planeacion.estado === 'rechazada';
}

/**
 * Verifica si se puede aprobar/rechazar
 */
export function puedeAprobarRechazar(planeacion: Planeacion): boolean {
  return planeacion.estado === 'enviada';
}

/**
 * Obtiene el día de la semana actual
 */
export function obtenerDiaSemanaActual(): string {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[new Date().getDay()];
}

/**
 * Verifica si hoy es domingo
 */
export function esDomingo(): boolean {
  return new Date().getDay() === 0;
}

/**
 * Obtiene la fecha de un día específico de la semana
 */
export function getFechaDelDia(fechaInicio: string, dia: DiaSemana): string {
  const indice = diasSemana.indexOf(dia);
  const fecha = new Date(fechaInicio);
  fecha.setDate(fecha.getDate() + indice);
  return fecha.toISOString().split('T')[0];
}
