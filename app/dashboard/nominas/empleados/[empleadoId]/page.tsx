"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Briefcase,
  DollarSign,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Edit,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle
} from "lucide-react";

interface EmpleadoDetalle {
  id: number;
  numero_empleado: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento: string;
  rfc: string;
  curp: string;
  nss: string;
  email: string;
  telefono: string;
  direccion: string;
  puesto: {
    id: number;
    nombre: string;
    color: string;
  };
  tipo_contrato: string;
  salario_base: number;
  salario_diario: number;
  fecha_ingreso: string;
  fecha_baja?: string;
  activo: boolean;
  estado_asignacion: "disponible" | "ocupado";
  planta_asignada?: {
    id: number;
    nombre: string;
    fecha_asignacion: string;
  };
}

interface HistorialNomina {
  periodo: string;
  percepciones: number;
  deducciones: number;
  neto: number;
  fecha_pago: string;
  estado: string;
}

export default function DetalleEmpleadoPage() {
  const params = useParams();
  const router = useRouter();
  const empleadoId = parseInt(params.empleadoId as string);

  const [empleado] = useState<EmpleadoDetalle>({
    id: empleadoId,
    numero_empleado: "EMP-001",
    nombre: "Juan Carlos",
    apellido_paterno: "Pérez",
    apellido_materno: "García",
    fecha_nacimiento: "1985-05-15",
    rfc: "PEPJ850515XXX",
    curp: "PEPJ850515HDFRRN09",
    nss: "12345678901",
    email: "juan.perez@empresa.com",
    telefono: "5512345678",
    direccion: "Calle Principal #123, Col. Centro, CDMX, CP 06000",
    puesto: {
      id: 1,
      nombre: "Supervisor",
      color: "#3b82f6"
    },
    tipo_contrato: "planta",
    salario_base: 25500.00,
    salario_diario: 850.00,
    fecha_ingreso: "2023-01-15",
    activo: true,
    estado_asignacion: "ocupado",
    planta_asignada: {
      id: 1,
      nombre: "Planta Norte",
      fecha_asignacion: "2025-12-01"
    }
  });

  const [historialNominas] = useState<HistorialNomina[]>([
    {
      periodo: "16-30 Nov 2025",
      percepciones: 14950.00,
      deducciones: 2889.00,
      neto: 12061.00,
      fecha_pago: "2025-12-01",
      estado: "pagado"
    },
    {
      periodo: "01-15 Nov 2025",
      percepciones: 13250.00,
      deducciones: 2550.00,
      neto: 10700.00,
      fecha_pago: "2025-11-16",
      estado: "pagado"
    },
    {
      periodo: "16-31 Oct 2025",
      percepciones: 14100.00,
      deducciones: 2720.00,
      neto: 11380.00,
      fecha_pago: "2025-11-01",
      estado: "pagado"
    }
  ]);

  const nombreCompleto = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`;
  const antiguedad = Math.floor(
    (new Date().getTime() - new Date(empleado.fecha_ingreso).getTime()) / (1000 * 60 * 60 * 24 * 365)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{nombreCompleto}</h1>
              <p className="text-gray-500 mt-1">{empleado.numero_empleado}</p>
            </div>
            <button
              onClick={() => router.push(`/dashboard/nominas/empleados/${empleadoId}/editar`)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-all"
            >
              <Edit size={20} />
              Editar
            </button>
          </div>

          {/* Badges de Estado */}
          <div className="flex gap-3">
            {empleado.activo ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-1">
                <CheckCircle size={16} />
                Activo
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold flex items-center gap-1">
                <XCircle size={16} />
                Inactivo
              </span>
            )}
            <span
              className="px-3 py-1 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: empleado.puesto.color }}
            >
              {empleado.puesto.nombre}
            </span>
            {empleado.estado_asignacion === "ocupado" ? (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                Ocupado - {empleado.planta_asignada?.nombre}
              </span>
            ) : (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                Disponible
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Personal */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="text-blue-600" size={24} />
                Información Personal
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                  <p className="text-base font-semibold text-gray-900">
                    {new Date(empleado.fecha_nacimiento).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">RFC</p>
                  <p className="text-base font-semibold text-gray-900">{empleado.rfc}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">CURP</p>
                  <p className="text-base font-semibold text-gray-900">{empleado.curp}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">NSS</p>
                  <p className="text-base font-semibold text-gray-900">{empleado.nss}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="text-gray-400" size={16} />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-base font-semibold text-gray-900">{empleado.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="text-gray-400" size={16} />
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="text-base font-semibold text-gray-900">{empleado.telefono}</p>
                  </div>
                </div>
                <div className="md:col-span-2 flex items-start gap-2">
                  <MapPin className="text-gray-400 mt-1" size={16} />
                  <div>
                    <p className="text-sm text-gray-500">Dirección</p>
                    <p className="text-base font-semibold text-gray-900">{empleado.direccion}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información Laboral */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="text-green-600" size={24} />
                Información Laboral
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tipo de Contrato</p>
                  <p className="text-base font-semibold text-gray-900 capitalize">
                    {empleado.tipo_contrato}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha de Ingreso</p>
                  <p className="text-base font-semibold text-gray-900">
                    {new Date(empleado.fecha_ingreso).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Antigüedad</p>
                  <p className="text-base font-semibold text-gray-900">
                    {antiguedad} {antiguedad === 1 ? 'año' : 'años'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Salario Mensual</p>
                  <p className="text-base font-semibold text-gray-900">
                    ${empleado.salario_base.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Salario Diario</p>
                  <p className="text-base font-semibold text-gray-900">
                    ${empleado.salario_diario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {empleado.planta_asignada && (
                  <div>
                    <p className="text-sm text-gray-500">Planta Asignada</p>
                    <p className="text-base font-semibold text-gray-900">
                      {empleado.planta_asignada.nombre}
                    </p>
                    <p className="text-xs text-gray-400">
                      Desde {new Date(empleado.planta_asignada.fecha_asignacion).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Historial de Nóminas */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="text-purple-600" size={24} />
                Historial de Nóminas
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Periodo
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Percepciones
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Deducciones
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Neto
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {historialNominas.map((nomina, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {nomina.periodo}
                          <div className="text-xs text-gray-500">
                            Pagado: {new Date(nomina.fecha_pago).toLocaleDateString('es-MX')}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 font-semibold">
                          ${nomina.percepciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600 font-semibold">
                          -${nomina.deducciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600 font-bold">
                          ${nomina.neto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            {nomina.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar - Resumen y Estadísticas */}
          <div className="space-y-6">
            {/* Resumen Financiero */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="text-green-600" size={20} />
                Resumen Financiero
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Salario Mensual</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${empleado.salario_base.toLocaleString('es-MX')}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Promedio Neto (últimos 3 meses)</p>
                  <p className="text-2xl font-bold text-green-900">
                    ${(historialNominas.reduce((acc, n) => acc + n.neto, 0) / historialNominas.length).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="space-y-2">
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-all text-sm">
                  Ver Nóminas Completas
                </button>
                <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold transition-all text-sm">
                  Registrar Préstamo
                </button>
                <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold transition-all text-sm">
                  Ver Asistencias
                </button>
                <button className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-semibold transition-all text-sm">
                  Descargar Reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
