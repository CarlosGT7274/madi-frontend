"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import CalendarioSemanal from "@/components/planeacion/CalendarioSemanalSimple";
import ContadorTiempo from "@/components/planeacion/ContadorTiempo";
import {
  obtenerPlaneaciones,
  obtenerEstadisticas,
  aprobarPlaneacion,
  rechazarPlaneacion,
  puedeCrearPlaneacion,
  Planeacion,
  EstadoPlaneacion,
  AprobarPlaneacionDto,
  RechazarPlaneacionDto,
} from "@/utils/api/planeacion";
import { usersAll } from "@/utils/api/users";
import { readOneRol } from "@/utils/api/roles";
import { getEstadoColor, getEstadoIcon, Empleado } from "@/types/planeacion";
import { obtenerRolUsuario, obtenerUsuarioDesdeCokie } from "@/utils/api/auth";
import { toast } from "react-toastify";
// import { showToast } from "@/utils/toast";

// Tipos
interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol_id: number;
}

interface RolResponse {
  nombre?: string;
}

interface PlaneacionFiltros {
  usuario_id?: number;
  estado?: EstadoPlaneacion;
}

// Cache de roles
const rolesCache: Map<number, string> = new Map();

const obtenerNombreRol = async (rolId: number): Promise<string> => {
  if (rolesCache.has(rolId)) {
    return rolesCache.get(rolId)!;
  }
  
  try {
    const rol: RolResponse = await readOneRol(rolId);
    const nombreRol = rol?.nombre || "Sin rol";
    rolesCache.set(rolId, nombreRol);
    return nombreRol;
  } catch (error) {
    console.error(`Error obteniendo rol ${rolId}:`, error);
    return "Sin rol";
  }
};

// Función para obtener usuario desde cookie
function obtenerUsuarioActual() {
  const usuario = obtenerUsuarioDesdeCokie();
  
  if (!usuario) {
    throw new Error('No hay sesión activa');
  }
  
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: obtenerRolUsuario(),
    rol_id: usuario.rol_id,
  };
}

