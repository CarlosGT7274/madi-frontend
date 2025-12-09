// types/planeacion.ts
// Tipos actualizados para el sistema de planeación con aprobaciones

export type DiaSemana = "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";

export type EstadoPlaneacion = "borrador" | "enviada" | "aprobada" | "rechazada";

export type EstadoActividad = "pendiente" | "en_proceso" | "completada" | "pausada" | "cancelada";

export type Prioridad = "alta" | "media" | "baja";

export type RolUsuario = "administrador" | "ingeniero";

// ==================== ENTIDADES PRINCIPALES ====================

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: RolUsuario;
}

export interface Empleado {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  puesto: string;
  rolId: number;
  telefono: string;
  email: string;
  activo: boolean;
  fechaIngreso: string;
  fechaCreacion: string;
}

export interface Planta {
  id: number;
  nombre: string;
  clave?: string;
  direccion?: string;
  activa?: boolean;
  fechaCreacion: string;
  levantamientosIds: string[];
  usuarioACargo?: string;
  usuarioACargoId?: number;
  usuarioACargoCorreo?: string;
}

export interface Levantamiento {
  id: number;
  folio: string;
  cliente: string;
  proyectosIds: string[];
}

export interface Proyecto {
  id: number;
  nombre: string;
}

export interface Partida {
  id: number;
  numero: string;
  concepto: string;
  unidad: number;
  cantidad: number;
  precioUnitario: number;
  total: number;
  numero_partida?: number;
  descripcion: string;
}

export interface Cotizacion {
  id: number;
  proyecto_id: number;      // ← snake_case
  tiene_orden_compra: boolean; // ← snake_case
  tiene_insumos: boolean;
  partidas?: Partida[];
}

export interface Actividad {
  id?: number; // ✅ number (API)
  proyectoSemanaId?: string;
  partidaId?: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  diaSemana: DiaSemana; // ✅ Compatibilidad camelCase
  horaInicio?: string;
  horaFin?: string;
  duracionHoras?: number;
  avancePlaneado?: number;
  avanceReal?: number;
  prioridad?: Prioridad;
  estado?: EstadoActividad;
  requiereMaquinaria?: boolean;
  requiereMaterial?: boolean;
  notas?: string;
  orden?: number;
  fechaCreacion?: string;
  esPartidaBase?: boolean;
  
  // ✅ Campos de la API (snake_case)
  proyecto_semana_id?: string;
  dia_semana?: DiaSemana;
  cantidad_empleados_requeridos?: number;
}

// Asignacion ahora usa campos de la API
export interface Asignacion {
  id?: number; // ✅ Opcional en creación
  planeacion_id?: number;
  actividad_id: number;
  empleado_id: number;
  empleado_nombre?: string;
  dia_semana: DiaSemana;
  estado?: string;
  horas_trabajadas?: number;
  
  // Compatibilidad camelCase (deprecated, usar snake_case)
  actividadId?: number;
  empleadoId?: string;
  diaSemana?: DiaSemana;
}

export interface ProyectoSemana {
  id: number;
  semanaId: number;
  proyectoId: number;
  estado: string;
}

// ==================== PLANEACIÓN COMPLETA (CON ESTADOS) ====================

export interface PlaneacionSemanal {
  id: number;
  semana: number;
  anio: number;
  plantaId: number;
  proyectoId: number;
  proyectoSemanaId: number;
  
  // ✨ ESTADOS Y APROBACIONES
  estado: EstadoPlaneacion;
  
  // Usuario que creó (ingeniero)
  ingeniero: {
    id: number;
    nombre: string;
    correo: string;
  };
  
  // Fechas
  fechaCreacion: string;
  fechaModificacion: string;
  fechaEnvio?: string;
  fechaAprobacion?: string;
  fechaRechazo?: string;
  
  // Administrador que aprobó/rechazó
  administrador?: {
    id: string;
    nombre: string;
  };
  
  // Comentarios del admin
  comentariosAdmin?: string;
  
  // Datos de la planeación
  actividades: Actividad[];
  asignaciones: Asignacion[];
}

// ==================== PARA COMPONENTES ====================

export interface PlaneacionFormProps {
  mode: "create" | "view";
  planeacionId?: string;
  userRole: RolUsuario;
  userId: number;
  userName: string;
  userEmail: string;
  onSave?: (data: PlaneacionSemanal) => void;
  onSubmit?: (data: PlaneacionSemanal) => void;
  onApprove?: (id: number, comentarios: string) => void;
  onReject?: (id: number, comentarios: string) => void;
}

export interface PlaneacionCompleta {
  planta: Planta;
  proyecto: Proyecto;
  cotizacion: Cotizacion | null;
  planeacion: PlaneacionSemanal;
}

// ==================== UTILIDADES ====================

// export const diasSemana: DiaSemana[] = [
//   "lunes",
//   "martes",
//   "miercoles",
//   "jueves",
//   "viernes",
//   "sabado",
//   "domingo",
// ];
//
// export function getDiaNombre(dia: DiaSemana): string {
//   const nombres: Record<DiaSemana, string> = {
//     lunes: "Lunes",
//     martes: "Martes",
//     miercoles: "Miércoles",
//     jueves: "Jueves",
//     viernes: "Viernes",
//     sabado: "Sábado",
//     domingo: "Domingo",
//   };
//   return nombres[dia];
// }

export function getEstadoColor(estado: EstadoPlaneacion): string {
  const colores: Record<EstadoPlaneacion, string> = {
    borrador: "bg-gray-100 text-gray-700 border-gray-300",
    enviada: "bg-blue-100 text-blue-700 border-blue-300",
    aprobada: "bg-green-100 text-green-700 border-green-300",
    rechazada: "bg-red-100 text-red-700 border-red-300",
  };
  return colores[estado];
}

export function getEstadoIcon(estado: EstadoPlaneacion): string {
  const iconos: Record<EstadoPlaneacion, string> = {
    borrador: "📝",
    enviada: "📤",
    aprobada: "✅",
    rechazada: "❌",
  };
  return iconos[estado];
}

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
  codigo: string;
  nombre: string;
  dia_semana: DiaSemana;
  notas?: string;
  asignaciones?: AsignacionDto[];
}

export interface AsignacionDto {
  actividad_id?: number;
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
}

export interface AprobarPlaneacionDto {
  aprobador_id: number;
  comentarios?: string;
}

export interface RechazarPlaneacionDto {
  aprobador_id: number;
  comentarios: string;
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
