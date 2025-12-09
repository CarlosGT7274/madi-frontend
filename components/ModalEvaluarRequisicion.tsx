"use client";

import { useState, useEffect } from "react";
import {
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaShoppingCart,
  FaBox,
  FaClipboardCheck,
  FaSpinner,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { evaluarRequisicion as apiEvaluarRequisicion } from "../utils/api/requisicion";

type EstatusLite = { nombre?: string } | null | undefined;

interface MaterialDeReq {
  id: number;
  material: string;
  descripcion?: string;
  cantidad: number;
  unidadMedida: string;
  inventarioActual?: number | null;
  cantidadEntregada?: number | null;
  estatus?: EstatusLite;
  observacion?: string | null;
  sugerenciaCompra?: number | null;
}

interface RequisicionLite {
  id: number;
  folio: string;
  origen: string;
  materiales: MaterialDeReq[];
}

interface MaterialEvaluado {
  id: number;
  material: string;
  cantidad: number;
  unidadMedida: string;
  cantidadEntregada: number;
  enviarACompras: boolean;
  observacion: string;
  sugerenciaCompra: number;
  editable: boolean;
  mostrarLeyenda?: string;
  restanteInventario?: number;
  mensajeInventario?: string;
  colorInventario?: string;
  inventarioActual?: number;
}

interface Props {
  requisicion: RequisicionLite;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalEvaluarRequisicion({
  requisicion,
  onClose,
  onSuccess,
}: Props) {
  const [materiales, setMateriales] = useState<MaterialEvaluado[]>([]);
  const [resumen, setResumen] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Helpers de UI/estado ---
  const prepararMaterial = (mat: MaterialDeReq): MaterialEvaluado => {
    const estatusNombre = (mat.estatus?.nombre || "").toLowerCase();
    const yaEntregado = estatusNombre === "compra entregada";
    const inventario = Number(mat.inventarioActual ?? 0);
    const entregadaInicial = Number(mat.cantidadEntregada ?? 0);

    const faltante = Math.max(0, mat.cantidad - entregadaInicial);
    const sugerencia = inventario >= faltante ? 0 : faltante - inventario;
    const restanteInventario = Math.max(0, inventario - entregadaInicial);
    const puedeActualizar = yaEntregado && inventario >= faltante;

    const suficiente = sugerencia === 0;
    const mensajeInventario = suficiente
      ? `Inventario suficiente: ${inventario} disponibles`
      : `Faltan ${sugerencia} piezas — se puede enviar a compras`;

    return {
      id: mat.id,
      material: mat.material,
      cantidad: mat.cantidad,
      unidadMedida: mat.unidadMedida,
      cantidadEntregada: entregadaInicial,
      enviarACompras: !yaEntregado && !suficiente,
      observacion: (mat.observacion ?? "").toString(),
      sugerenciaCompra: sugerencia,
      editable: !yaEntregado || puedeActualizar,
      mostrarLeyenda: yaEntregado
        ? puedeActualizar
          ? "Ya puedes actualizar el inventario"
          : "Este material ya fue entregado y no puede ser modificado"
        : undefined,
      restanteInventario,
      inventarioActual: inventario,
      mensajeInventario,
      colorInventario: suficiente ? "text-green-600" : "text-red-600",
    };
  };

  useEffect(() => {
    if (!requisicion) return;
    setMateriales(requisicion.materiales.map(prepararMaterial));
  }, [requisicion]);

  const handleChange = (
    index: number,
    field: keyof MaterialEvaluado,
    value: string | number | boolean
  ) => {
    setMateriales((prev) => {
      const copia = [...prev];
      if (!copia[index].editable) return copia;

      if (field === "cantidadEntregada" && typeof value === "number") {
        const cantidadEntregada = Math.max(
          0,
          Math.min(value, copia[index].cantidad)
        );
        const inventario = Number(copia[index].inventarioActual || 0);
        const faltante = copia[index].cantidad - cantidadEntregada;

        copia[index].cantidadEntregada = cantidadEntregada;
        copia[index].restanteInventario = Math.max(
          0,
          inventario - cantidadEntregada
        );

        const sugerencia = Math.max(0, faltante - inventario);
        copia[index].sugerenciaCompra = sugerencia;

        const suficiente = inventario >= faltante;
        copia[index].mensajeInventario = suficiente
          ? `Inventario suficiente: ${inventario} disponibles`
          : `Faltan ${sugerencia} piezas — se puede enviar a compras`;
        copia[index].colorInventario = suficiente
          ? "text-green-600"
          : "text-red-600";
        copia[index].enviarACompras = !suficiente;

        return copia;
      }

      // cualquier otro campo
      // @ts-expect-error: asignación dinámica segura por control de tipos arriba
      copia[index][field] = value;
      return copia;
    });
  };

  const getStatusIcon = (m: MaterialEvaluado) => {
    if (m.cantidadEntregada === m.cantidad)
      return <FaCheckCircle className="text-green-500" />;
    if (m.cantidadEntregada > 0)
      return <FaInfoCircle className="text-yellow-500" />;
    return <FaTimesCircle className="text-red-500" />;
  };

  const getProgressWidth = (m: MaterialEvaluado) =>
    (m.cantidadEntregada / m.cantidad) * 100;

  // --- Guardado ---
  const handleSubmit = async () => {
    // Validación: si va a compras, observación obligatoria
    const faltanObs = materiales.some(
      (m) => m.editable && m.enviarACompras && !m.observacion?.trim()
    );
    if (faltanObs) {
      toast.error(
        "Agrega una observación para cada material enviado a compras."
      );
      return;
    }

    // Armado DTO backend
    const payload = {
      requisicionId: requisicion.id,
      evaluador:
        (typeof window !== "undefined" &&
          JSON.parse(localStorage.getItem("usuario") || "{}")?.correo) ||
        (typeof window !== "undefined" &&
          JSON.parse(localStorage.getItem("usuario") || "{}")?.nombre) ||
        "Sistema",
      materiales: materiales
        .filter((m) => m.editable)
        .map((m) => ({
          id: m.id,
          cantidadEntregada: Number(m.cantidadEntregada) || 0,
          enviarACompras: !!m.enviarACompras,
          observacion: m.observacion?.trim() || null,
          sugerenciaCompra: m.enviarACompras
            ? Number(m.sugerenciaCompra || 0)
            : 0,
        })),
    };

    try {
      setIsSubmitting(true);
      await apiEvaluarRequisicion(payload);

      const enviados = payload.materiales.filter(
        (x) => x.enviarACompras
      ).length;
      const entregados = payload.materiales.length - enviados;

      setResumen(
        `Cambios guardados. ${enviados} enviado(s) a compras, ${entregados} entregado(s) desde almacén.`
      );

      toast.success("Evaluación guardada correctamente ✅");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "No se pudo guardar la evaluación";
      toast.error(message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UI ---
  if (!requisicion) return null;

  return (
    <div className="fixed inset-0 bg-black/0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform animate-modal-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FaClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Evaluar Requisición</h2>
                <p className="text-blue-100 text-sm">
                  {requisicion.folio} - {requisicion.origen}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mensaje éxito */}
        {resumen && (
          <div className="mx-6 mt-4 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaCheckCircle className="text-green-600" />
            <span className="font-medium">{resumen}</span>
          </div>
        )}

        {/* Lista materiales */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {materiales.map((material, index) => (
              <div
                key={material.id}
                className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Encabezado material */}
                <div className="p-6 bg-white border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(material)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {material.material}
                        </h3>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <FaBox className="w-4 h-4" />
                          Solicitado: {material.cantidad}{" "}
                          {material.unidadMedida}
                        </span>
                        <span>
                          Entregado: {material.cantidadEntregada} de{" "}
                          {material.cantidad}
                        </span>
                        {material.inventarioActual !== undefined && (
                          <span>Inventario: {material.inventarioActual}</span>
                        )}
                      </div>

                      {/* Barra de progreso */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progreso de entrega</span>
                          <span>{Math.round(getProgressWidth(material))}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              getProgressWidth(material) === 100
                                ? "bg-green-500"
                                : getProgressWidth(material) > 0
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${getProgressWidth(material)}%` }}
                          />
                        </div>
                      </div>

                      {/* Mensajes de estado */}
                      {material.mostrarLeyenda && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm mb-3">
                          <FaInfoCircle className="inline mr-2" />
                          {material.mostrarLeyenda}
                        </div>
                      )}

                      {material.mensajeInventario && (
                        <div
                          className={`px-3 py-2 rounded-lg text-sm font-medium mb-3 ${
                            material.colorInventario === "text-green-600"
                              ? "bg-green-50 border border-green-200 text-green-700"
                              : "bg-red-50 border border-red-200 text-red-700"
                          }`}
                        >
                          {material.colorInventario === "text-green-600" ? (
                            <FaCheckCircle className="inline mr-2" />
                          ) : (
                            <FaExclamationTriangle className="inline mr-2" />
                          )}
                          {material.mensajeInventario}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controles del material */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cantidad a entregar */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad a entregar
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={material.cantidad}
                          value={material.cantidadEntregada}
                          onChange={(e) =>
                            handleChange(
                              index,
                              "cantidadEntregada",
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={!material.editable}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:bg-gray-100"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          {material.unidadMedida}
                        </span>
                      </div>
                    </div>

                    {/* Enviar a compras + sugerencia */}
                    {material.inventarioActual !== undefined &&
                      material.inventarioActual <
                        material.cantidad - material.cantidadEntregada && (
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`compras-${material.id}`}
                              checked={material.enviarACompras}
                              disabled={!material.editable}
                              onChange={(e) =>
                                handleChange(
                                  index,
                                  "enviarACompras",
                                  e.target.checked
                                )
                              }
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                            />
                            <label
                              htmlFor={`compras-${material.id}`}
                              className="ml-2 flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                              <FaShoppingCart className="w-4 h-4 text-blue-600" />
                              Enviar a compras
                            </label>
                          </div>

                          {material.enviarACompras && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cantidad sugerida a comprar
                              </label>
                              <input
                                type="number"
                                value={material.sugerenciaCompra}
                                disabled
                                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                              />
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones
                      {material.enviarACompras && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    <textarea
                      value={material.observacion}
                      onChange={(e) =>
                        handleChange(index, "observacion", e.target.value)
                      }
                      readOnly={!material.editable}
                      rows={3}
                      placeholder={
                        material.enviarACompras
                          ? "Describe el motivo por el cual se envía a compras..."
                          : "Observaciones adicionales (opcional)"
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                        !material.editable
                          ? "bg-gray-100 text-gray-600"
                          : material.enviarACompras &&
                            !material.observacion.trim()
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    />
                  </div>

                  {/* Inventario restante */}
                  {typeof material.restanteInventario === "number" && (
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <span className="text-sm text-gray-600">
                        Inventario restante después de entrega:
                        <span className="font-medium text-gray-900 ml-1">
                          {material.restanteInventario} {material.unidadMedida}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <FaCheck />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-in {
          animation: modal-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