export default function VerTodasPlaneacionesPage() {
  const router = useRouter();
  const [usuario] = useState(obtenerUsuarioActual());
  
  // Estados
  const [planeaciones, setPlaneaciones] = useState<Planeacion[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<EstadoPlaneacion | "todas">("todas");
  const [cargando, setCargando] = useState(true);
  const [comentariosTemp, setComentariosTemp] = useState<Record<number, string>>({});
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    borradores: 0,
    enviadas: 0,
    aprobadas: 0,
    rechazadas: 0,
  });
  const [procesando, setProcesando] = useState<number | null>(null);

  // Cargar empleados desde API
  const cargarEmpleadosDesdeAPI = useCallback(async () => {
    try {
      const usuariosData: Usuario[] = await usersAll();
      
      const empleadosMapeados: Empleado[] = await Promise.all(
        usuariosData.map(async (usuario) => {
          const nombreCompleto = usuario.nombre.split(' ');
          const nombre = nombreCompleto[0] || '';
          const apellidoPaterno = nombreCompleto[1] || '';
          const apellidoMaterno = nombreCompleto[2] || '';
          
          const nombreRol = await obtenerNombreRol(usuario.rol_id);
          
          return {
            id: usuario.id,
            nombre,
            apellidoPaterno,
            apellidoMaterno,
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

  // Función para cargar planeaciones
  const cargarPlaneaciones = useCallback(async () => {
    setCargando(true);
    
    try {
      // Filtros para la API
      const filtros: PlaneacionFiltros = {};
      
      // Si es ingeniero, filtrar solo sus planeaciones
      if (usuario.rol !== "administrador") {
        filtros.usuario_id = usuario.id;
      }
      
      // Filtro por estado
      if (filtroEstado !== "todas") {
        filtros.estado = filtroEstado;
      }
      
      // Obtener planeaciones desde la API
      const planeacionesData = await obtenerPlaneaciones(filtros);
      
      // Ordenar por fecha de modificación (más recientes primero)
      planeacionesData.sort((a, b) => 
        new Date(b.fecha_modificacion).getTime() - new Date(a.fecha_modificacion).getTime()
      );
      
      setPlaneaciones(planeacionesData);
      
      // Obtener estadísticas
      const stats = await obtenerEstadisticas();
      
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error cargando planeaciones:", error);
      toast.error("Error al cargar las planeaciones");
    } finally {
      setCargando(false);
    }
  }, [filtroEstado, usuario.rol, usuario.id]);

  // Cargar empleados
  useEffect(() => {
    cargarEmpleadosDesdeAPI();
  }, [cargarEmpleadosDesdeAPI]);

  // Cargar planeaciones cuando cambia el filtro
  useEffect(() => {
    cargarPlaneaciones();
  }, [cargarPlaneaciones]);

  const handleNuevaPlaneacion = () => {
    if (!puedeCrearPlaneacion()) {
      toast.warning("⚠️ Las planeaciones solo se pueden crear de lunes a sábado");
      return;
    }
    router.push("/dashboard/ingenierias/planeacion/nueva-planeacion");
  };

  const handleEditar = (id: number) => {
    router.push(`/dashboard/ingenierias/planeacion/${id}`);
  };

  const handleAprobar = async (planeacion: Planeacion) => {
    if (!confirm("¿Aprobar esta planeación?")) return;
    
    setProcesando(planeacion.id);
    try {
      const dto: AprobarPlaneacionDto = {
        administrador_id: usuario.id,
        comentarios: comentariosTemp[planeacion.id] || undefined
      };

      await aprobarPlaneacion(planeacion.id, dto);
      toast.success("✅ Planeación aprobada");
      
      // Limpiar comentarios y recargar
      setComentariosTemp(prev => {
        const newComments = { ...prev };
        delete newComments[planeacion.id];
        return newComments;
      });
      
      await cargarPlaneaciones();
    } catch (error) {
      console.error("Error aprobando:", error);
      toast.error(`❌ Error: ${(error as Error).message}`);
    } finally {
      setProcesando(null);
    }
  };

  const handleRechazar = async (planeacion: Planeacion) => {
    const comentarios = comentariosTemp[planeacion.id];
    if (!comentarios?.trim()) {
      toast.warning("⚠️ Debes agregar comentarios al rechazar");
      return;
    }

    if (!confirm("¿Rechazar esta planeación?")) return;
    
    setProcesando(planeacion.id);
    try {
      const dto: RechazarPlaneacionDto = {
        aprobador_id: usuario.id,
        comentarios: comentarios
      };

      await rechazarPlaneacion(planeacion.id, dto);
      toast.error("❌ Planeación rechazada");
      
      // Limpiar comentarios y recargar
      setComentariosTemp(prev => {
        const newComments = { ...prev };
        delete newComments[planeacion.id];
        return newComments;
      });
      
      await cargarPlaneaciones();
    } catch (error) {
      console.error("Error rechazando:", error);
      toast.error(`❌ Error: ${(error as Error).message}`);
    } finally {
      setProcesando(null);
    }
  };

  const getFechasSemana = (semana: number, anio: number) => {
    const firstDayOfYear = new Date(anio, 0, 1);
    const daysOffset = (semana - 1) * 7;
    const weekStart = new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diff);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return {
      inicio: weekStart.toISOString().split("T")[0],
      fin: weekEnd.toISOString().split("T")[0],
    };
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <Breadcrumb />

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Todas las Planeaciones</h1>
              <p className="text-gray-600 mt-1">
                {usuario.rol === "administrador" 
                  ? "Gestiona todas las planeaciones del equipo"
                  : "Gestiona tus planeaciones semanales"}
              </p>
            </div>
            <button
              onClick={handleNuevaPlaneacion}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold flex items-center gap-2 shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Planeación
            </button>
          </div>

          {/* Contador para ingenieros */}
          {usuario.rol === "ingeniero" && (
            <div className="mb-6">
              <ContadorTiempo mostrarEnCard />
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center border-2 border-gray-200">
              <div className="text-3xl font-bold text-gray-900">{estadisticas.total}</div>
              <div className="text-sm text-gray-600 mt-1">Total</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center border-2 border-gray-300">
              <div className="text-3xl font-bold text-gray-700">{estadisticas.borradores}</div>
              <div className="text-sm text-gray-600 mt-1">📝 Borradores</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center border-2 border-blue-300">
              <div className="text-3xl font-bold text-blue-700">{estadisticas.enviadas}</div>
              <div className="text-sm text-blue-600 mt-1">📤 Enviadas</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center border-2 border-green-300">
              <div className="text-3xl font-bold text-green-700">{estadisticas.aprobadas}</div>
              <div className="text-sm text-green-600 mt-1">✅ Aprobadas</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center border-2 border-red-300">
              <div className="text-3xl font-bold text-red-700">{estadisticas.rechazadas}</div>
              <div className="text-sm text-red-600 mt-1">❌ Rechazadas</div>
            </div>
          </div>

          {/* Filtros */}
          {usuario.rol === "administrador" ? (
            <div className="border-b border-gray-200">
              <nav className="flex gap-2">
                {[
                  { key: "todas", label: "Todas", count: estadisticas.total, color: "purple" },
                  { key: "enviada", label: "📤 Pendientes", count: estadisticas.enviadas, color: "blue" },
                  { key: "aprobada", label: "✅ Aprobadas", count: estadisticas.aprobadas, color: "green" },
                  { key: "rechazada", label: "❌ Rechazadas", count: estadisticas.rechazadas, color: "red" },
                  { key: "borrador", label: "📝 Borradores", count: estadisticas.borradores, color: "gray" },
                ].map((filtro) => (
                  <button
                    key={filtro.key}
                    onClick={() => setFiltroEstado(filtro.key as EstadoPlaneacion | "todas")}
                    className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                      filtroEstado === filtro.key
                        ? `border-${filtro.color}-600 text-${filtro.color}-600 bg-${filtro.color}-50`
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {filtro.label} ({filtro.count})
                  </button>
                ))}
              </nav>
            </div>
          ) : (
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as EstadoPlaneacion | "todas")}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas ({estadisticas.total})</option>
              <option value="borrador">📝 Borradores ({estadisticas.borradores})</option>
              <option value="enviada">📤 Enviadas ({estadisticas.enviadas})</option>
              <option value="aprobada">✅ Aprobadas ({estadisticas.aprobadas})</option>
              <option value="rechazada">❌ Rechazadas ({estadisticas.rechazadas})</option>
            </select>
          )}
        </div>

        {/* Lista de Planeaciones */}
        {cargando ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando planeaciones...</p>
          </div>
        ) : planeaciones.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto w-24 h-24 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay planeaciones</h3>
            <p className="text-gray-600 mb-4">
              {filtroEstado === "todas" 
                ? "Aún no se han creado planeaciones"
                : `No hay planeaciones en estado "${filtroEstado}"`}
            </p>
            <button
              onClick={handleNuevaPlaneacion}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Crear Primera Planeación
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {planeaciones.map((planeacion, index) => {
              const fechas = getFechasSemana(planeacion.semana, planeacion.anio);

              return (
                <div key={planeacion.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Separador visual */}
                  {index > 0 && <div className="border-t-4 border-gray-200" />}
                  
                  {/* Header con estado e info */}
                  <div className={`p-6 border-l-8 ${
                    planeacion.estado === "enviada" ? "border-blue-500 bg-blue-50" :
                    planeacion.estado === "aprobada" ? "border-green-500 bg-green-50" :
                    planeacion.estado === "rechazada" ? "border-red-500 bg-red-50" :
                    "border-gray-500 bg-gray-50"
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getEstadoIcon(planeacion.estado)}</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Semana {planeacion.semana} - {planeacion.anio}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {planeacion.planta_nombre} | {planeacion.proyecto_nombre}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-4 py-2 rounded-lg font-bold text-sm border-2 ${getEstadoColor(planeacion.estado)}`}>
                          {planeacion.estado.toUpperCase()}
                        </span>
                        <p className="text-xs text-gray-600 mt-2">
                          Ingeniero: <strong>{planeacion.usuario?.nombre}</strong>
                        </p>
                        <p className="text-xs text-gray-500">
                          Modificado: {formatearFecha(planeacion.fecha_modificacion)}
                        </p>
                      </div>
                    </div>

                    {/* Comentarios del admin */}
                    {planeacion.comentarios_aprobacion && (
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="font-bold text-yellow-800 mb-2">💬 Comentarios:</div>
                        <div className="text-gray-700">{planeacion.comentarios_aprobacion}</div>
                        {planeacion.aprobador && (
                          <div className="text-xs text-yellow-700 mt-2">
                            — {planeacion.aprobador.nombre}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Panel de aprobación (solo admin en planeaciones enviadas) */}
                    {usuario.rol === "administrador" && planeacion.estado === "enviada" && (
                      <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 mb-4">
                        <h4 className="text-lg font-bold text-purple-900 mb-3">🎯 Panel de Aprobación</h4>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Comentarios (opcional para aprobar, requerido para rechazar)
                          </label>
                          <textarea
                            value={comentariosTemp[planeacion.id] || ""}
                            onChange={(e) => setComentariosTemp({
                              ...comentariosTemp,
                              [planeacion.id]: e.target.value
                            })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="Escribe tus observaciones aquí..."
                            disabled={procesando === planeacion.id}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAprobar(planeacion)}
                            disabled={procesando === planeacion.id}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {procesando === planeacion.id ? "Procesando..." : "✅ Aprobar Planeación"}
                          </button>
                          <button
                            onClick={() => handleRechazar(planeacion)}
                            disabled={procesando === planeacion.id}
                            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {procesando === planeacion.id ? "Procesando..." : "❌ Rechazar Planeación"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Calendario */}
                  <div className="p-6">
                    <CalendarioSemanal
                      semana={planeacion.semana}
                      anio={planeacion.anio}
                      plantaNombre={planeacion.planta_nombre}
                      proyectoNombre={planeacion.proyecto_nombre}
                      fechaInicio={fechas.inicio}
                      fechaFin={fechas.fin}
                      usuarioACargo={planeacion.usuario?.nombre || ""}
                      usuarioACargoCorreo={planeacion.usuario?.correo || ""}
                      actividades={planeacion.actividades}
                      asignaciones={planeacion.asignaciones}
                      empleados={empleados}
                      cotizacion={null}
                      proyectoSemanaId={0}
                      planeacionId={planeacion.id}
                      onEditar={() => handleEditar(planeacion.id)}
                      onRecargarActividades={cargarPlaneaciones}
                      mostrarPartidas={false}
                      mostrarEmpleados={false}
                      compacto={false}
                      soloLectura={false}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
