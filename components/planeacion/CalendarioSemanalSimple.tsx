// components/proyectos/planeacion/CalendarioSemanal.tsx
"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { useState, useCallback, useMemo } from "react";
import {
  diasSemana,
  getDiaNombre,
  getFechaDelDia,
  DiaSemana,
} from "@/utils/api/planeacion";
import { Actividad, Asignacion, Empleado } from "@/types/planeacion";

// ============================================
// TIPOS - Todos los IDs son number
// ============================================

export interface EmpleadoConAsignacion extends Empleado {
  asignacionId: number;
  horasTrabajadas: number;
}

export interface PartidaCalendario {
  id: number;
  numero: string;
  concepto: string;
  unidad: string | number;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface CotizacionCalendario {
  id: number;
  proyectoId: number;
  tieneOrdenCompra: boolean;
  partidas: PartidaCalendario[];
}

interface CalendarioSemanalProps {
  // Info del header
  semana: number;
  anio: number;
  plantaNombre: string;
  proyectoNombre: string;
  fechaInicio: string;
  fechaFin: string;

  // Usuario a cargo
  usuarioACargo?: string;
  usuarioACargoCorreo?: string;

  // Datos
  actividades: Actividad[];
  asignaciones: Asignacion[];
  empleados: Empleado[];
  cotizacion: CotizacionCalendario | null;
  proyectoSemanaId: number;

  // ID de planeación y callback para editar
  planeacionId?: number;
  onEditar?: (planeacionId: number) => void;

  // Callbacks
  onRecargarActividades: () => void;
  onEditarActividad?: (actividad: Actividad) => void;
  onEliminarActividad?: (actividadId: number) => Promise<void>;
  onCrearDesdePartida?: (partida: PartidaCalendario) => void;
  onAsignarEmpleado?: (actividadId: number, empleadoId: number, dia: DiaSemana) => Promise<void>;
  onRemoverEmpleado?: (asignacionId: number) => Promise<void>;
  onActualizarHoras?: (asignacionId: number, horas: number) => Promise<void>;

  // Opciones de visualización
  mostrarPartidas?: boolean;
  mostrarEmpleados?: boolean;
  compacto?: boolean;
  soloLectura?: boolean;
}

// ============================================
// CONSTANTES
// ============================================

const HORAS_MIN = 0;
const HORAS_MAX = 24;
const HORAS_STEP = 0.5;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function CalendarioSemanal({
  semana,
  anio,
  plantaNombre,
  proyectoNombre,
  fechaInicio,
  fechaFin,
  usuarioACargo,
  usuarioACargoCorreo,
  actividades,
  asignaciones,
  empleados = [],
  cotizacion,
  planeacionId,
  onEditar,
  onRecargarActividades,
  onEditarActividad,
  onEliminarActividad,
  onCrearDesdePartida,
  onAsignarEmpleado,
  onRemoverEmpleado,
  onActualizarHoras,
  mostrarPartidas = false,
  mostrarEmpleados = true,
  compacto = false,
  soloLectura = false,
}: CalendarioSemanalProps) {
  // ============================================
  // ESTADO
  // ============================================
  
  const [activeEmpleado, setActiveEmpleado] = useState<Empleado | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [mostrarHorasId, setMostrarHorasId] = useState<number | null>(null);
  const [horasInput, setHorasInput] = useState("");

  // ============================================
  // MEMOS - Optimización de rendimiento
  // ============================================

  // Set de empleados ya asignados para búsqueda O(1)
  const empleadosAsignadosSet = useMemo(() => {
    return new Set(asignaciones.map(asig => asig.empleado_id));
  }, [asignaciones]);

  // Mapa de asignaciones por actividad y día para búsqueda O(1)
  const asignacionesPorCelda = useMemo(() => {
    const mapa = new Map<string, Asignacion[]>();
    
    asignaciones.forEach(asig => {
      const key = `${asig.actividad_id}_${asig.dia_semana}`;
      const existentes = mapa.get(key) || [];
      mapa.set(key, [...existentes, asig]);
    });
    
    return mapa;
  }, [asignaciones]);

  // Mapa de empleados por ID para búsqueda O(1)
  const empleadosPorId = useMemo(() => {
    return new Map(empleados.map(emp => [emp.id, emp]));
  }, [empleados]);

  // ============================================
  // FUNCIONES DE UTILIDAD
  // ============================================

  const estaEmpleadoDisponible = useCallback((empleadoId: number): boolean => {
    return !empleadosAsignadosSet.has(empleadoId);
  }, [empleadosAsignadosSet]);

  const getEmpleadosEnCelda = useCallback((actividadId: number, dia: DiaSemana): EmpleadoConAsignacion[] => {
    if (!actividadId) return [];

    const key = `${actividadId}_${dia}`;
    const asignacionesEnCelda = asignacionesPorCelda.get(key) || [];

    return asignacionesEnCelda
      .map(asignacion => {
        const empleado = empleadosPorId.get(asignacion.empleado_id);
        
        if (!empleado) return null;

        return {
          ...empleado,
          asignacionId: asignacion.id,
          horasTrabajadas: parseFloat(String(asignacion.horas_trabajadas || 0))
        };
      })
      .filter((emp): emp is EmpleadoConAsignacion => emp !== null);
  }, [asignacionesPorCelda, empleadosPorId]);

  const getActividadKey = useCallback((actividad: Actividad, index: number): string => {
    if (actividad.id && actividad.id > 0) {
      return `act_${actividad.id}`;
    }
    return `temp_${index}_${actividad.codigo}`;
  }, []);

  const isCeldaActiva = useCallback((actividad: Actividad, dia: DiaSemana): boolean => {
    const diaActividad = actividad.dia_semana || actividad.diaSemana;
    return diaActividad === dia;
  }, []);

  // ============================================
  // HANDLERS DE DRAG & DROP
  // ============================================

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const empleadoId = event.active.id as number;
    const empleado = empleadosPorId.get(empleadoId) || null;
    setActiveEmpleado(empleado);
  }, [empleadosPorId]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEmpleado(null);

