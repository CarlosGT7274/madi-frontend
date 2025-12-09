// components/proyectos/planeacion/PlaneacionForm.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import CalendarioSemanal, {
  PartidaCalendario,
  CotizacionCalendario,
} from "@/components/planeacion/CalendarioSemanalSimple";
import ContadorTiempo from "@/components/planeacion/ContadorTiempo";
import { usersAll } from "@/utils/api/users";
import { readOneRol } from "@/utils/api/roles";
import {
  obtenerPlantas,
  obtenerLevantamientosPorPlanta,
  obtenerProyectosPorLevantamiento,
  obtenerCotizacionesPorProyecto,
} from "@/utils/api/ing-proyectos";
import {
  crearPlaneacion,
  obtenerPlaneacion,
  actualizarPlaneacion,
  enviarParaAprobacion,
  puedeEditarPlaneacion,
  aprobarPlaneacion,
  rechazarPlaneacion,
  agregarActividad,
  actualizarActividad,
  eliminarActividad,
  agregarAsignacion,
  eliminarAsignacion,
  actualizarHorasTrabajadas,
  Planeacion,
  CrearPlaneacionDto,
  ActualizarPlaneacionDto,
  ActividadDto,
  AsignacionDto,
  AprobarPlaneacionDto,
  RechazarPlaneacionDto,
  ActualizarHorasDto,
  DiaSemana,
  EstadoPlaneacion,
} from "@/utils/api/planeacion";

import {
  Actividad,
  Empleado,
  Asignacion,
  Cotizacion,
  Planta,
  Levantamiento,
} from "@/types/planeacion";

import { toast } from "react-toastify";

// ============================================
// TIPOS - Todos los IDs son number
// ============================================

// Tipo para las partidas que vienen de la cotización (del backend)
interface PartidaCotizacionBackend {
  id?: number;
  numero_partida?: number | string;
  descripcion?: string;
  unidad?: string | number;
  cantidad?: number;
  precioUnitario?: number;
  total?: number;
}

// Tipo para el estado de asignación
type EstadoAsignacion = "asignado" | "en_progreso" | "completado" | "cancelado";

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol_id: number;
}

interface Proyecto {
  id: number;
  nombre: string;
}

interface PlaneacionFormProps {
  mode: "create" | "view";
  planeacionId?: number;
  userRole: string;
  userId: number;
  userName: string;
  userEmail: string;
}

interface FechasSemana {
  inicio: string;
  fin: string;
}

// ============================================
// CONSTANTES
// ============================================

const SEMANAS_POR_ANIO = 52;
const DIAS_POR_SEMANA = 7;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const ESTADO_COLORES: Record<EstadoPlaneacion, string> = {
  borrador: "bg-gray-100 text-gray-800 border-gray-300",
  enviada: "bg-blue-100 text-blue-800 border-blue-300",
  aprobada: "bg-green-100 text-green-800 border-green-300",
  rechazada: "bg-red-100 text-red-800 border-red-300",
};

const ESTADO_ICONOS: Record<EstadoPlaneacion, string> = {
  borrador: "📝",
  enviada: "📤",
  aprobada: "✅",
  rechazada: "❌",
};

// ============================================
// CACHE DE ROLES
// ============================================

const rolesCache = new Map<number, string>();

async function obtenerNombreRol(rolId: number): Promise<string> {
  const cached = rolesCache.get(rolId);
  if (cached) return cached;

  try {
    const rol = await readOneRol(rolId);
    const nombreRol = rol?.nombre || "Sin rol";
    rolesCache.set(rolId, nombreRol);
    return nombreRol;
  } catch (error) {
    console.error(`Error obteniendo rol ${rolId}:`, error);
    return "Sin rol";
  }
}

// ============================================
// UTILIDADES
// ============================================

