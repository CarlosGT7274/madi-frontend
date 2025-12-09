"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Package,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit2,
  Save,
  Building2,
  FileText,
  DollarSign,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { Breadcrumb } from "@/components/breadcrumb";
import {
  obtenerCotizacionPorId,
  obtenerInsumosPorCotizacion,
  crearInsumosBulk,
  eliminarInsumo as eliminarInsumoAPI,
} from "@/utils/api/ing-proyectos";

interface Insumo {
  id: number;
  cotizacion_id: number;
  item_number: string;
  descripcion: string;
  unidad_medida: string;
  cantidad: number;
  periodo?: string;
  precio_hora?: number;
  valor_total: number;
  estatus: "pendiente" | "requisitado" | "comprado" | "entregado";
  activo: boolean;
}

interface Cotizacion {
  id: number;
  folio: string;
  cliente?: string;
  obra?: string;
  total: number;
  tiene_insumos: boolean;
}

export default function ExplosionInsumosPage() {
  const params = useParams();
  const router = useRouter();
  const cotizacionId = Number(params.cotizacionId);

  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [procesandoExcel, setProcesandoExcel] = useState(false);
  const [modalSubirExcel, setModalSubirExcel] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);

      // Cargar cotización
      const cotData = await obtenerCotizacionPorId(cotizacionId);
      setCotizacion(cotData);

      // Cargar insumos
      const insumosData = await obtenerInsumosPorCotizacion(cotizacionId);
      setInsumos(insumosData);
    } catch (error) {
      console.error("Error cargando insumos:", error);
      toast.error("Error al cargar los datos");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [cotizacionId, router]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const guardarCambios = async () => {
    setGuardando(true);

    try {
      // Preparar datos para enviar - CONVERTIR STRINGS A NÚMEROS
      const insumosParaGuardar = insumos.map((insumo) => ({
        id: insumo.id > 1000000000000 ? undefined : insumo.id,
        item_number: insumo.item_number,
        descripcion: insumo.descripcion,
        unidad_medida: insumo.unidad_medida,
        cantidad: Number(insumo.cantidad) || 0,
        periodo: insumo.periodo || undefined,
        precio_hora: insumo.precio_hora ? Number(insumo.precio_hora) : undefined,
        valor_total: Number(insumo.valor_total) || 0,
        estatus: insumo.estatus,
        activo: true, // Siempre true porque los eliminados ya no están en el array
      }));

      // Llamar a la API
      const resultado = await crearInsumosBulk({
        cotizacion_id: cotizacionId,
        insumos: insumosParaGuardar,
      });

      toast.success(
        `Insumos guardados correctamente\n\nCreados: ${resultado.creados} | Actualizados: ${resultado.actualizados} | Total: ${resultado.total}`,
        { autoClose: 3000 }
      );

      setEditando(false); // Desactivar modo edición después de guardar
      await cargarDatos(); // Recargar datos desde la API
    } catch (error) {
      console.error("Error guardando:", error);
      toast.error("Error al guardar los insumos");
    } finally {
      setGuardando(false);
    }
  };

  const agregarInsumo = () => {
    const nuevoInsumo: Insumo = {
      id: Date.now(),
      cotizacion_id: cotizacionId,
      item_number: `ITEM-${Date.now()}`,
      descripcion: "",
      unidad_medida: "PZA",
      cantidad: 0,
      periodo: "",
      precio_hora: 0,
      valor_total: 0,
      estatus: "pendiente",
      activo: true,
    };

    setInsumos([...insumos, nuevoInsumo]);
  };

  const eliminarInsumo = async (id: number) => {
    if (!confirm("¿Eliminar este insumo?")) return;

    try {
      // Si es un insumo nuevo (timestamp temporal), solo quitarlo del estado
      if (id > 1000000000000) {
        setInsumos(insumos.filter((i) => i.id !== id));
        return;
      }

      // Si es un insumo existente, eliminarlo de la API
      await eliminarInsumoAPI(id);
      toast.success("Insumo eliminado correctamente");
      
      // Recargar datos desde la API
      await cargarDatos();
    } catch (error) {
      console.error("Error eliminando insumo:", error);
      toast.error("Error al eliminar el insumo");
    }
  };

  const actualizarInsumo = (
    id: number,
    campo: keyof Insumo,
    valor: string | number
  ) => {
    setInsumos(
      insumos.map((insumo) =>
        insumo.id === id ? { ...insumo, [campo]: valor } : insumo
      )
    );
  };

  // ==========================================
  // PROCESAMIENTO DE EXCEL
  // ==========================================

  const procesarExcel = async (file: File) => {
    setProcesandoExcel(true);
    setModalSubirExcel(false);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, {
        type: "array",
        cellText: true,
        cellDates: true,
        raw: false,
      });

      // Buscar hoja de insumos
     const sheetName =
        workbook.SheetNames.find(
          (name) =>
            name.toUpperCase().includes("INSUMO") ||
            name.toUpperCase().includes("MATERIAL"),
        ) || workbook.SheetNames[0];

      console.log(sheetName)      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        blankrows: false,
      }) as string[][];

      // Buscar inicio de tabla
      let indexInicio = -1;
      for (let i = 0; i < jsonData.length; i++) {
        const fila = jsonData[i];
        const filaStr = fila.join(" ").toUpperCase();
        if (
          filaStr.includes("PARTIDA") ||
          filaStr.includes("DESCRIPCION") ||
          filaStr.includes("MATERIAL")
        ) {
          indexInicio = i + 1;
          break;
        }
      }

      if (indexInicio === -1) {
        alert("⚠️ No se encontró tabla de insumos en el Excel");
        setProcesandoExcel(false);
        return;
      }

      const insumosExtraidos: Insumo[] = [];

      for (let i = indexInicio; i < jsonData.length; i++) {
        const fila = jsonData[i];

        // Detener si fila vacía
        if (!fila[0] || fila.every((c) => !c)) break;

        // Mapear columnas según el formato especificado
        const itemNumber = String(fila[0] || "").trim(); // ITEM #
        const descripcion = String(fila[1] || "").trim(); // Descripción
        const unidad = String(fila[2] || "PZA").trim(); // Unidad de medida
        const cantidad = parseFloat(
          String(fila[3] || 0).replace(/[^0-9.-]/g, ""),
        ); // Cantidad
        const periodo = String(fila[4] || "").trim(); // Periodo
        const precioHora = parseFloat(
          String(fila[5] || 0).replace(/[^0-9.-]/g, ""),
        ); // Precio / Hora
        const valorTotal = parseFloat(
          String(fila[6] || 0).replace(/[^0-9.-]/g, ""),
        ); // VALOR TOTAL

        if (descripcion) {
          insumosExtraidos.push({
            id: Date.now() + insumosExtraidos.length,
            cotizacion_id: cotizacionId,
            item_number: itemNumber,
            descripcion: descripcion,
            unidad_medida: unidad,
            cantidad: isNaN(cantidad) ? 0 : cantidad,
            periodo: periodo,
            precio_hora: isNaN(precioHora) ? 0 : precioHora,
            valor_total: isNaN(valorTotal) ? 0 : valorTotal,
            estatus: "pendiente",
            activo: true,
          });
        }
      }

      if (insumosExtraidos.length === 0) {
        toast.warning("No se encontraron insumos en el Excel");
      } else {
        setInsumos([...insumos, ...insumosExtraidos]);
        toast.success(`${insumosExtraidos.length} insumos extraídos del Excel`);
      }
    } catch (error) {
      console.error("Error procesando Excel:", error);
      toast.error("Error al procesar el archivo Excel");
    } finally {
      setProcesandoExcel(false);
    }
  };

  const handleSubirExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls"].includes(ext || "")) {
      toast.warning("Solo archivos Excel (.xlsx, .xls)");
      return;
    }

    procesarExcel(file);
  };

  const exportarExcel = () => {
    if (insumos.length === 0) {
      toast.warning("No hay insumos para exportar");
      return;
    }

    const datosExport = insumos.map((i) => ({
      "ITEM #": i.item_number,
      "Descripción": i.descripcion,
      "Unidad de medida": i.unidad_medida,
      "Cantidad": i.cantidad,
      "Periodo": i.periodo || "",
      "Precio / Hora": i.precio_hora || "",
      "VALOR TOTAL": i.valor_total,
    }));

    const ws = XLSX.utils.json_to_sheet(datosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Insumos");

    const folio = cotizacion?.folio || `COT-${cotizacionId}`;
    XLSX.writeFile(wb, `Insumos_${folio}.xlsx`);
  };

  const obtenerColorEstatus = (estatus: string) => {
    const colores = {
      pendiente: "bg-yellow-100 text-yellow-800",
      requisitado: "bg-blue-100 text-blue-800",
      comprado: "bg-purple-100 text-purple-800",
      entregado: "bg-green-100 text-green-800",
    };
    return (
      colores[estatus as keyof typeof colores] || "bg-gray-100 text-gray-800"
    );
  };

  const formatearMonto = (monto: number | undefined | null) => {
    if (!monto) return "$0.00";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(monto);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando insumos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notificación procesando */}
      {procesandoExcel && (
        <div className="fixed top-4 right-4 z-50 bg-purple-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>Procesando Excel...</span>
        </div>
      )}

      {/* Breadcrumb */}
      <Breadcrumb />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Package size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Explosión de Insumos</h1>
                  <p className="text-purple-100 mt-1">
                    {cotizacion?.folio || `COT-${cotizacionId}`}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setModalSubirExcel(true)}
                  disabled={!editando || procesandoExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={20} />
                  Subir Excel
                </button>

                <button
                  onClick={exportarExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg"
                >
                  <Download size={20} />
                  Exportar
                </button>

                {editando ? (
                  <button
                    onClick={guardarCambios}
                    disabled={guardando}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg disabled:bg-gray-400"
                  >
                    <Save size={20} />
                    {guardando ? "Guardando..." : "Guardar"}
                  </button>
                ) : (
                  <button
                    onClick={() => setEditando(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit2 size={20} />
                    Editar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Info de la cotización */}
          {cotizacion && (
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cotizacion.cliente && (
                  <div className="flex items-center gap-3">
                    <Building2 size={20} className="text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-600">Cliente</p>
                      <p className="font-semibold text-gray-900">
                        {cotizacion.cliente}
                      </p>
                    </div>
                  </div>
                )}
                {cotizacion.obra && (
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-600">Obra</p>
                      <p className="font-semibold text-gray-900">
                        {cotizacion.obra}
                      </p>
                    </div>
                  </div>
                )}
                {cotizacion.total && (
                  <div className="flex items-center gap-3">
                    <DollarSign size={20} className="text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-600">Total Cotización</p>
                      <p className="font-semibold text-gray-900">
                        {formatearMonto(cotizacion.total)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Insumos</p>
            <p className="text-2xl font-bold text-gray-900">
              {insumos.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">
              {insumos.filter((i) => i.estatus === "pendiente").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Requisitados</p>
            <p className="text-2xl font-bold text-blue-600">
              {insumos.filter((i) => i.estatus === "requisitado").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Entregados</p>
            <p className="text-2xl font-bold text-green-600">
              {insumos.filter((i) => i.estatus === "entregado").length}
            </p>
          </div>
        </div>

        {/* Tabla de Insumos */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Lista de Insumos
            </h2>
            {editando && (
              <button
                onClick={agregarInsumo}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus size={20} />
                Agregar Insumo
              </button>
            )}
          </div>

          {insumos.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay insumos registrados
              </h3>
              <p className="text-gray-600 mb-4">
                Agrega insumos manualmente o sube un archivo Excel
              </p>
              {editando && (
                <button
                  onClick={agregarInsumo}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus size={20} />
                  Agregar Primer Insumo
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ITEM #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Unidad de medida
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Periodo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Precio / Hora
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      VALOR TOTAL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estatus
                    </th>
                    {editando && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {insumos.map((insumo) => (
                    <tr key={insumo.id} className="hover:bg-gray-50">
                      {/* ITEM # */}
                      <td className="px-4 py-3">
                        {editando ? (
                          <input
                            type="text"
                            value={insumo.item_number}
                            onChange={(e) =>
                              actualizarInsumo(
                                insumo.id,
                                "item_number",
                                e.target.value
                              )
                            }
                            className="w-24 px-2 py-1 border rounded text-sm"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">
                            {insumo.item_number}
                          </span>
                        )}
                      </td>

                      {/* Descripción */}
                      <td className="px-4 py-3">
                        {editando ? (
                          <input
                            type="text"
                            value={insumo.descripcion}
                            onChange={(e) =>
                              actualizarInsumo(
                                insumo.id,
                                "descripcion",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">
                            {insumo.descripcion}
                          </span>
                        )}
                      </td>

                      {/* Unidad de medida */}
                      <td className="px-4 py-3">
                        {editando ? (
                          <input
                            type="text"
                            value={insumo.unidad_medida}
                            onChange={(e) =>
                              actualizarInsumo(
                                insumo.id,
                                "unidad_medida",
                                e.target.value
                              )
                            }
                            className="w-20 px-2 py-1 border rounded"
                          />
                        ) : (
                          <span className="text-sm text-gray-600">
                            {insumo.unidad_medida}
                          </span>
                        )}
                      </td>

                      {/* Cantidad */}
                      <td className="px-4 py-3 text-right">
                        {editando ? (
                          <input
                            type="number"
                            value={insumo.cantidad}
                            onChange={(e) =>
                              actualizarInsumo(
                                insumo.id,
                                "cantidad",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24 px-2 py-1 border rounded text-right"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">
                            {insumo.cantidad}
                          </span>
                        )}
                      </td>

                      {/* Periodo */}
                      <td className="px-4 py-3">
                        {editando ? (
                          <input
                            type="text"
                            value={insumo.periodo || ""}
                            onChange={(e) =>
                              actualizarInsumo(
                                insumo.id,
                                "periodo",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        ) : (
                          <span className="text-sm text-gray-600">
                            {insumo.periodo || "-"}
                          </span>
                        )}
                      </td>

                      {/* Precio / Hora */}
                      <td className="px-4 py-3 text-right">
                        {editando ? (
                          <input
                            type="number"
                            step="0.01"
                            value={insumo.precio_hora || ""}
                            onChange={(e) =>
                              actualizarInsumo(
                                insumo.id,
                                "precio_hora",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-28 px-2 py-1 border rounded text-right"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">
                            {insumo.precio_hora
                              ? formatearMonto(insumo.precio_hora)
                              : "-"}
                          </span>
                        )}
                      </td>

                      {/* VALOR TOTAL */}
                      <td className="px-4 py-3 text-right">
                        {editando ? (
                          <input
                            type="number"
                            step="0.01"
                            value={insumo.valor_total}
                            onChange={(e) =>
                              actualizarInsumo(
                                insumo.id,
                                "valor_total",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-32 px-2 py-1 border rounded text-right font-medium"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">
                            {formatearMonto(insumo.valor_total)}
                          </span>
                        )}
                      </td>

                      {/* Estatus */}
                      <td className="px-4 py-3">
                        {editando ? (
                          <select
                            value={insumo.estatus}
                            onChange={(e) =>
                              actualizarInsumo(
                                insumo.id,
                                "estatus",
                                e.target.value
                              )
                            }
                            className="px-2 py-1 border rounded text-sm"
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="requisitado">Requisitado</option>
                            <option value="comprado">Comprado</option>
                            <option value="entregado">Entregado</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2 py-1 rounded text-xs ${obtenerColorEstatus(insumo.estatus)}`}
                          >
                            {insumo.estatus}
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      {editando && (
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => eliminarInsumo(insumo.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal subir Excel */}
      {modalSubirExcel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Subir Excel de Insumos</h3>
            <p className="text-gray-600 mb-4">
              Sube un archivo Excel con la lista de insumos
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 hover:border-purple-400 transition-colors">
              <Upload size={48} className="mx-auto text-gray-400 mb-3" />
              <label className="cursor-pointer">
                <span className="text-purple-600 hover:text-purple-700 font-medium text-lg">
                  Seleccionar archivo Excel
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleSubirExcel}
                  className="hidden"
                  disabled={procesandoExcel}
                />
              </label>
              <p className="text-xs text-gray-500 mt-3">
                Formato: ITEM # | Descripción | Unidad de medida | Cantidad | Periodo | Precio/Hora | VALOR TOTAL
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalSubirExcel(false)}
                disabled={procesandoExcel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
