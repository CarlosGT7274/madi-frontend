"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usersAll } from "@/utils/api/users";
import {
  Users,
  Plus,
  Search,
  Edit,
  Eye,
  UserCheck,
  Loader2,
  DollarSign
} from "lucide-react";

// Mapeo de roles a colores
const COLORES_ROL: Record<string, string> = {
  "Supervisor": "#3b82f6",
  "Obrero": "#10b981",
  "Ingeniero": "#8b5cf6",
  "Técnico": "#f59e0b",
  "Administrativo": "#ec4899",
  "Empleado": "#10b981",
  "default": "#6b7280"
};

const getColorRol = (rolNombre?: string): string => {
  if (!rolNombre) return COLORES_ROL.default;
  return COLORES_ROL[rolNombre] || COLORES_ROL.default;
};

export default function EmpleadosPage() {
  const router = useRouter();
  const [empleados, setEmpleados] = useState<Allusers[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

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
      emp.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (emp.rol?.nombre && emp.rol.nombre.toLowerCase().includes(busqueda.toLowerCase()));

    return matchBusqueda;
  });

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Empleados</h1>
              <p className="text-gray-500 mt-2">
                Gestiona los empleados del sistema
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/seguridad/usuarios/create")}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-all"
            >
              <Plus size={20} />
              Nuevo Empleado
            </button>
          </div>

          {/* Búsqueda */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o rol..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-900">{empleados.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Filtrados</p>
              <p className="text-2xl font-bold text-green-900">
                {empleadosFiltrados.length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Roles Únicos</p>
              <p className="text-2xl font-bold text-purple-900">
                {new Set(empleados.map(e => e.rol?.nombre).filter(Boolean)).size}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Con Email</p>
              <p className="text-2xl font-bold text-orange-900">
                {empleados.filter(e => e.correo).length}
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
                    Correo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio/Hora
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
                            {empleado.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {empleado.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{empleado.correo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {empleado.rol ? (
                        <span
                          className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white"
                          style={{ backgroundColor: getColorRol(empleado.rol.nombre) }}
                        >
                          {empleado.rol.nombre}
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-200 text-gray-700">
                          Sin rol
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-semibold text-green-600 flex items-center justify-center gap-1">
                        <DollarSign size={14} />
                        {/* Esto debería venir de la BD - por ahora valor por defecto */}
                        150
                      </div>
                      <div className="text-xs text-gray-400">Por configurar</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/seguridad/usuarios/${empleado.id}`)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-all"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/seguridad/usuarios/${empleado.id}`)}
                          className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-all"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
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
                {busqueda ? "Intenta ajustar tu búsqueda" : "Aún no hay empleados registrados"}
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <UserCheck size={20} />
            Información
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Los empleados se gestionan desde <strong>Seguridad → Usuarios</strong></li>
            <li>• El <strong>precio por hora</strong> se debe configurar en la base de datos</li>
            <li>• Agrega el campo: <code className="bg-blue-100 px-2 py-1 rounded">ALTER TABLE usuarios ADD precio_hora DECIMAL(10,2) DEFAULT 150</code></li>
            <li>• Las horas trabajadas se toman de las <strong>planeaciones aprobadas</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
