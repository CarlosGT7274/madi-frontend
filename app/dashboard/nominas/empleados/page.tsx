"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usersAll } from "@/utils/api/users";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Filter,
  Loader2
} from "lucide-react";

interface Empleado {
  id: number;
  nombre: string;
  email?: string;
  puesto?: string;
  rol?: {
    id: number;
    nombre: string;
  };
  activo?: boolean;
  precio_hora?: number;
}

// Mapeo de roles a colores
const COLORES_PUESTO: Record<string, string> = {
  "Supervisor": "#3b82f6",
  "Obrero": "#10b981",
  "Ingeniero": "#8b5cf6",
  "Técnico": "#f59e0b",
  "Administrativo": "#ec4899",
  "default": "#6b7280"
};

export default function EmpleadosPage() {
  const router = useRouter();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "inactivos">("activos");
  const [filtroAsignacion, setFiltroAsignacion] = useState<"todos" | "disponible" | "ocupado">("todos");

  useEffect(() => {
    const cargarEmpleados = async () => {
      try {
        const usuarios = await usersAll();
        setEmpleados(usuarios);
      } catch (error) {
        console.error("Error cargando empleados:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarEmpleados();
  }, []);

  const empleadosFiltrados = empleados.filter(emp => {
    const matchBusqueda =
      emp.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (emp.email && emp.email.toLowerCase().includes(busqueda.toLowerCase())) ||
      (emp.puesto && emp.puesto.toLowerCase().includes(busqueda.toLowerCase()));

    const matchEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "activos" && emp.activo !== false) ||
      (filtroEstado === "inactivos" && emp.activo === false);

    return matchBusqueda && matchEstado;
  });

  const handleEliminar = (id: number) => {
    if (confirm("¿Estás seguro de dar de baja a este empleado?")) {
      setEmpleados(empleados.map(emp =>
        emp.id === id ? { ...emp, activo: false } : emp
      ));
    }
  };

  const handleActivar = (id: number) => {
    setEmpleados(empleados.map(emp =>
      emp.id === id ? { ...emp, activo: true } : emp
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Empleados</h1>
              <p className="text-gray-500 mt-2">
                Gestiona los empleados y sus asignaciones
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/nominas/empleados/nuevo")}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-all"
            >
              <Plus size={20} />
              Nuevo Empleado
            </button>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro Estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>

            {/* Filtro Asignación */}
            <select
              value={filtroAsignacion}
              onChange={(e) => setFiltroAsignacion(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todas las asignaciones</option>
              <option value="disponible">Disponibles</option>
              <option value="ocupado">Ocupados</option>
            </select>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-900">{empleados.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Activos</p>
              <p className="text-2xl font-bold text-green-900">
                {empleados.filter(e => e.activo).length}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Ocupados</p>
              <p className="text-2xl font-bold text-red-900">
                {empleados.filter(e => e.estado_asignacion === "ocupado").length}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Disponibles</p>
              <p className="text-2xl font-bold text-yellow-900">
                {empleados.filter(e => e.estado_asignacion === "disponible").length}
              </p>
            </div>
          </div>
        </div>

        {/* Tabla de Empleados */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puesto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salario Diario
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asignación
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Ingreso
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {empleadosFiltrados.map((empleado) => (
                  <tr key={empleado.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="text-blue-600" size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {empleado.nombre} {empleado.apellido_paterno} {empleado.apellido_materno}
                          </div>
                          <div className="text-sm text-gray-500">
                            {empleado.numero_empleado}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white"
                        style={{ backgroundColor: empleado.puesto.color }}
                      >
                        {empleado.puesto.nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${empleado.salario_diario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {empleado.activo ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <UserCheck size={14} className="mr-1" />
                          Activo
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          <UserX size={14} className="mr-1" />
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {empleado.estado_asignacion === "ocupado" ? (
                        <div>
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Ocupado
                          </span>
                          {empleado.planta_asignada && (
                            <div className="text-xs text-gray-500 mt-1">
                              {empleado.planta_asignada.nombre}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Disponible
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(empleado.fecha_ingreso).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/nominas/empleados/${empleado.id}`)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-all"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/nominas/empleados/${empleado.id}`)}
                          className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-all"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        {empleado.activo ? (
                          <button
                            onClick={() => handleEliminar(empleado.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-all"
                            title="Dar de baja"
                          >
                            <Trash2 size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivar(empleado.id)}
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-all"
                            title="Activar"
                          >
                            <UserCheck size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {empleadosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No se encontraron empleados
              </h3>
              <p className="text-gray-500 mb-6">
                Intenta ajustar los filtros o crea un nuevo empleado
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