    if (!over || soloLectura || procesando) return;

    const empleadoId = active.id as number;
    const dropId = over.id as string;

    // Parsear el dropId: "act_123_lunes" -> actividadKey="act_123", dia="lunes"
    const lastUnderscoreIndex = dropId.lastIndexOf("_");
    if (lastUnderscoreIndex === -1) {
      console.error("Formato de dropId inválido:", dropId);
      return;
    }

    const dia = dropId.substring(lastUnderscoreIndex + 1) as DiaSemana;
    const actividadKey = dropId.substring(0, lastUnderscoreIndex);

    // Buscar la actividad
    let actividadId: number | null = null;

    for (let i = 0; i < actividades.length; i++) {
      const act = actividades[i];
      if (getActividadKey(act, i) === actividadKey && act.id) {
        actividadId = act.id;
        break;
      }
    }

    if (!actividadId) {
      console.error("Actividad no encontrada para key:", actividadKey);
      return;
    }

    await handleAsignarEmpleado(actividadId, empleadoId, dia);
  }, [soloLectura, procesando, actividades, getActividadKey]);

  // ============================================
  // HANDLERS DE ACCIONES
  // ============================================

  const handleAsignarEmpleado = useCallback(async (
    actividadId: number,
    empleadoId: number,
    dia: DiaSemana
  ) => {
    if (soloLectura || procesando || !onAsignarEmpleado) return;

    // Verificar si ya existe la asignación
    const key = `${actividadId}_${dia}`;
    const asignacionesEnCelda = asignacionesPorCelda.get(key) || [];
    const yaAsignado = asignacionesEnCelda.some(asig => asig.empleado_id === empleadoId);

    if (yaAsignado) {
      alert("Este empleado ya está asignado a esta actividad en este día");
      return;
    }

    setProcesando(true);
    try {
      await onAsignarEmpleado(actividadId, empleadoId, dia);
      onRecargarActividades();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error asignando empleado:", error);
      alert(`Error al asignar empleado: ${mensaje}`);
    } finally {
      setProcesando(false);
    }
  }, [soloLectura, procesando, onAsignarEmpleado, asignacionesPorCelda, onRecargarActividades]);

  const handleRemoverEmpleado = useCallback(async (asignacionId: number) => {
    if (soloLectura || procesando || !onRemoverEmpleado) return;
    if (!confirm("¿Remover esta asignación?")) return;

    setProcesando(true);
    try {
      await onRemoverEmpleado(asignacionId);
      onRecargarActividades();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error removiendo empleado:", error);
      alert(`Error al remover empleado: ${mensaje}`);
    } finally {
      setProcesando(false);
    }
  }, [soloLectura, procesando, onRemoverEmpleado, onRecargarActividades]);

  const handleActualizarHoras = useCallback(async (asignacionId: number) => {
    if (!horasInput || soloLectura || procesando || !onActualizarHoras) return;

    const horas = parseFloat(horasInput);
    if (isNaN(horas) || horas < HORAS_MIN || horas > HORAS_MAX) {
      alert(`Ingresa un número válido de horas (${HORAS_MIN}-${HORAS_MAX})`);
      return;
    }

    setProcesando(true);
    try {
      await onActualizarHoras(asignacionId, horas);
      onRecargarActividades();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error actualizando horas:", error);
      alert(`Error al actualizar horas: ${mensaje}`);
    } finally {
      setProcesando(false);
      setMostrarHorasId(null);
      setHorasInput("");
    }
  }, [horasInput, soloLectura, procesando, onActualizarHoras, onRecargarActividades]);

  const handleEliminarActividad = useCallback(async (actividadId: number) => {
    if (soloLectura || procesando || !onEliminarActividad) return;
    if (!confirm("¿Eliminar esta actividad y todas sus asignaciones?")) return;

    setProcesando(true);
    try {
      await onEliminarActividad(actividadId);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error eliminando actividad:", error);
      alert(`Error al eliminar actividad: ${mensaje}`);
    } finally {
      setProcesando(false);
    }
  }, [soloLectura, procesando, onEliminarActividad]);

  const handleEditarClick = useCallback(() => {
    if (planeacionId && onEditar) {
      onEditar(planeacionId);
    }
  }, [planeacionId, onEditar]);

  // ============================================
  // VALIDACIÓN DE DATOS
  // ============================================

  if (!Array.isArray(actividades)) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
        <div className="text-yellow-800 font-bold mb-2">⚠️ Error en datos</div>
        <div className="text-gray-600">Las actividades no están en el formato esperado</div>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  const tienePartidas = cotizacion?.partidas && cotizacion.partidas.length > 0;
  const mostrarSeccionPartidas = mostrarPartidas && tienePartidas && onCrearDesdePartida;
  const mostrarSeccionEmpleados = mostrarEmpleados && !soloLectura && empleados.length > 0;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={`space-y-4 ${compacto ? "" : "space-y-6"}`}>
        {/* Header Info */}
        <HeaderInfo
          semana={semana}
          anio={anio}
          plantaNombre={plantaNombre}
          proyectoNombre={proyectoNombre}
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          usuarioACargo={usuarioACargo}
          usuarioACargoCorreo={usuarioACargoCorreo}
          actividadesCount={actividades.length}
          asignacionesCount={asignaciones.length}
          planeacionId={planeacionId}
          onEditar={handleEditarClick}
          compacto={compacto}
          soloLectura={soloLectura}
          procesando={procesando}
        />

        {/* Partidas de la Cotización */}
        {mostrarSeccionPartidas && cotizacion && (
          <SeccionPartidas
            partidas={cotizacion.partidas}
            onCrearDesdePartida={onCrearDesdePartida!}
            compacto={compacto}
            soloLectura={soloLectura}
            procesando={procesando}
          />
        )}

        {/* Empleados Disponibles */}
        {mostrarSeccionEmpleados && (
          <SeccionEmpleados
            empleados={empleados}
            estaEmpleadoDisponible={estaEmpleadoDisponible}
            compacto={compacto}
            procesando={procesando}
            soloLectura={soloLectura}
          />
        )}

        {/* Tabla Calendario */}
        <TablaCalendario
          actividades={actividades}
          fechaInicio={fechaInicio}
          getActividadKey={getActividadKey}
          getEmpleadosEnCelda={getEmpleadosEnCelda}
          isCeldaActiva={isCeldaActiva}
          onEditarActividad={onEditarActividad}
          onEliminarActividad={handleEliminarActividad}
          onRemoverEmpleado={handleRemoverEmpleado}
          onActualizarHoras={handleActualizarHoras}
          mostrarHorasId={mostrarHorasId}
          setMostrarHorasId={setMostrarHorasId}
          horasInput={horasInput}
          setHorasInput={setHorasInput}
          compacto={compacto}
          soloLectura={soloLectura}
          procesando={procesando}
          tienePartidas={Boolean(tienePartidas)}
        />

        {/* Instrucciones */}
        {!soloLectura && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-bold">💡 Instrucciones:</span>
              <span>
                Arrastra empleados a las celdas • Haz clic en ✏️ para editar
                actividades • Haz clic en 🗑️ para eliminar actividades
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Overlay de drag */}
      <DragOverlay>
        {activeEmpleado && (
          <div className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-xl font-medium border-2 border-white transform rotate-2">
            <div className="font-bold text-sm">
              {activeEmpleado.nombre.split(" ")[0]}
            </div>
            <div className="text-xs opacity-90">{activeEmpleado.puesto}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

interface HeaderInfoProps {
  semana: number;
  anio: number;
  plantaNombre: string;
  proyectoNombre: string;
  fechaInicio: string;
  fechaFin: string;
  usuarioACargo?: string;
  usuarioACargoCorreo?: string;
  actividadesCount: number;
  asignacionesCount: number;
  planeacionId?: number;
  onEditar?: () => void;
  compacto: boolean;
  soloLectura: boolean;
  procesando: boolean;
}

function HeaderInfo({
  semana,
  anio,
  plantaNombre,
  proyectoNombre,
  fechaInicio,
  fechaFin,
  usuarioACargo,
  usuarioACargoCorreo,
  actividadesCount,
  asignacionesCount,
  planeacionId,
  onEditar,
  compacto,
  soloLectura,
  procesando,
}: HeaderInfoProps) {
  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-MX");
  };

  return (
    <div
      className={`bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg ${
        compacto ? "p-4" : "p-6"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h2 className={`font-bold ${compacto ? "text-lg" : "text-2xl"} mb-1`}>
            Semana {semana} - {anio}
          </h2>
          <p className="text-blue-100 text-sm">
            {plantaNombre} | {proyectoNombre}
          </p>
          <p className="text-blue-200 text-xs mt-1">
            {formatFecha(fechaInicio)} - {formatFecha(fechaFin)}
          </p>
        </div>

        <div className="text-right">
          {planeacionId && onEditar && (
            <button
              onClick={onEditar}
              className="mb-3 px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 font-bold text-sm shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              disabled={soloLectura || procesando}
            >
              <IconoEditar />
              Editar Planeación
            </button>
          )}

          {usuarioACargo && (
            <div className="mb-2 bg-white/10 rounded-lg px-3 py-2">
              <div className="text-xs text-blue-200">Responsable</div>
              <div className="font-semibold text-sm">{usuarioACargo}</div>
              {usuarioACargoCorreo && (
                <div className="text-xs text-blue-200">{usuarioACargoCorreo}</div>
              )}
            </div>
          )}

          <div className="text-sm text-blue-200">
            {actividadesCount} actividades • {asignacionesCount} asignaciones
          </div>
        </div>
      </div>
    </div>
  );
}

interface SeccionPartidasProps {
  partidas: PartidaCalendario[];
  onCrearDesdePartida: (partida: PartidaCalendario) => void;
  compacto: boolean;
  soloLectura: boolean;
  procesando: boolean;
}

function SeccionPartidas({
  partidas,
  onCrearDesdePartida,
  compacto,
  soloLectura,
  procesando,
}: SeccionPartidasProps) {
  const gridClases = compacto
    ? "grid-cols-2 md:grid-cols-4"
    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
      <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
        <IconoDocumento />
        Partidas de la Cotización
      </h3>

      <div className={`grid gap-2 ${gridClases}`}>
        {partidas.map((partida, index) => (
          <button
            key={partida.id || index}
            onClick={() => onCrearDesdePartida(partida)}
            className="bg-white border border-green-200 rounded-lg p-2 text-left hover:bg-green-50 hover:border-green-300 transition-colors group disabled:opacity-50"
            disabled={soloLectura || procesando}
          >
            <div className="font-semibold text-green-800 text-sm">
              {partida.numero}
            </div>
            <div className="text-xs text-gray-600 mt-1 line-clamp-1">
              {partida.concepto}
            </div>
            {!compacto && (
              <div className="text-xs text-green-600 mt-1">
                Click para crear →
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

interface SeccionEmpleadosProps {
  empleados: Empleado[];
  estaEmpleadoDisponible: (id: number) => boolean;
  compacto: boolean;
  procesando: boolean;
  soloLectura: boolean;
}

function SeccionEmpleados({
  empleados,
  estaEmpleadoDisponible,
  compacto,
  procesando,
  soloLectura,
}: SeccionEmpleadosProps) {
  const gridClases = compacto
    ? "grid-cols-3 md:grid-cols-6"
    : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5";

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 rounded-lg p-4">
      <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
        <IconoUsuarios />
        Empleados - Arrastra a las celdas
        {procesando && (
          <span className="text-xs text-gray-600">(procesando...)</span>
        )}
      </h3>

      <div className={`grid gap-2 ${gridClases}`}>
        {empleados.map((empleado) => (
          <EmpleadoDraggable
            key={empleado.id}
            empleado={empleado}
            estaDisponible={estaEmpleadoDisponible(empleado.id)}
            compacto={compacto}
            disabled={procesando || soloLectura}
          />
        ))}
      </div>
    </div>
  );
}

interface TablaCalendarioProps {
  actividades: Actividad[];
  fechaInicio: string;
  getActividadKey: (actividad: Actividad, index: number) => string;
  getEmpleadosEnCelda: (actividadId: number, dia: DiaSemana) => EmpleadoConAsignacion[];
  isCeldaActiva: (actividad: Actividad, dia: DiaSemana) => boolean;
  onEditarActividad?: (actividad: Actividad) => void;
  onEliminarActividad: (actividadId: number) => Promise<void>;
  onRemoverEmpleado: (asignacionId: number) => void;
  onActualizarHoras: (asignacionId: number) => void;
  mostrarHorasId: number | null;
  setMostrarHorasId: (id: number | null) => void;
  horasInput: string;
  setHorasInput: (horas: string) => void;
  compacto: boolean;
  soloLectura: boolean;
  procesando: boolean;
  tienePartidas: boolean;
}

function TablaCalendario({
  actividades,
  fechaInicio,
  getActividadKey,
  getEmpleadosEnCelda,
  isCeldaActiva,
  onEditarActividad,
  onEliminarActividad,
  onRemoverEmpleado,
  onActualizarHoras,
  mostrarHorasId,
  setMostrarHorasId,
  horasInput,
  setHorasInput,
  compacto,
  soloLectura,
  procesando,
  tienePartidas,
}: TablaCalendarioProps) {
  const formatFechaDia = (dia: DiaSemana) => {
    return new Date(getFechaDelDia(fechaInicio, dia)).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="overflow-x-auto border border-gray-300 rounded-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-red-600 text-white">
            <th
              className={`border border-gray-400 px-3 py-2 text-left font-bold ${
                compacto ? "w-40" : "w-64"
              }`}
            >
              Actividades
            </th>
            {diasSemana.map((dia) => (
              <th
                key={dia}
                className={`border border-gray-400 px-2 py-2 text-center font-bold ${
                  compacto ? "min-w-[100px]" : "min-w-[150px]"
                }`}
              >
                <div className={compacto ? "text-xs" : "text-sm"}>
                  {getDiaNombre(dia)}
                </div>
                <div className="text-xs font-normal mt-1 opacity-90">
                  {formatFechaDia(dia)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {actividades.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="border border-gray-300 px-4 py-8 text-center text-gray-500"
              >
                <p className="text-sm">No hay actividades programadas</p>
                <p className="text-xs text-gray-400 mt-1">
                  {tienePartidas
                    ? "Selecciona una partida para crear una actividad"
                    : "Agrega actividades para comenzar"}
                </p>
              </td>
            </tr>
          ) : (
            actividades.map((actividad, index) => {
              const actividadKey = getActividadKey(actividad, index);
              const esTemporal = actividadKey.startsWith("temp_");

              return (
                <FilaActividad
                  key={actividadKey}
                  actividad={actividad}
                  actividadKey={actividadKey}
                  esTemporal={esTemporal}
                  getEmpleadosEnCelda={getEmpleadosEnCelda}
                  isCeldaActiva={isCeldaActiva}
                  onEditarActividad={onEditarActividad}
                  onEliminarActividad={onEliminarActividad}
                  onRemoverEmpleado={onRemoverEmpleado}
                  onActualizarHoras={onActualizarHoras}
                  mostrarHorasId={mostrarHorasId}
                  setMostrarHorasId={setMostrarHorasId}
                  horasInput={horasInput}
                  setHorasInput={setHorasInput}
                  compacto={compacto}
                  soloLectura={soloLectura}
                  procesando={procesando}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

interface FilaActividadProps {
  actividad: Actividad;
  actividadKey: string;
  esTemporal: boolean;
  getEmpleadosEnCelda: (actividadId: number, dia: DiaSemana) => EmpleadoConAsignacion[];
  isCeldaActiva: (actividad: Actividad, dia: DiaSemana) => boolean;
  onEditarActividad?: (actividad: Actividad) => void;
  onEliminarActividad: (actividadId: number) => Promise<void>;
  onRemoverEmpleado: (asignacionId: number) => void;
  onActualizarHoras: (asignacionId: number) => void;
  mostrarHorasId: number | null;
  setMostrarHorasId: (id: number | null) => void;
  horasInput: string;
  setHorasInput: (horas: string) => void;
  compacto: boolean;
  soloLectura: boolean;
  procesando: boolean;
}

function FilaActividad({
  actividad,
  actividadKey,
  esTemporal,
  getEmpleadosEnCelda,
  isCeldaActiva,
  onEditarActividad,
  onEliminarActividad,
  onRemoverEmpleado,
  onActualizarHoras,
  mostrarHorasId,
  setMostrarHorasId,
  horasInput,
  setHorasInput,
  compacto,
  soloLectura,
  procesando,
}: FilaActividadProps) {
  const handleEditar = () => {
    if (onEditarActividad) {
      onEditarActividad(actividad);
    }
  };

  const handleEliminar = () => {
    if (actividad.id) {
      onEliminarActividad(actividad.id);
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="border border-gray-300 px-3 py-2">
        <div
          className={`font-semibold ${compacto ? "text-xs" : "text-sm"} ${
            esTemporal ? "text-orange-600" : "text-blue-700"
          }`}
        >
          {actividad.codigo}
          {esTemporal && (
            <span className="text-xs ml-2 bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
              Temporal
            </span>
          )}
        </div>
        <div
          className={`text-gray-600 mt-1 ${
            compacto ? "text-xs line-clamp-2" : "text-xs"
          }`}
        >
          {actividad.nombre}
        </div>
        {actividad.notas && (
          <div className="text-xs text-gray-500 mt-1 italic">
            📝 {actividad.notas}
          </div>
        )}
        {!soloLectura && actividad.id && (
          <div className="flex gap-2 mt-2">
            {onEditarActividad && (
              <button
                onClick={handleEditar}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50"
                disabled={procesando}
              >
                ✏️ Editar
              </button>
            )}
            <button
              onClick={handleEliminar}
              className="text-xs text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
              disabled={procesando}
            >
              🗑️ Eliminar
            </button>
          </div>
        )}
      </td>

      {diasSemana.map((dia) => {
        const empleadosEnCelda = actividad.id
          ? getEmpleadosEnCelda(actividad.id, dia)
          : [];

        return (
          <CeldaDroppable
            key={`${actividadKey}_${dia}`}
            id={`${actividadKey}_${dia}`}
            empleados={empleadosEnCelda}
            esActivo={isCeldaActiva(actividad, dia)}
            esTemporal={esTemporal}
            onRemover={onRemoverEmpleado}
            onActualizarHoras={onActualizarHoras}
            mostrarHorasId={mostrarHorasId}
            setMostrarHorasId={setMostrarHorasId}
            horasInput={horasInput}
            setHorasInput={setHorasInput}
            compacto={compacto}
            soloLectura={soloLectura || esTemporal}
            disabled={procesando}
          />
        );
      })}
    </tr>
  );
}

interface EmpleadoDraggableProps {
  empleado: Empleado;
  estaDisponible: boolean;
  compacto: boolean;
  disabled: boolean;
}

function EmpleadoDraggable({
  empleado,
  estaDisponible,
  compacto,
  disabled,
}: EmpleadoDraggableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: empleado.id,
    disabled,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const colorClases = estaDisponible
    ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
    : "bg-red-100 text-red-800 border-red-300 hover:bg-red-200";

  const sizeClases = compacto ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm";
  const indicadorSize = compacto ? "w-2 h-2" : "w-3 h-3";

  const nombreCorto = `${empleado.nombre} ${empleado.apellidoPaterno?.charAt(0) || ""}.`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        ${colorClases}
        ${sizeClases}
        rounded-lg font-medium border-2 transition-all select-none text-center relative
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}
        ${isDragging ? "opacity-50 scale-95 shadow-lg" : "hover:shadow-md hover:scale-105"}
      `}
    >
      <div
        className={`absolute -top-1 -right-1 ${indicadorSize} rounded-full border-2 border-white ${
          estaDisponible ? "bg-green-500" : "bg-red-500"
        }`}
      />

      <div className="font-semibold truncate">{nombreCorto}</div>
      {!compacto && (
        <div className="text-xs opacity-75 mt-1">{empleado.puesto}</div>
      )}
    </div>
  );
}

interface CeldaDroppableProps {
  id: string;
  empleados: EmpleadoConAsignacion[];
  esActivo: boolean;
  esTemporal: boolean;
  onRemover: (asignacionId: number) => void;
  onActualizarHoras: (asignacionId: number) => void;
  mostrarHorasId: number | null;
  setMostrarHorasId: (id: number | null) => void;
  horasInput: string;
  setHorasInput: (horas: string) => void;
  compacto: boolean;
  soloLectura: boolean;
  disabled: boolean;
}

function CeldaDroppable({
  id,
  empleados,
  esActivo,
  esTemporal,
  onRemover,
  onActualizarHoras,
  mostrarHorasId,
  setMostrarHorasId,
  horasInput,
  setHorasInput,
  compacto,
  soloLectura,
  disabled,
}: CeldaDroppableProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: disabled || soloLectura || esTemporal,
  });

  const bgClases = (() => {
    if (isOver && !soloLectura && !disabled && !esTemporal) {
      return "bg-green-100 ring-2 ring-green-400";
    }
    if (esTemporal) return "bg-orange-50";
    if (esActivo) return "bg-blue-50";
    return "bg-white";
  })();

  const minHeight = compacto ? "min-h-[80px]" : "min-h-[100px]";
  const maxHeight = compacto ? "max-h-[70px]" : "max-h-[90px]";

  const handleRemover = (e: React.MouseEvent, asignacionId: number) => {
    e.stopPropagation();
    onRemover(asignacionId);
  };

  const handleMostrarHoras = (e: React.MouseEvent, emp: EmpleadoConAsignacion) => {
    e.stopPropagation();
    setMostrarHorasId(emp.asignacionId);
    setHorasInput(emp.horasTrabajadas.toString());
  };

  const handleGuardarHoras = (e: React.MouseEvent, asignacionId: number) => {
    e.stopPropagation();
    onActualizarHoras(asignacionId);
  };

  const handleCancelarHoras = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMostrarHorasId(null);
    setHorasInput("");
  };

  return (
    <td
      ref={setNodeRef}
      className={`border border-gray-300 px-1 py-1 align-top transition-colors ${bgClases}`}
    >
      <div className={`flex flex-col ${minHeight}`}>
        {empleados.length > 0 && (
          <div className="text-xs text-gray-500 mb-1 text-center">
            {empleados.length} emp.
          </div>
        )}

        <div
          className={`space-y-1 flex-1 overflow-y-auto ${maxHeight} ${
            empleados.length === 0 ? "flex items-center justify-center" : ""
          }`}
        >
          {empleados.length === 0 ? (
            <ContenidoCeldaVacia
              esTemporal={esTemporal}
              isOver={isOver}
              soloLectura={soloLectura}
              disabled={disabled}
            />
          ) : (
            empleados.map((emp) => (
              <TarjetaEmpleado
                key={emp.asignacionId}
                empleado={emp}
                mostrarInputHoras={mostrarHorasId === emp.asignacionId}
                horasInput={horasInput}
                setHorasInput={setHorasInput}
                onRemover={handleRemover}
                onMostrarHoras={handleMostrarHoras}
                onGuardarHoras={handleGuardarHoras}
                onCancelarHoras={handleCancelarHoras}
                compacto={compacto}
                soloLectura={soloLectura}
                disabled={disabled}
              />
            ))
          )}
        </div>

        {esActivo && !compacto && !esTemporal && (
          <div className="text-xs text-blue-600 text-center mt-1">
            ★ Día principal
          </div>
        )}
      </div>
    </td>
  );
}

