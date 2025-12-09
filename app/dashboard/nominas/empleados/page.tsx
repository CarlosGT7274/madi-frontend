"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Filter
} from "lucide-react";

interface Empleado {
  id: number;
  numero_empleado: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  puesto: {
    id: number;
    nombre: string;
    color: string;
  };
  salario_diario: number;
  fecha_ingreso: string;
  activo: boolean;
  estado_asignacion: "disponible" | "ocupado";
  planta_asignada?: {
    id: number;
    nombre: string;
  };
}

export default function EmpleadosPage() {
  const router = useRouter();
  const [empleados, setEmpleados] = useState<Empleado[]>([
    {
      id: 1,
      numero_empleado: "EMP-001",
      nombre: "Juan Carlos",
      apellido_paterno: "Pérez",
      apellido_materno: "García",
      puesto: {
        id: 1,
        nombre: "Supervisor",
        color: "#3b82f6"
      },
      salario_diario: 850.00,
      fecha_ingreso: "2023-01-15",
      activo: true,
      estado_asignacion: "ocupado",
      planta_asignada: {
        id: 1,
        nombre: "Planta Norte"
      }
    },
    {
      id: 2,
      numero_empleado: "EMP-002",
      nombre: "María Elena",
      apellido_paterno: "Rodríguez",
      apellido_materno: "López",
      puesto: {
        id: 2,
        nombre: "Obrero",
        color: "#10b981"
      },
      salario_diario: 450.00,
      fecha_ingreso: "2023-03-20",
      activo: true,
      estado_asignacion: "disponible"
    },
    {
      id: 3,
      numero_empleado: "EMP-003",
      nombre: "Pedro Antonio",
      apellido_paterno: "Martínez",
      apellido_materno: "Hernández",
      puesto: {
        id: 3,
        nombre: "Ingeniero",
        color: "#8b5cf6"
      },
      salario_diario: 1200.00,
      fecha_ingreso: "2022-11-10",
      activo: true,
      estado_asignacion: "ocupado",
      planta_asignada: {
        id: 2,
        nombre: "Planta Sur"
      }
    },
    {
      id: 4,
      numero_empleado: "EMP-004",
      nombre: "Ana Sofía",
      apellido_paterno: "González",
      apellido_materno: "Ramírez",
      puesto: {
        id: 2,
        nombre: "Obrero",
        color: "#10b981"
      },
      salario_diario: 450.00,
      fecha_ingreso: "2024-01-05",
      activo: true,
      estado_asignacion: "disponible"
    },
    {
      id: 5,
      numero_empleado: "EMP-005",
      nombre: "Luis Miguel",
      apellido_paterno: "Sánchez",
      apellido_materno: "Torres",
      puesto: {
        id: 1,
        nombre: "Supervisor",
        color: "#3b82f6"
      },
      salario_diario: 850.00,
      fecha_ingreso: "2023-06-12",
      activo: false,
      estado_asignacion: "disponible"
    }
  ]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "inactivos">("activos");
  const [filtroAsignacion, setFiltroAsignacion] = useState<"todos" | "disponible" | "ocupado">("todos");

  const empleadosFiltrados = empleados.filter(emp => {
    const matchBusqueda =
      emp.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      emp.apellido_paterno.toLowerCase().includes(busqueda.toLowerCase()) ||
      emp.apellido_materno.toLowerCase().includes(busqueda.toLowerCase()) ||
      emp.numero_empleado.toLowerCase().includes(busqueda.toLowerCase()) ||
      emp.puesto.nombre.toLowerCase().includes(busqueda.toLowerCase());

    const matchEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "activos" && emp.activo) ||
      (filtroEstado === "inactivos" && !emp.activo);

    const matchAsignacion =
      filtroAsignacion === "todos" ||
      emp.estado_asignacion === filtroAsignacion;

    return matchBusqueda && matchEstado && matchAsignacion;
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
