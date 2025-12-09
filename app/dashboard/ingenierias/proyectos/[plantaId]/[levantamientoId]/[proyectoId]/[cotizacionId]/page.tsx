"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import {
  FileText,
  DollarSign,
  Package,
  ShoppingCart,
  Download,
  User,
  Building,
  MapPin,
  Hash,
  Plus,
  CheckCircle,
  Lock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { obtenerCotizacionPorId } from "@/utils/api/ing-proyectos";

interface Partida {
  id?: number;
  numero_partida: number;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  importe: number;
}

interface Cotizacion {
  id: number;
  proyecto_id: number;
  folio: string;
  fecha: string;
  subtotal: number;
  iva: number;
  total: number;
  estado: "borrador" | "enviada" | "aprobada" | "rechazada";
  tiene_partidas: boolean;
  tiene_insumos: boolean;
  tiene_orden_compra: boolean;
  fecha_creacion: string;
  fecha_modificacion?: string;
  
  // Datos adicionales que puedan venir del backend
  cliente?: string;
  obra?: string;
  direccion?: string;
  vendedor?: string;
  proveedor?: string;
  para?: string;
  partidas?: Partida[];
}

export default function CotizacionDetallePage() {
  const router = useRouter();
  const params = useParams();
  const plantaId = Number(params.plantaId);
  const levantamientoId = Number(params.levantamientoId);
  const proyectoId = Number(params.proyectoId);
  const cotizacionId = Number(params.cotizacionId);

  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const cotData = await obtenerCotizacionPorId(cotizacionId);
        console.log(cotData)
        setCotizacion(cotData);
      } catch (error) {
        console.error("Error cargando cotización:", error);
        router.push(`/dashboard/ingenierias/proyectos/${plantaId}/${levantamientoId}/${proyectoId}`);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [cotizacionId, plantaId, levantamientoId, proyectoId, router]);

  const formatearFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return fecha;
    }
  };

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(monto || 0);
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case "aprobada":
        return "bg-green-500";
      case "enviada":
        return "bg-blue-500";
      case "rechazada":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleAgregarPartida = () => {
    router.push(`${pathname}/editar`);
  };

  const handleExplosionInsumos = () => {
    router.push(`${pathname}/explosion-insumos`);
  };

  const handleOrdenCompra = () => {
    if (!cotizacion?.tiene_insumos) {
      alert(
        "⚠️ EXPLOSIÓN DE INSUMOS REQUERIDA\n\n" +
        "Antes de crear la orden de compra, debes completar la explosión de insumos.\n\n" +
        "Pasos:\n" +
        "1. Haz clic en 'Explosión de Insumos'\n" +
        "2. Completa todos los materiales necesarios\n" +
        "3. Guarda la explosión\n" +
        "4. Luego podrás crear la orden de compra"
      );
      return;
    }

    router.push(`${pathname}/orden-compra`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando cotización...</p>
        </div>
      </div>
    );
  }

  if (!cotizacion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Cotización no encontrada</p>
          <button
            onClick={() =>
              router.push(`/dashboard/ingenierias/proyectos/${plantaId}/${levantamientoId}/${proyectoId}`)
            }
            className="mt-4 text-blue-600 hover:underline"
          >
            Volver al proyecto
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <Breadcrumb />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header - Info de la Cotización */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {cotizacion.folio}
                </h1>
                <p className="text-indigo-100">
                  {formatearFecha(cotizacion.fecha)}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium ${obtenerColorEstado(cotizacion.estado)}`}
              >
                {cotizacion.estado.toUpperCase()}
              </span>
            </div>
          </div>

          {/* ✅ Banner de estado aprobado con orden de compra */}
          {cotizacion.tiene_orden_compra && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                    Cotización Aprobada y Procesada
                    <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">
                      Orden de Compra Emitida
                    </span>
                  </h3>
                  <p className="text-green-700 text-sm mt-1">
                    Esta cotización ha sido aprobada por un monto de <span className="font-bold">{formatearMonto(cotizacion.total)}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                    <Lock size={14} />
                    <span>El proyecto asociado está bloqueado para nuevas cotizaciones hasta completar esta orden</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            {/* Información Principal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <DollarSign size={24} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatearMonto(cotizacion.total)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <DollarSign size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatearMonto(cotizacion.subtotal)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <DollarSign size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">IVA</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatearMonto(cotizacion.iva)}
                  </p>
                </div>
              </div>
            </div>

            {/* Información del Cliente y Proyecto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Información del Cliente
                </h3>
                <div className="space-y-2">
                  {cotizacion.cliente && (
                    <div className="flex items-center gap-2">
                      <Building size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700">
                        <strong>Cliente:</strong> {cotizacion.cliente}
                      </span>
                    </div>
                  )}
                  {cotizacion.direccion && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700">
                        <strong>Dirección:</strong> {cotizacion.direccion}
                      </span>
                    </div>
                  )}
                  {cotizacion.para && (
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700">
                        <strong>Para:</strong> {cotizacion.para}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Información del Proyecto
                </h3>
                <div className="space-y-2">
                  {cotizacion.obra && (
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700">
                        <strong>Obra:</strong> {cotizacion.obra}
                      </span>
                    </div>
                  )}
                  {cotizacion.vendedor && (
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700">
                        <strong>Vendedor:</strong> {cotizacion.vendedor}
                      </span>
                    </div>
                  )}
                  {cotizacion.proveedor && (
                    <div className="flex items-center gap-2">
                      <Hash size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700">
                        <strong>Proveedor:</strong> {cotizacion.proveedor}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Información Adicional
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Número de Partidas</p>
                  <p className="text-sm font-medium text-gray-900">
                    {cotizacion.partidas?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Folio</p>
                  <p className="text-sm font-medium text-gray-900">
                    {cotizacion.folio}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Fecha de Creación</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatearFecha(cotizacion.fecha_creacion)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Flujo de Fases Mejorado */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Proceso de Cotización</h2>
            <p className="text-gray-600 text-sm">
              Completa las fases en orden para procesar la cotización
            </p>
          </div>

          {/* Indicador de progreso */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                cotizacion.tiene_insumos ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {cotizacion.tiene_insumos ? <CheckCircle size={20} /> : '1'}
              </div>
              <span className={`text-sm font-medium ${cotizacion.tiene_insumos ? 'text-green-600' : 'text-gray-500'}`}>
                Explosión de Insumos
              </span>
            </div>

            <ArrowRight size={24} className="text-gray-400" />

            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                cotizacion.tiene_orden_compra ? 'bg-green-500 text-white' : 
                cotizacion.tiene_insumos ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'
              }`}>
                {cotizacion.tiene_orden_compra ? <CheckCircle size={20} /> : '2'}
              </div>
              <span className={`text-sm font-medium ${
                cotizacion.tiene_orden_compra ? 'text-green-600' : 
                cotizacion.tiene_insumos ? 'text-blue-600' : 'text-gray-400'
              }`}>
                Orden de Compra
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Explosión de Insumos */}
            <div
              onClick={handleExplosionInsumos}
              className={`rounded-lg p-6 cursor-pointer transition-all border-2 ${
                cotizacion.tiene_insumos
                  ? 'bg-green-50 border-green-300 hover:border-green-400'
                  : 'bg-white border-purple-300 hover:border-purple-400 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg ${
                  cotizacion.tiene_insumos ? 'bg-green-100' : 'bg-purple-50'
                }`}>
                  <Package size={32} className={cotizacion.tiene_insumos ? 'text-green-600' : 'text-purple-600'} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Explosión de Insumos
                    {cotizacion.tiene_insumos && (
                      <CheckCircle size={20} className="text-green-600" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {cotizacion.tiene_insumos 
                      ? 'Materiales definidos y listos'
                      : 'Define los materiales necesarios'}
                  </p>
                </div>
              </div>
              
              {cotizacion.tiene_insumos ? (
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Fase completada
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Los materiales han sido registrados correctamente
                  </p>
                </div>
              ) : (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <p className="text-sm text-purple-800 font-medium flex items-center gap-2">
                    <AlertCircle size={16} />
                    Paso 1: Completar primero
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Define los materiales antes de crear la orden de compra
                  </p>
                </div>
              )}

              <button className={`w-full mt-4 px-4 py-2 rounded-lg transition-colors ${
                cotizacion.tiene_insumos
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}>
                {cotizacion.tiene_insumos ? 'Ver Insumos' : 'Agregar Insumos'}
              </button>
            </div>

            {/* Orden de Compra */}
            <div
              onClick={handleOrdenCompra}
              className={`rounded-lg p-6 transition-all border-2 ${
                cotizacion.tiene_orden_compra
                  ? 'bg-green-50 border-green-300 cursor-default'
                  : cotizacion.tiene_insumos
                    ? 'bg-white border-blue-300 hover:border-blue-400 hover:shadow-lg cursor-pointer'
                    : 'bg-gray-50 border-gray-300 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg ${
                  cotizacion.tiene_orden_compra
                    ? 'bg-green-100'
                    : cotizacion.tiene_insumos
                      ? 'bg-blue-50'
                      : 'bg-gray-100'
                }`}>
                  <ShoppingCart size={32} className={
                    cotizacion.tiene_orden_compra
                      ? 'text-green-600'
                      : cotizacion.tiene_insumos
                        ? 'text-blue-600'
                        : 'text-gray-400'
                  } />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Orden de Compra
                    {cotizacion.tiene_orden_compra && (
                      <CheckCircle size={20} className="text-green-600" />
                    )}
                    {!cotizacion.tiene_insumos && (
                      <Lock size={16} className="text-gray-400" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {cotizacion.tiene_orden_compra
                      ? 'Orden emitida y aprobada'
                      : cotizacion.tiene_insumos
                        ? 'Sube el PDF de la orden'
                        : 'Requiere explosión de insumos'}
                  </p>
                </div>
              </div>

              {cotizacion.tiene_orden_compra ? (
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Orden de Compra Aprobada
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Monto: {formatearMonto(cotizacion.total)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Lock size={12} />
                    Proyecto bloqueado hasta completar orden
                  </p>
                </div>
              ) : cotizacion.tiene_insumos ? (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                    <AlertCircle size={16} />
                    Paso 2: Lista para crear
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    La explosión de insumos está completa
                  </p>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                    <Lock size={16} />
                    Bloqueado
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Completa primero la explosión de insumos
                  </p>
                </div>
              )}

              <button
                disabled={!cotizacion.tiene_insumos || cotizacion.tiene_orden_compra}
                className={`w-full mt-4 px-4 py-2 rounded-lg transition-colors ${
                  cotizacion.tiene_orden_compra
                    ? 'bg-green-600 text-white'
                    : cotizacion.tiene_insumos
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {cotizacion.tiene_orden_compra ? 'Ver Orden' : 'Crear Orden'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Partidas */}
        {cotizacion.partidas && cotizacion.partidas.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={24} />
                  Partidas de la Cotización
                </h2>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download size={16} />
                  Exportar
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Concepto
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unidad
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P. Unitario
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cotizacion.partidas.map((partida, index) => (
                    <tr key={partida.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {partida.numero_partida || index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-md">
                          <p className="font-medium">{partida.descripcion || 'Sin concepto'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {partida.unidad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {partida.cantidad.toString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatearMonto(partida.precio_unitario)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        {formatearMonto(partida.importe)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-3 text-right text-sm font-medium text-gray-900"
                    >
                      Subtotal:
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      {formatearMonto(cotizacion.subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-3 text-right text-sm text-gray-700"
                    >
                      I.V.A. (16%):
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-gray-900">
                      {formatearMonto(cotizacion.iva)}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-gray-300">
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-right text-lg font-bold text-gray-900"
                    >
                      TOTAL:
                    </td>
                    <td className="px-6 py-4 text-right text-lg font-bold text-blue-600">
                      {formatearMonto(cotizacion.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                <svg
                  className="w-full h-full"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay partidas registradas
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Esta cotización aún no tiene partidas. Agrega partidas para completar la cotización.
              </p>
              <button
                onClick={handleAgregarPartida}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <Plus className="mr-2 h-5 w-5" />
                Agregar Primera Partida
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
