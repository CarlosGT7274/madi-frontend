"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

interface EstadisticasNomina {
  totalEmpleados: number;
  empleadosActivos: number;
  nominasPendientes: number;
  totalAPagar: number;
  ultimoPeriodo: {
    fechaInicio: string;
    fechaFin: string;
    total: number;
  } | null;
}

export default function NominasPage() {
  const router = useRouter();
  const [estadisticas, setEstadisticas] = useState<EstadisticasNomina>({
    totalEmpleados: 45,
    empleadosActivos: 42,
    nominasPendientes: 3,
    totalAPagar: 235450.50,
    ultimoPeriodo: {
      fechaInicio: "2025-11-16",
      fechaFin: "2025-11-30",
      total: 189320.00
    }
  });

  const tarjetas = [
    {
      titulo: "Empleados Activos",
      valor: estadisticas.empleadosActivos,
      total: estadisticas.totalEmpleados,
      icono: Users,
      color: "bg-blue-500",
      ruta: "/dashboard/nominas/empleados"
    },
    {
      titulo: "Nóminas Pendientes",
      valor: estadisticas.nominasPendientes,
      icono: Clock,
      color: "bg-yellow-500",
      ruta: "/dashboard/nominas/periodos"
    },
    {
      titulo: "Total a Pagar",
      valor: `$${estadisticas.totalAPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      icono: DollarSign,
      color: "bg-green-500",
      ruta: "/dashboard/nominas/calcular"
    },
    {
      titulo: "Último Periodo",
      valor: estadisticas.ultimoPeriodo
        ? `$${estadisticas.ultimoPeriodo.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
        : "N/A",
      subtitulo: estadisticas.ultimoPeriodo
        ? `${new Date(estadisticas.ultimoPeriodo.fechaInicio).toLocaleDateString()} - ${new Date(estadisticas.ultimoPeriodo.fechaFin).toLocaleDateString()}`
        : "",
      icono: TrendingUp,
      color: "bg-purple-500",
      ruta: "/dashboard/nominas/periodos"
    }
  ];

  const accionesRapidas = [
    {
      titulo: "Calcular desde Planeaciones",
      descripcion: "Calcular nómina con horas de planeaciones",
      icono: TrendingUp,
      color: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
      ruta: "/dashboard/nominas/calcular-desde-planeacion/1"
    },
    {
      titulo: "Nuevo Empleado",
      descripcion: "Registrar un nuevo empleado",
      icono: Users,
      color: "bg-blue-600 hover:bg-blue-700",
      ruta: "/dashboard/nominas/empleados/nuevo"
    },
    {
      titulo: "Nuevo Periodo",
      descripcion: "Crear un periodo de nómina",
      icono: Calendar,
      color: "bg-green-600 hover:bg-green-700",
      ruta: "/dashboard/nominas/periodos"
    },
    {
      titulo: "Ver Empleados",
      descripcion: "Gestionar empleados y tarifas",
      icono: Users,
      color: "bg-indigo-600 hover:bg-indigo-700",
      ruta: "/dashboard/nominas/empleados"
    },
    {
      titulo: "Calcular Nómina",
      descripcion: "Calcular nómina del periodo actual",
      icono: DollarSign,
      color: "bg-purple-600 hover:bg-purple-700",
      ruta: "/dashboard/nominas/calcular/1"
    },
    {
      titulo: "Ver Reportes",
      descripcion: "Consultar reportes de nóminas",
      icono: FileText,
      color: "bg-orange-600 hover:bg-orange-700",
      ruta: "/dashboard/nominas/reportes"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Módulo de Nóminas
          </h1>
          <p className="text-gray-600">
            Gestiona empleados, periodos de nómina y pagos
          </p>
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {tarjetas.map((tarjeta, index) => {
            const Icono = tarjeta.icono;
            return (
              <div
                key={index}
                onClick={() => router.push(tarjeta.ruta)}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${tarjeta.color} p-3 rounded-lg`}>
                    <Icono className="text-white" size={24} />
                  </div>
                </div>
                <h3 className="text-gray-500 text-sm font-medium mb-2">
                  {tarjeta.titulo}
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {tarjeta.valor}
                  {tarjeta.total && (
                    <span className="text-sm text-gray-500 font-normal ml-2">
                      / {tarjeta.total}
                    </span>
                  )}
                </p>
                {tarjeta.subtitulo && (
                  <p className="text-xs text-gray-400 mt-2">{tarjeta.subtitulo}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accionesRapidas.map((accion, index) => {
              const Icono = accion.icono;
              return (
                <button
                  key={index}
                  onClick={() => router.push(accion.ruta)}
                  className={`${accion.color} text-white p-6 rounded-lg transition-all text-left`}
                >
                  <Icono size={32} className="mb-4" />
                  <h3 className="font-bold text-lg mb-2">{accion.titulo}</h3>
                  <p className="text-sm opacity-90">{accion.descripcion}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Alertas y Notificaciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alertas */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="text-yellow-500" size={24} />
              Alertas
            </h2>
            <div className="space-y-3">
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-sm font-semibold text-yellow-900">
                  Periodo de nómina por cerrar
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  El periodo quincenal 01-15 Dic cierra en 2 días
                </p>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm font-semibold text-blue-900">
                  3 empleados sin asignar a planta
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Asigna empleados para calcular sus horas
                </p>
              </div>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-500" size={24} />
              Actividad Reciente
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 pb-3 border-b">
                <div className="bg-green-100 p-2 rounded">
                  <DollarSign className="text-green-600" size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Nómina pagada - Periodo 16-30 Nov
                  </p>
                  <p className="text-xs text-gray-500">Hace 2 días</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b">
                <div className="bg-blue-100 p-2 rounded">
                  <Users className="text-blue-600" size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Nuevo empleado: Juan Pérez García
                  </p>
                  <p className="text-xs text-gray-500">Hace 3 días</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded">
                  <Calendar className="text-purple-600" size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Periodo creado - 01-15 Dic
                  </p>
                  <p className="text-xs text-gray-500">Hace 5 días</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
