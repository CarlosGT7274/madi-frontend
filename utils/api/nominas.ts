import { post, get, del, patch } from "../http";

// ==========================================
// EMPLEADOS
// ==========================================

export const crearEmpleado = async (data: {
  numero_empleado: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento?: string;
  rfc?: string;
  curp?: string;
  nss?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  puesto_id: number;
  tipo_contrato: "planta" | "temporal" | "honorarios";
  salario_base: number;
  salario_diario: number;
  fecha_ingreso: string;
}) => {
  return await post("nominas/empleados", data);
};

export const obtenerEmpleados = async (filtros?: {
  activo?: boolean;
  puesto_id?: number;
  estado_asignacion?: "disponible" | "ocupado";
}) => {
  const params = new URLSearchParams();
  if (filtros?.activo !== undefined) params.append("activo", String(filtros.activo));
  if (filtros?.puesto_id) params.append("puesto_id", String(filtros.puesto_id));
  if (filtros?.estado_asignacion) params.append("estado_asignacion", filtros.estado_asignacion);

  return await get(`nominas/empleados?${params.toString()}`);
};

export const obtenerEmpleadoPorId = async (id: number) => {
  return await get(`nominas/empleados/${id}`);
};

export const actualizarEmpleado = async (id: number, data: {
  numero_empleado?: string;
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  fecha_nacimiento?: string;
  rfc?: string;
  curp?: string;
  nss?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  puesto_id?: number;
  tipo_contrato?: "planta" | "temporal" | "honorarios";
  salario_base?: number;
  salario_diario?: number;
  activo?: boolean;
}) => {
  return await patch(`nominas/empleados/${id}`, data);
};

export const darDeBajaEmpleado = async (id: number, fecha_baja: string) => {
  return await patch(`nominas/empleados/${id}/baja`, { fecha_baja });
};

export const activarEmpleado = async (id: number) => {
  return await patch(`nominas/empleados/${id}/activar`, {});
};

// ==========================================
// PUESTOS
// ==========================================

export const obtenerPuestos = async () => {
  return await get("nominas/puestos");
};

export const crearPuesto = async (data: {
  nombre: string;
  descripcion?: string;
  salario_base_minimo?: number;
  salario_base_maximo?: number;
  color: string;
}) => {
  return await post("nominas/puestos", data);
};

// ==========================================
// ASIGNACIÓN EMPLEADO-PLANTA
// ==========================================

export const asignarEmpleadoAPlanta = async (data: {
  empleado_id: number;
  planta_id: number;
  actividad_id?: number;
  fecha_asignacion: string;
}) => {
  return await post("nominas/asignaciones", data);
};

export const desasignarEmpleadoDePlanta = async (asignacion_id: number, fecha_desasignacion: string) => {
  return await patch(`nominas/asignaciones/${asignacion_id}/desasignar`, { fecha_desasignacion });
};

export const obtenerAsignacionesPorEmpleado = async (empleado_id: number) => {
  return await get(`nominas/asignaciones?empleado_id=${empleado_id}`);
};

export const obtenerAsignacionesPorPlanta = async (planta_id: number) => {
  return await get(`nominas/asignaciones?planta_id=${planta_id}`);
};

// ==========================================
// PERIODOS DE NÓMINA
// ==========================================

export const crearPeriodoNomina = async (data: {
  tipo: "semanal" | "quincenal" | "mensual";
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string;
}) => {
  return await post("nominas/periodos", data);
};

export const obtenerPeriodosNomina = async (filtros?: {
  estado?: "abierto" | "calculado" | "pagado" | "cerrado";
  tipo?: "semanal" | "quincenal" | "mensual";
  anio?: number;
}) => {
  const params = new URLSearchParams();
  if (filtros?.estado) params.append("estado", filtros.estado);
  if (filtros?.tipo) params.append("tipo", filtros.tipo);
  if (filtros?.anio) params.append("anio", String(filtros.anio));

  return await get(`nominas/periodos?${params.toString()}`);
};

export const obtenerPeriodoPorId = async (id: number) => {
  return await get(`nominas/periodos/${id}`);
};

export const actualizarEstadoPeriodo = async (
  id: number,
  estado: "abierto" | "calculado" | "pagado" | "cerrado"
) => {
  return await patch(`nominas/periodos/${id}/estado`, { estado });
};

// ==========================================
// ASISTENCIAS
// ==========================================

export const registrarAsistencia = async (data: {
  empleado_id: number;
  fecha: string;
  hora_entrada: string;
  hora_salida?: string;
  planta_id?: number;
  actividad_id?: number;
  notas?: string;
}) => {
  return await post("nominas/asistencias", data);
};