function getCurrentWeek(): number {
  const now = new Date();
  const target = new Date(now.valueOf());
  const dayNr = (now.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

function calcularFechasSemana(semana: number, anio: number): FechasSemana {
  const firstDayOfYear = new Date(anio, 0, 1);
  const daysOffset = (semana - 1) * DIAS_POR_SEMANA;
  const weekStart = new Date(firstDayOfYear.getTime() + daysOffset * MS_POR_DIA);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return {
    inicio: weekStart.toISOString().split("T")[0],
    fin: weekEnd.toISOString().split("T")[0],
  };
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-MX");
}

function formatearFechaHora(fecha: string): string {
  return new Date(fecha).toLocaleString("es-MX");
}

function extraerMensajeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Error desconocido";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function PlaneacionForm({
  mode,
  planeacionId,
  userRole,
  userId,
}: PlaneacionFormProps) {
  const router = useRouter();
  const anioActual = useMemo(() => new Date().getFullYear(), []);

  // ============================================
  // ESTADO
  // ============================================

  // Selectores
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(getCurrentWeek);
  const [plantaSeleccionada, setPlantaSeleccionada] = useState<number | null>(null);
  const [plantaNombre, setPlantaNombre] = useState("");
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<number | null>(null);
  const [proyectoNombre, setProyectoNombre] = useState("");

  // Datos del calendario
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);

  // Planeación existente
  const [planeacion, setPlaneacion] = useState<Planeacion | null>(null);

  // Datos para selectores
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [proyectosDisponibles, setProyectosDisponibles] = useState<Proyecto[]>([]);

  // UI
  const [cargando, setCargando] = useState(mode === "view");
  const [comentariosAdmin, setComentariosAdmin] = useState("");
  const [guardando, setGuardando] = useState(false);

  // ============================================
  // VALORES COMPUTADOS
  // ============================================

  const fechas = useMemo(
    () => calcularFechasSemana(semanaSeleccionada, anioActual),
    [semanaSeleccionada, anioActual]
  );

  const esAdmin = userRole === "administrador";

  const puedeEditar = useMemo(() => {
    if (mode === "create") return true;
    if (!planeacion) return false;
    return puedeEditarPlaneacion(planeacion, userId, esAdmin);
  }, [mode, planeacion, userId, esAdmin]);

  const puedeAprobar = useMemo(() => {
    return planeacion && esAdmin && planeacion.estado === "enviada";
  }, [planeacion, esAdmin]);

  const cotizacionParaCalendario = useMemo((): CotizacionCalendario | null => {
    if (!cotizacion) return null;

    return {
      id: cotizacion.id,
      proyectoId: cotizacion.proyecto_id || proyectoSeleccionado || 0,
      tieneOrdenCompra: cotizacion.tiene_orden_compra || false,
      partidas: (cotizacion.partidas || []).map((partida: PartidaCotizacionBackend) => ({
        id: partida.id || 0,
        numero: partida.numero_partida?.toString() || "",
        concepto: partida.descripcion || "",
        unidad: partida.unidad || "",
        cantidad: partida.cantidad || 0,
        precioUnitario: partida.precioUnitario || 0,
        total: partida.total || 0,
      })),
    };
  }, [cotizacion, proyectoSeleccionado]);

  // ============================================
  // EFECTOS - CARGA DE DATOS
  // ============================================

  // Cargar empleados
  const cargarEmpleados = useCallback(async () => {
    try {
      const usuariosData: Usuario[] = await usersAll();

      const empleadosMapeados = await Promise.all(
        usuariosData.map(async (usuario) => {
          const nombreCompleto = usuario.nombre.split(" ");
          const nombreRol = await obtenerNombreRol(usuario.rol_id);

          return {
            id: usuario.id,
            nombre: nombreCompleto[0] || "",
            apellidoPaterno: nombreCompleto[1] || "",
            apellidoMaterno: nombreCompleto[2] || "",
            puesto: nombreRol,
            rolId: usuario.rol_id,
            telefono: "",
            email: usuario.correo,
            activo: true,
            fechaIngreso: new Date().toISOString(),
            fechaCreacion: new Date().toISOString(),
          };
        })
      );

      setEmpleados(empleadosMapeados);
    } catch (error) {
      console.error("Error cargando empleados:", error);
      toast.error("Error al cargar empleados");
    }
  }, []);

  useEffect(() => {
    cargarEmpleados();
  }, [cargarEmpleados]);

  // Cargar plantas
  useEffect(() => {
    const cargarPlantas = async () => {
      try {
        const plantasData = await obtenerPlantas();
        setPlantas(plantasData);
      } catch (error) {
        console.error("Error cargando plantas:", error);
        toast.error("Error al cargar plantas");
      }
    };
    cargarPlantas();
  }, []);

  // Cargar planeación existente
  useEffect(() => {
    if (mode !== "view" || !planeacionId) {
      setCargando(false);
      return;
    }

    const cargarPlaneacion = async () => {
      try {
        const plan = await obtenerPlaneacion(planeacionId);
        if (plan) {
          setPlaneacion(plan);
          setSemanaSeleccionada(plan.semana);
          setPlantaSeleccionada(plan.planta_id);
          setPlantaNombre(plan.planta_nombre);
          setProyectoSeleccionado(plan.proyecto_id);
          setProyectoNombre(plan.proyecto_nombre);
          setActividades(plan.actividades);
          setAsignaciones(plan.asignaciones);
          setComentariosAdmin(plan.comentarios_aprobacion || "");
        }
      } catch (error) {
        console.error("Error cargando planeación:", error);
        toast.error("Error al cargar la planeación");
      } finally {
        setCargando(false);
      }
    };

    cargarPlaneacion();
  }, [mode, planeacionId]);

  // Cargar proyectos cuando se selecciona planta
  useEffect(() => {
    if (!plantaSeleccionada) {
      setProyectosDisponibles([]);
      return;
    }

    const cargarProyectos = async () => {
      try {
        const levantamientos: Levantamiento[] = await obtenerLevantamientosPorPlanta(
          plantaSeleccionada
        );

        const todosLosProyectos: Proyecto[] = [];
        for (const lev of levantamientos) {
          const proyectos = await obtenerProyectosPorLevantamiento(lev.id);
          todosLosProyectos.push(...proyectos);
        }

        const proyectosConOrden: Proyecto[] = [];
        for (const proy of todosLosProyectos) {
          const cotizaciones: Cotizacion[] = await obtenerCotizacionesPorProyecto(proy.id);
          const tieneOrden = cotizaciones.some((cot: Cotizacion) => cot.tiene_orden_compra);
          if (tieneOrden) {
            proyectosConOrden.push(proy);
          }
        }

        setProyectosDisponibles(proyectosConOrden);

        // Auto-seleccionar si solo hay uno
        if (mode === "create" && proyectosConOrden.length === 1 && !proyectoSeleccionado) {
          setProyectoSeleccionado(proyectosConOrden[0].id);
          setProyectoNombre(proyectosConOrden[0].nombre);
        }
      } catch (error) {
        console.error("Error cargando proyectos:", error);
      }
    };

    cargarProyectos();
  }, [plantaSeleccionada, mode, proyectoSeleccionado]);

  // Cargar cotización y actividades
  useEffect(() => {
    if (!proyectoSeleccionado) return;

    const cargarCotizacion = async () => {
      try {
        const cotizaciones: Cotizacion[] = await obtenerCotizacionesPorProyecto(proyectoSeleccionado);
        const cotizConOrden = cotizaciones.find((c: Cotizacion) => c.tiene_orden_compra);

        if (cotizConOrden) {
          setCotizacion(cotizConOrden);

          // Cargar partidas como actividades base (solo en modo create)
          if (cotizConOrden.partidas?.length && mode === "create") {
            const actividadesDesdePartidas: Actividad[] = cotizConOrden.partidas.map(
              (partida: PartidaCotizacionBackend, index: number) => ({
                id: Date.now() + index,
                codigo: partida.numero_partida?.toString() || `P${index + 1}`,
                nombre: partida.descripcion || `Partida ${partida.numero_partida}`,
                diaSemana: "lunes" as DiaSemana,
                dia_semana: "lunes" as DiaSemana,
                cantidad_empleados_requeridos: 0,
                notas: `${partida.unidad} - Cantidad: ${partida.cantidad}`,
                fecha_creacion: new Date().toISOString(),
                fecha_modificacion: new Date().toISOString(),
              })
            );

            setActividades(actividadesDesdePartidas);
          }
        }
      } catch (error) {
        console.error("Error cargando cotización:", error);
      }
    };

    cargarCotizacion();
  }, [proyectoSeleccionado, mode]);

  // ============================================
  // HANDLERS - ASIGNACIONES
  // ============================================

  const handleAsignarEmpleado = useCallback(
    async (actividadId: number, empleadoId: number, dia: DiaSemana): Promise<void> => {
      if (!puedeEditar || guardando) return;

      // Verificar duplicado
      const yaAsignado = asignaciones.some(
        (asig: Asignacion) =>
          asig.actividad_id === actividadId &&
          asig.empleado_id === empleadoId &&
          asig.dia_semana === dia
      );

      if (yaAsignado) {
        toast.warning("Este empleado ya está asignado a esta actividad en este día");
        return;
      }

      const empleado = empleados.find((e: Empleado) => e.id === empleadoId);
      if (!empleado) {
        toast.error("Empleado no encontrado");
        return;
      }

      const nombreCompleto = `${empleado.nombre} ${empleado.apellidoPaterno}`;

      if (mode === "create") {
        // Guardar localmente
        const nuevaAsignacion: Asignacion = {
          id: Date.now(),
          actividad_id: actividadId,
          empleado_id: empleadoId,
          empleado_nombre: nombreCompleto,
          dia_semana: dia,
          estado: "asignado",
          horas_trabajadas: 0,
        };

        setAsignaciones((prev) => [...prev, nuevaAsignacion]);
        toast.success("Empleado asignado (se guardará al crear la planeación)");
      } else if (planeacion) {
        // API call
        setGuardando(true);
        try {
          const dto: AsignacionDto = {
            actividad_id: actividadId,
            empleado_id: empleadoId,
            empleado_nombre: nombreCompleto,
            dia_semana: dia,
            estado: "asignado",
            horas_trabajadas: 0,
          };

          const nuevaAsignacion = await agregarAsignacion(actividadId, dto);
          setAsignaciones((prev) => [...prev, nuevaAsignacion]);
          toast.success("Empleado asignado exitosamente");
        } catch (error) {
          console.error("Error asignando empleado:", error);
          toast.error(`Error: ${extraerMensajeError(error)}`);
        } finally {
          setGuardando(false);
        }
      }
    },
    [puedeEditar, guardando, asignaciones, empleados, mode, planeacion]
  );

  const handleRemoverEmpleado = useCallback(
    async (asignacionId: number): Promise<void> => {
      if (!puedeEditar || guardando) return;

      if (mode === "create") {
        setAsignaciones((prev: Asignacion[]) => prev.filter((a: Asignacion) => a.id !== asignacionId));
        toast.success("Asignación removida");
      } else {
        setGuardando(true);
        try {
          await eliminarAsignacion(asignacionId);
          setAsignaciones((prev: Asignacion[]) => prev.filter((a: Asignacion) => a.id !== asignacionId));
          toast.success("Asignación removida exitosamente");
        } catch (error) {
          console.error("Error removiendo asignación:", error);
          toast.error(`Error: ${extraerMensajeError(error)}`);
        } finally {
          setGuardando(false);
        }
      }
    },
    [puedeEditar, guardando, mode]
  );

  const handleActualizarHoras = useCallback(
    async (asignacionId: number, horas: number): Promise<void> => {
      setGuardando(true);
      try {
        const dto: ActualizarHorasDto = { horas_trabajadas: horas };
        await actualizarHorasTrabajadas(asignacionId, dto);

        setAsignaciones((prev: Asignacion[]) =>
          prev.map((asig: Asignacion) =>
            asig.id === asignacionId ? { ...asig, horas_trabajadas: horas } : asig
          )
        );
        toast.success("Horas actualizadas");
      } catch (error) {
        console.error("Error actualizando horas:", error);
        toast.error(`Error: ${extraerMensajeError(error)}`);
      } finally {
        setGuardando(false);
      }
    },
    []
  );

  // ============================================
  // HANDLERS - ACTIVIDADES
  // ============================================

  const handleAgregarActividad = useCallback(async () => {
    if (!planeacion || !puedeEditar || guardando) return;

    setGuardando(true);
    try {
      const nuevaActividad: ActividadDto = {
        codigo: `ACT-${Date.now().toString().slice(-4)}`,
        nombre: "Nueva actividad",
        dia_semana: "lunes",
        notas: "",
      };

      const actividadCreada = await agregarActividad(planeacion.id, nuevaActividad);
      setActividades((prev) => [...prev, actividadCreada]);
      toast.success("Actividad agregada exitosamente");
    } catch (error) {
      console.error("Error agregando actividad:", error);
      toast.error(`Error: ${extraerMensajeError(error)}`);
    } finally {
      setGuardando(false);
    }
  }, [planeacion, puedeEditar, guardando]);

  const handleActualizarActividad = useCallback(
    async (actividadId: number, cambios: Partial<ActividadDto>) => {
      if (!puedeEditar || guardando) return;

      setGuardando(true);
      try {
        await actualizarActividad(actividadId, cambios);
        setActividades((prev: Actividad[]) =>
          prev.map((act: Actividad) => (act.id === actividadId ? { ...act, ...cambios } : act))
        );
        toast.success("Actividad actualizada");
      } catch (error) {
        console.error("Error actualizando actividad:", error);
        toast.error(`Error: ${extraerMensajeError(error)}`);
      } finally {
        setGuardando(false);
      }
    },
    [puedeEditar, guardando]
  );

  const handleEliminarActividad = useCallback(
    async (actividadId: number) => {
      if (!puedeEditar || guardando) return;

      setGuardando(true);
      try {
        await eliminarActividad(actividadId);
        setActividades((prev: Actividad[]) => prev.filter((act: Actividad) => act.id !== actividadId));
        setAsignaciones((prev: Asignacion[]) => prev.filter((asig: Asignacion) => asig.actividad_id !== actividadId));
        toast.success("Actividad eliminada exitosamente");
      } catch (error) {
        console.error("Error eliminando actividad:", error);
        toast.error(`Error: ${extraerMensajeError(error)}`);
      } finally {
        setGuardando(false);
      }
    },
    [puedeEditar, guardando]
  );

  const handleCrearDesdePartida = useCallback(
    async (partida: PartidaCalendario) => {
      if (!planeacion || !puedeEditar) return;

      try {
        const nuevaActividad: ActividadDto = {
          codigo: partida.numero,
          nombre: partida.concepto,
          dia_semana: "lunes",
          notas: `${partida.unidad} - ${partida.cantidad} unidades`,
        };

        const actividadCreada = await agregarActividad(planeacion.id, nuevaActividad);
        setActividades((prev) => [...prev, actividadCreada]);
        toast.success("Actividad creada desde partida");
      } catch (error) {
        toast.error(`Error: ${extraerMensajeError(error)}`);
      }
    },
    [planeacion, puedeEditar]
  );

  const handleEditarActividad = useCallback(
    (actividad: Actividad) => {
      const nuevoNombre = prompt("Nuevo nombre de la actividad:", actividad.nombre);
      if (nuevoNombre && nuevoNombre !== actividad.nombre && actividad.id) {
        handleActualizarActividad(actividad.id, { nombre: nuevoNombre });
      }
    },
    [handleActualizarActividad]
  );

  // ============================================
  // HANDLERS - GUARDADO Y ENVÍO
  // ============================================

  const handleGuardarBorrador = useCallback(async () => {
    if (!plantaSeleccionada || !proyectoSeleccionado) {
      toast.warning("Selecciona una planta y un proyecto");
      return;
    }

    if (actividades.length === 0) {
      toast.warning("Debes agregar al menos una actividad");
      return;
    }

    setGuardando(true);
    try {
      if (mode === "create") {
        const activitiesDto: ActividadDto[] = actividades.map((act: Actividad) => {
          const asignacionesActividad = asignaciones.filter(
            (asig: Asignacion) => asig.actividad_id === act.id
          );

          return {
            codigo: act.codigo,
            nombre: act.nombre,
            dia_semana: act.diaSemana || act.dia_semana || "lunes",
            notas: act.notas || "",
            asignaciones: asignacionesActividad.map((asig: Asignacion) => ({
              actividad_id: asig.actividad_id,
              empleado_id: asig.empleado_id,
              empleado_nombre: asig.empleado_nombre || "",
              dia_semana: asig.dia_semana,
              estado: (asig.estado || "asignado") as EstadoAsignacion,
              horas_trabajadas: asig.horas_trabajadas || 0,
            })),
          };
        });

        const dto: CrearPlaneacionDto = {
          semana: semanaSeleccionada,
          anio: anioActual,
          planta_id: plantaSeleccionada,
          planta_nombre: plantaNombre,
          proyecto_id: proyectoSeleccionado,
          proyecto_nombre: proyectoNombre,
          usuario_id: userId,
          actividades: activitiesDto,
        };

        const nuevaPlaneacion = await crearPlaneacion(dto);
        toast.success("Planeación guardada como borrador");
        router.push(`/dashboard/ingenierias/planeacion/${nuevaPlaneacion.id}`);
      } else if (planeacion) {
        const dto: ActualizarPlaneacionDto = {
          planta_nombre: plantaNombre,
          proyecto_nombre: proyectoNombre,
        };

        await actualizarPlaneacion(planeacion.id, dto);
        toast.success("Cambios guardados");

        const actualizada = await obtenerPlaneacion(planeacion.id);
        setPlaneacion(actualizada);
        setActividades(actualizada.actividades);
        setAsignaciones(actualizada.asignaciones);
      }
    } catch (error) {
      console.error("Error guardando:", error);
      toast.error(`Error: ${extraerMensajeError(error)}`);
    } finally {
      setGuardando(false);
    }
  }, [
    plantaSeleccionada,
    proyectoSeleccionado,
    actividades,
    asignaciones,
    mode,
    planeacion,
    semanaSeleccionada,
    anioActual,
    plantaNombre,
    proyectoNombre,
    userId,
    router,
  ]);

  const handleEnviarAprobacion = useCallback(async () => {
    const mensaje =
      "¿Enviar esta planeación para aprobación?\n\nNo podrás editarla hasta que sea revisada.";
    if (!confirm(mensaje)) return;

    setGuardando(true);
    try {
      if (mode === "create") {
        await handleGuardarBorrador();
        return;
      }

      if (!planeacion) throw new Error("No hay planeación para enviar");

      await enviarParaAprobacion(planeacion.id);
      toast.success("Planeación enviada para aprobación");

      const actualizada = await obtenerPlaneacion(planeacion.id);
      setPlaneacion(actualizada);
    } catch (error) {
      console.error("Error enviando:", error);
      toast.error(`Error: ${extraerMensajeError(error)}`);
    } finally {
      setGuardando(false);
    }
  }, [mode, planeacion, handleGuardarBorrador]);

  const handleAprobar = useCallback(async () => {
    if (!planeacion || !confirm("¿Aprobar esta planeación?")) return;

    setGuardando(true);
    try {
      const dto: AprobarPlaneacionDto = {
        administrador_id: userId,
        comentarios: comentariosAdmin || undefined,
      };

      await aprobarPlaneacion(planeacion.id, dto);
      toast.success("Planeación aprobada");

      const actualizada = await obtenerPlaneacion(planeacion.id);
      setPlaneacion(actualizada);
    } catch (error) {
      console.error("Error aprobando:", error);
      toast.error(`Error: ${extraerMensajeError(error)}`);
    } finally {
      setGuardando(false);
    }
  }, [planeacion, userId, comentariosAdmin]);

  const handleRechazar = useCallback(async () => {
    if (!planeacion) return;

    if (!comentariosAdmin.trim()) {
      toast.warning("Debes agregar comentarios al rechazar");
      return;
    }

    if (!confirm("¿Rechazar esta planeación?")) return;

    setGuardando(true);
    try {
      const dto: RechazarPlaneacionDto = {
        aprobador_id: userId,
        comentarios: comentariosAdmin,
      };

      await rechazarPlaneacion(planeacion.id, dto);
      toast.success("Planeación rechazada");

      const actualizada = await obtenerPlaneacion(planeacion.id);
      setPlaneacion(actualizada);
    } catch (error) {
      console.error("Error rechazando:", error);
      toast.error(`Error: ${extraerMensajeError(error)}`);
    } finally {
      setGuardando(false);
    }
  }, [planeacion, userId, comentariosAdmin]);

  // ============================================
  // HANDLERS - NAVEGACIÓN
  // ============================================

  const handleVolver = useCallback(() => {
    router.push("/dashboard/ingenierias/planeacion");
  }, [router]);

  const handleEditarPlaneacion = useCallback(
    (id: number) => {
      router.push(`/dashboard/ingenierias/planeacion/${id}/edit`);
    },
    [router]
  );

  const handleRecargarActividades = useCallback(async () => {
    if (!planeacion) return;

    try {
      const actualizada = await obtenerPlaneacion(planeacion.id);
      setActividades(actualizada.actividades);
      setAsignaciones(actualizada.asignaciones);
    } catch (error) {
      console.error("Error recargando actividades:", error);
    }
  }, [planeacion]);

  // ============================================
  // HANDLERS - SELECTORES
  // ============================================

  const handleSemanaChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSemanaSeleccionada(parseInt(e.target.value));
  }, []);

  const handlePlantaChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = parseInt(e.target.value);
      setPlantaSeleccionada(id || null);
      const planta = plantas.find((p: Planta) => p.id === id);
      setPlantaNombre(planta?.nombre || "");
      setProyectoSeleccionado(null);
      setProyectoNombre("");
    },
    [plantas]
  );

  const handleProyectoChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = parseInt(e.target.value);
      setProyectoSeleccionado(id || null);
      const proyecto = proyectosDisponibles.find((p: Proyecto) => p.id === id);
      setProyectoNombre(proyecto?.nombre || "");
    },
    [proyectosDisponibles]
  );

  // ============================================
  // RENDER - LOADING
  // ============================================

  if (cargando) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Cargando planeación...</p>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Badge de Estado */}
      {mode === "view" && planeacion && (
        <EstadoBadge planeacion={planeacion} />
      )}

      {/* Contador de Tiempo */}
      {mode === "create" && userRole === "ingeniero" && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <ContadorTiempo />
        </div>
      )}

      {/* Panel de Aprobación */}
      {puedeAprobar && (
        <PanelAprobacion
          comentariosAdmin={comentariosAdmin}
          setComentariosAdmin={setComentariosAdmin}
          onAprobar={handleAprobar}
          onRechazar={handleRechazar}
          guardando={guardando}
        />
      )}

      {/* Selectores */}
      <SelectoresPlaneacion
        semanaSeleccionada={semanaSeleccionada}
        plantaSeleccionada={plantaSeleccionada}
        proyectoSeleccionado={proyectoSeleccionado}
        plantas={plantas}
        proyectosDisponibles={proyectosDisponibles}
        fechas={fechas}
        puedeEditar={puedeEditar}
        guardando={guardando}
        onSemanaChange={handleSemanaChange}
        onPlantaChange={handlePlantaChange}
        onProyectoChange={handleProyectoChange}
      />

      {/* Botón agregar actividad */}
      {puedeEditar && planeacion && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <button
            onClick={handleAgregarActividad}
            disabled={guardando}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
          >
            ➕ Agregar Actividad Manualmente
          </button>
        </div>
      )}

      {/* Calendario Semanal */}
      {plantaSeleccionada && proyectoSeleccionado && (
        <CalendarioSemanal
          semana={semanaSeleccionada}
          anio={anioActual}
          plantaNombre={plantaNombre}
          proyectoNombre={proyectoNombre}
          fechaInicio={fechas.inicio}
          fechaFin={fechas.fin}
          actividades={actividades}
          asignaciones={asignaciones}
          empleados={empleados}
          cotizacion={cotizacionParaCalendario}
          proyectoSemanaId={planeacion?.id || 0}
          planeacionId={planeacion?.id}
          onEditar={handleEditarPlaneacion}
          onAsignarEmpleado={handleAsignarEmpleado}
          onRemoverEmpleado={handleRemoverEmpleado}
          onActualizarHoras={handleActualizarHoras}
          onRecargarActividades={handleRecargarActividades}
          onEditarActividad={handleEditarActividad}
          onEliminarActividad={handleEliminarActividad}
          onCrearDesdePartida={handleCrearDesdePartida}
          mostrarPartidas={mode === "create"}
          mostrarEmpleados
          compacto={false}
          soloLectura={!puedeEditar}
        />
      )}

      {/* Botones de Acción */}
      <BotonesAccion
        puedeEditar={puedeEditar}
        guardando={guardando}
        onVolver={handleVolver}
        onGuardar={handleGuardarBorrador}
        onEnviar={handleEnviarAprobacion}
      />
    </div>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