interface ContenidoCeldaVaciaProps {
  esTemporal: boolean;
  isOver: boolean;
  soloLectura: boolean;
  disabled: boolean;
}

function ContenidoCeldaVacia({
  esTemporal,
  isOver,
  soloLectura,
  disabled,
}: ContenidoCeldaVaciaProps) {
  if (esTemporal) {
    return (
      <div className="text-center text-orange-500 text-xs">
        💾 Guarda primero
      </div>
    );
  }

  if (isOver && !soloLectura && !disabled) {
    return (
      <div className="text-center text-gray-400 text-xs">⬇️ Soltar aquí</div>
    );
  }

  return <div className="text-center text-gray-400 text-xs">—</div>;
}

interface TarjetaEmpleadoProps {
  empleado: EmpleadoConAsignacion;
  mostrarInputHoras: boolean;
  horasInput: string;
  setHorasInput: (horas: string) => void;
  onRemover: (e: React.MouseEvent, asignacionId: number) => void;
  onMostrarHoras: (e: React.MouseEvent, emp: EmpleadoConAsignacion) => void;
  onGuardarHoras: (e: React.MouseEvent, asignacionId: number) => void;
  onCancelarHoras: (e: React.MouseEvent) => void;
  compacto: boolean;
  soloLectura: boolean;
  disabled: boolean;
}