export const obtenerAsistenciasPorEmpleado = async (
  empleado_id: number,
  fecha_inicio?: string,
  fecha_fin?: string
) => {
  const params = new URLSearchParams({ empleado_id: String(empleado_id) });
  if (fecha_inicio) params.append("fecha_inicio", fecha_inicio);
  if (fecha_fin) params.append("fecha_fin", fecha_fin);

  return await get(`nominas/asistencias?${params.toString()}`);
};

export const obtenerAsistenciasPorPeriodo = async (periodo_id: number) => {
  return await get(`nominas/asistencias?periodo_id=${periodo_id}`);
};

export const actualizarAsistencia = async (id: number, data: {
  hora_entrada?: string;
  hora_salida?: string;
  horas_trabajadas?: number;
  horas_extra?: number;
  tipo_jornada?: "normal" | "extra" | "doble";
  notas?: string;
}) => {
  return await patch(`nominas/asistencias/${id}`, data);
};

// ==========================================
// NÓMINAS (CÁLCULO Y PAGO)
// ==========================================

export const calcularNomina = async (periodo_id: number, opciones?: {
  incluir_empleados_inactivos?: boolean;
  recalcular?: boolean;
}) => {
  return await post(`nominas/periodos/${periodo_id}/calcular`, opciones || {});
};

export const obtenerNominasPorPeriodo = async (periodo_id: number) => {
  return await get(`nominas/nominas?periodo_id=${periodo_id}`);
};

export const obtenerNominaPorId = async (id: number) => {
  return await get(`nominas/nominas/${id}`);
};

export const obtenerNominasPorEmpleado = async (
  empleado_id: number,
  fecha_inicio?: string,
  fecha_fin?: string
) => {
  const params = new URLSearchParams({ empleado_id: String(empleado_id) });
  if (fecha_inicio) params.append("fecha_inicio", fecha_inicio);
  if (fecha_fin) params.append("fecha_fin", fecha_fin);

  return await get(`nominas/nominas?${params.toString()}`);
};

export const actualizarNomina = async (id: number, data: {
  bonos?: number;
  premios_puntualidad?: number;
  vales_despensa?: number;
  otras_percepciones?: number;
  prestamos?: number;
  faltas?: number;
  otras_deducciones?: number;
}) => {
  return await patch(`nominas/nominas/${id}`, data);
};

export const registrarPagoNomina = async (id: number, data: {
  fecha_pago: string;
  metodo_pago: "efectivo" | "transferencia" | "cheque";
  referencia?: string;
  comprobante_pdf?: string; // Base64
}) => {
  return await post(`nominas/nominas/${id}/pagar`, data);
};

export const cancelarNomina = async (id: number, motivo: string) => {
  return await patch(`nominas/nominas/${id}/cancelar`, { motivo });
};

// ==========================================
// PRÉSTAMOS
// ==========================================

export const crearPrestamoEmpleado = async (data: {
  empleado_id: number;
  monto_total: number;
  monto_quincenal: number;
  fecha_inicio: string;
  numero_pagos_total: number;
  descripcion?: string;
}) => {
  return await post("nominas/prestamos", data);
};

export const obtenerPrestamosPorEmpleado = async (empleado_id: number, activo?: boolean) => {
  const params = new URLSearchParams({ empleado_id: String(empleado_id) });
  if (activo !== undefined) params.append("activo", String(activo));

  return await get(`nominas/prestamos?${params.toString()}`);
};

export const obtenerPrestamoPorId = async (id: number) => {
  return await get(`nominas/prestamos/${id}`);
};

export const actualizarEstadoPrestamo = async (
  id: number,
  estado: "activo" | "liquidado" | "cancelado"
) => {
  return await patch(`nominas/prestamos/${id}/estado`, { estado });
};

export const registrarPagoPrestamo = async (id: number, monto: number, fecha_pago: string) => {
  return await post(`nominas/prestamos/${id}/pagar`, { monto, fecha_pago });
};

// ==========================================
// REPORTES
// ==========================================

export const generarReporteNomina = async (periodo_id: number, formato: "pdf" | "excel") => {
  return await get(`nominas/reportes/nomina/${periodo_id}?formato=${formato}`);
};

export const generarReporteAsistencias = async (
  fecha_inicio: string,
  fecha_fin: string,
  empleado_id?: number
) => {
  const params = new URLSearchParams({ fecha_inicio, fecha_fin });
  if (empleado_id) params.append("empleado_id", String(empleado_id));

  return await get(`nominas/reportes/asistencias?${params.toString()}`);
};

export const generarReporteEmpleados = async (formato: "pdf" | "excel") => {
  return await get(`nominas/reportes/empleados?formato=${formato}`);
};

export const obtenerEstadisticasNomina = async (anio?: number, mes?: number) => {
  const params = new URLSearchParams();
  if (anio) params.append("anio", String(anio));
  if (mes) params.append("mes", String(mes));

  return await get(`nominas/estadisticas?${params.toString()}`);
};