interface EstadoBadgeProps {
  planeacion: Planeacion;
}

function EstadoBadge({ planeacion }: EstadoBadgeProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{ESTADO_ICONOS[planeacion.estado]}</span>
          <div>
            <div
              className={`inline-block px-4 py-2 rounded-lg font-bold text-sm border-2 ${
                ESTADO_COLORES[planeacion.estado]
              }`}
            >
              {planeacion.estado.toUpperCase()}
            </div>
            {planeacion.aprobador && (
              <p className="text-sm text-gray-600 mt-2">
                Revisado por: <strong>{planeacion.aprobador.nombre}</strong>
              </p>
            )}
          </div>
        </div>

        <FechasEstado planeacion={planeacion} />
      </div>

      {planeacion.comentarios_aprobacion && (
        <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <div className="font-bold text-yellow-800 mb-2">💬 Comentarios:</div>
          <div className="text-gray-700">{planeacion.comentarios_aprobacion}</div>
        </div>
      )}
    </div>
  );
}

interface FechasEstadoProps {
  planeacion: Planeacion;
}

function FechasEstado({ planeacion }: FechasEstadoProps) {
  if (!planeacion.fecha_envio) return null;

  return (
    <div className="text-right text-sm text-gray-600">
      <p>Enviada: {formatearFechaHora(planeacion.fecha_envio)}</p>
      {planeacion.fecha_aprobacion && (
        <p>Aprobada: {formatearFechaHora(planeacion.fecha_aprobacion)}</p>
      )}
      {planeacion.fecha_rechazo && (
        <p>Rechazada: {formatearFechaHora(planeacion.fecha_rechazo)}</p>
      )}
    </div>
  );
}