function TarjetaEmpleado({
  empleado,
  mostrarInputHoras,
  horasInput,
  setHorasInput,
  onRemover,
  onMostrarHoras,
  onGuardarHoras,
  onCancelarHoras,
  compacto,
  soloLectura,
  disabled,
}: TarjetaEmpleadoProps) {
  const nombreCorto = `${empleado.nombre} ${empleado.apellidoPaterno?.charAt(0) || ""}.`;

  return (
    <div
      className={`bg-blue-100 border border-blue-200 text-blue-800 rounded text-xs group hover:bg-blue-200 transition-colors ${
        compacto ? "px-1 py-0.5" : "px-2 py-1"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate text-xs">{nombreCorto}</div>
          <div className="text-xs text-gray-600 mt-1">
            {empleado.horasTrabajadas > 0 ? (
              <span className="flex items-center gap-1">
                <span className="font-bold">🕒 {empleado.horasTrabajadas}h</span>
                {!soloLectura && !disabled && (
                  <button
                    onClick={(e) => onMostrarHoras(e, empleado)}
                    className="text-xs text-blue-600 hover:text-blue-800 ml-1"
                    disabled={disabled}
                  >
                    ✏️
                  </button>
                )}
              </span>
            ) : (
              <span className="text-gray-500">Sin horas</span>
            )}
          </div>
        </div>

        {!soloLectura && !disabled && (
          <button
            onClick={(e) => onRemover(e, empleado.asignacionId)}
            className="ml-1 text-red-500 hover:text-red-700 opacity-70 hover:opacity-100"
            disabled={disabled}
          >
            ×
          </button>
        )}
      </div>

      {mostrarInputHoras && (
        <div className="mt-2 p-1 bg-white rounded border border-gray-300">
          <div className="flex gap-1">
            <input
              type="number"
              step={HORAS_STEP}
              min={HORAS_MIN}
              max={HORAS_MAX}
              value={horasInput}
              onChange={(e) => setHorasInput(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="Horas trabajadas"
              autoFocus
              disabled={disabled}
            />
            <button
              onClick={(e) => onGuardarHoras(e, empleado.asignacionId)}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              disabled={disabled}
            >
              ✓
            </button>
            <button
              onClick={onCancelarHoras}
              className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
              disabled={disabled}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// ICONOS
// ============================================

function IconoEditar() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function IconoDocumento() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function IconoUsuarios() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}