interface PanelAprobacionProps {
  comentariosAdmin: string;
  setComentariosAdmin: (value: string) => void;
  onAprobar: () => void;
  onRechazar: () => void;
  guardando: boolean;
}

function PanelAprobacion({
  comentariosAdmin,
  setComentariosAdmin,
  onAprobar,
  onRechazar,
  guardando,
}: PanelAprobacionProps) {
  return (
    <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6">
      <h3 className="text-xl font-bold text-purple-900 mb-4">
        🎯 Panel de Administrador
      </h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comentarios (opcional para aprobar, requerido para rechazar)
        </label>
        <textarea
          value={comentariosAdmin}
          onChange={(e) => setComentariosAdmin(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          placeholder="Escribe tus observaciones aquí..."
          disabled={guardando}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onAprobar}
          disabled={guardando}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {guardando ? "Procesando..." : "✅ Aprobar Planeación"}
        </button>
        <button
          onClick={onRechazar}
          disabled={guardando}
          className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {guardando ? "Procesando..." : "❌ Rechazar Planeación"}
        </button>
      </div>
    </div>
  );
}

interface SelectoresPlaneacionProps {
  semanaSeleccionada: number;
  plantaSeleccionada: number | null;
  proyectoSeleccionado: number | null;
  plantas: Planta[];
  proyectosDisponibles: Proyecto[];
  fechas: FechasSemana;
  puedeEditar: boolean;
  guardando: boolean;
  onSemanaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onPlantaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onProyectoChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

function SelectoresPlaneacion({
  semanaSeleccionada,
  plantaSeleccionada,
  proyectoSeleccionado,
  plantas,
  proyectosDisponibles,
  fechas,
  puedeEditar,
  guardando,
  onSemanaChange,
  onPlantaChange,
  onProyectoChange,
}: SelectoresPlaneacionProps) {
  const semanasArray = useMemo(
    () => Array.from({ length: SEMANAS_POR_ANIO }, (_, i) => i + 1),
    []
  );

  const disabled = !puedeEditar || guardando;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        📋 Información de la Planeación
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Semana */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Semana del Año
          </label>
          <select
            value={semanaSeleccionada}
            onChange={onSemanaChange}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            {semanasArray.map((week) => (
              <option key={week} value={week}>
                Semana {week}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {formatearFecha(fechas.inicio)} - {formatearFecha(fechas.fin)}
          </p>
        </div>

        {/* Planta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Planta
          </label>
          <select
            value={plantaSeleccionada || ""}
            onChange={onPlantaChange}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Selecciona una planta</option>
            {plantas.map((planta) => (
              <option key={planta.id} value={planta.id}>
                {planta.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Proyecto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proyecto (con Orden de Compra)
          </label>
          <select
            value={proyectoSeleccionado || ""}
            onChange={onProyectoChange}
            disabled={disabled || !plantaSeleccionada}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">
              {plantaSeleccionada
                ? "Selecciona un proyecto"
                : "Primero selecciona planta"}
            </option>
            {proyectosDisponibles.map((proyecto) => (
              <option key={proyecto.id} value={proyecto.id}>
                {proyecto.nombre}
              </option>
            ))}
          </select>
          {plantaSeleccionada && proyectosDisponibles.length === 0 && (
            <p className="text-xs text-red-500 mt-1">
              No hay proyectos con orden de compra en esta planta
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface BotonesAccionProps {
  puedeEditar: boolean;
  guardando: boolean;
  onVolver: () => void;
  onGuardar: () => void;
  onEnviar: () => void;
}

function BotonesAccion({
  puedeEditar,
  guardando,
  onVolver,
  onGuardar,
  onEnviar,
}: BotonesAccionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex gap-3 justify-end">
        <button
          onClick={onVolver}
          disabled={guardando}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors disabled:opacity-50"
        >
          ← Volver
        </button>

        {puedeEditar && (
          <>
            <button
              onClick={onGuardar}
              disabled={guardando}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? "Guardando..." : "💾 Guardar como Borrador"}
            </button>

            <button
              onClick={onEnviar}
              disabled={guardando}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? "Enviando..." : "📤 Enviar para Aprobación"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
