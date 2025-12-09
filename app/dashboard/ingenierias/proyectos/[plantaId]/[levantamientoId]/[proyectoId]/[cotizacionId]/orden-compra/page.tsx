"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { useGoBackOneSegment } from "@/components/breadcrumb";
import {
  obtenerCotizacionPorId,
  obtenerOrdenCompraPorCotizacion,
  crearOrdenCompra,
} from "@/utils/api/ing-proyectos";

interface Cotizacion {
  id: number;
  folio: string;
  proyecto_id: number;
  cliente?: string;
  obra?: string;
  fecha: string;
  subtotal: number;
  iva: number;
  total: number;
  tiene_orden_compra: boolean;
}

interface OrdenCompra {
  id: number;
  cotizacion_id: number;
  folio: string;
  proveedor?: string;
  fecha_orden: string;
  fecha_entrega_estimada?: string;
  subtotal: number;
  iva: number;
  total: number;
  estado: "pendiente" | "enviada" | "recibida" | "cancelada";
  notas?: string;
  archivo?: {
    id: number;
    nombre_archivo: string;
    contenido_base64: string;
  };
}

interface PdfData {
  pdfBase64?: string;
  pdfNombre?: string;
}

export default function OrdenCompraPage() {
  const router = useRouter();
  const params = useParams();

  // const levantamientoId = params.levantamientoId as string;
  // const proyectoId = params.proyectoId as string;
  const cotizacionId = Number(params.cotizacionId);

  const [loading, setLoading] = useState(true);
  const [subiendoPDF, setSubiendoPDF] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [escala, setEscala] = useState(100);
  const [pdfData, setPdfData] = useState<PdfData>({});

  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [ordenCompra, setOrdenCompra] = useState<OrdenCompra | null>(null);


  const volverACotizacion = useGoBackOneSegment();
  // Cargar datos al montar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        // Cargar cotización
        const cotData = await obtenerCotizacionPorId(cotizacionId);
        setCotizacion(cotData);

        // Si ya tiene orden de compra, cargarla
        if (cotData.tiene_orden_compra) {
          const ordenData = await obtenerOrdenCompraPorCotizacion(cotizacionId);
          setOrdenCompra(ordenData);

          // Si tiene PDF, mostrarlo
          if (ordenData.archivo?.contenido_base64) {
            setPdfData({
              pdfBase64: `data:application/pdf;base64,${ordenData.archivo.contenido_base64}`,
              pdfNombre: ordenData.archivo.nombre_archivo,
            });
          }
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        toast.error("Error al cargar los datos");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [cotizacionId, router]);

  const manejarCargaPDF = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.warning("Solo se permiten archivos PDF");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo es demasiado grande (máximo 10MB)");
      return;
    }

    setSubiendoPDF(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPdfData({
        pdfBase64: base64,
        pdfNombre: file.name,
      });
      setEscala(100);
      toast.success("PDF cargado correctamente");
      setSubiendoPDF(false);
    };

    reader.onerror = () => {
      toast.error("Error al leer el archivo");
      setSubiendoPDF(false);
    };

    reader.readAsDataURL(file);
  };

  const eliminarPDF = () => {
    if (window.confirm("¿Estás seguro de eliminar el PDF?")) {
      setPdfData({});
      toast.info("PDF eliminado");
    }
  };

  const descargarPDF = () => {
    if (!pdfData.pdfBase64) return;

    const link = document.createElement("a");
    link.href = pdfData.pdfBase64;
    link.download = pdfData.pdfNombre || "orden_compra.pdf";
    link.click();
  };

  const guardarOrdenCompra = async () => {
    if (!pdfData.pdfBase64 || !cotizacion) {
      toast.error("Debes cargar un PDF primero");
      return;
    }

    try {
      setGuardando(true);

      // Extraer el base64 puro (sin el prefijo data:application/pdf;base64,)
      const base64Puro = pdfData.pdfBase64.split(",")[1];

      // Debug: verificar valores
      console.log("Cotización:", cotizacion);
      console.log("Subtotal:", cotizacion.subtotal, "Tipo:", typeof cotizacion.subtotal);
      console.log("IVA:", cotizacion.iva, "Tipo:", typeof cotizacion.iva);
      console.log("Total:", cotizacion.total, "Tipo:", typeof cotizacion.total);

      const subtotal = parseFloat(String(cotizacion.subtotal || 0));
      const iva = parseFloat(String(cotizacion.iva || 0));
      const total = parseFloat(String(cotizacion.total || 0));

      console.log("Convertidos - Subtotal:", subtotal, "IVA:", iva, "Total:", total);

      // Crear orden de compra con PDF
      const resultado = await crearOrdenCompra({
        cotizacion_id: cotizacionId,
        proveedor: cotizacion.cliente || "",
        fecha_orden: new Date().toISOString().split("T")[0],
        subtotal,
        iva,
        total,
        notas: "",
        pdf: {
          nombre_archivo: pdfData.pdfNombre || "orden_compra.pdf",
          tipo_mime: "application/pdf",
          tamano_bytes: Math.round((base64Puro.length * 3) / 4), // Aproximación del tamaño
          contenido_base64: base64Puro,
          descripcion: "PDF de Orden de Compra",
        },
      });

      toast.success(`Orden de Compra guardada exitosamente - ${resultado.folio}`, {
        autoClose: 3000,
      });

      // Redirigir después de guardar
      setTimeout(() => {
        // router.push(
        //   `/dashboard/ingenierias/proyectos/${levantamientoId}/${proyectoId}/${cotizacionId}`
        // );
        volverACotizacion();
      }, 2000);
    } catch (error) {
      console.error("Error guardando orden de compra:", error);
      toast.error("Error al guardar la orden de compra");
    } finally {
      setGuardando(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando orden de compra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={volverACotizacion}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium"
          >
            ← Volver a Cotización
          </button>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📦</span>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Orden de Compra
                  </h1>
                  {cotizacion && (
                    <>
                      <p className="text-sm text-gray-500 mt-1">
                        {cotizacion.obra} - {cotizacion.cliente}
                      </p>
                      <div className="flex gap-4 text-xs text-gray-500 mt-1">
                        <span>💰 Cotización: {cotizacion.folio}</span>
                        {ordenCompra?.folio && (
                          <span className="text-green-600 font-medium">
                            📋 OC: {ordenCompra.folio}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {cotizacion?.tiene_orden_compra && (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium">
                    ✓ Orden Registrada
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel del Visor PDF */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-red-600">📄</span>
              Documento PDF de Orden de Compra
            </h2>

            {pdfData.pdfBase64 && (
              <div className="flex gap-2">
                <button
                  onClick={descargarPDF}
                  className="text-blue-600 hover:text-blue-800 p-2 text-xl"
                  title="Descargar PDF"
                >
                  ⬇️
                </button>
                <button
                  onClick={eliminarPDF}
                  className="text-red-600 hover:text-red-800 p-2 text-xl"
                  title="Eliminar PDF"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>

          {!pdfData.pdfBase64 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <label className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <span className="text-6xl">📤</span>
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      Cargar PDF de Orden de Compra
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Click para seleccionar o arrastra el archivo
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Máximo 10MB</p>
                  </div>
                  {subiendoPDF && (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  )}
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={manejarCargaPDF}
                  className="hidden"
                  disabled={subiendoPDF || cotizacion?.tiene_orden_compra}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Controles del PDF */}
              <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Zoom: {escala}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEscala((prev) => Math.max(50, prev - 10))}
                    disabled={escala <= 50}
                    className="px-3 py-1 bg-white rounded hover:bg-gray-200 disabled:opacity-50 font-bold"
                    title="Alejar"
                  >
                    -
                  </button>
                  <button
                    onClick={() => setEscala(100)}
                    className="px-3 py-1 bg-white rounded hover:bg-gray-200 text-sm"
                  >
                    100%
                  </button>
                  <button
                    onClick={() =>
                      setEscala((prev) => Math.min(200, prev + 10))
                    }
                    disabled={escala >= 200}
                    className="px-3 py-1 bg-white rounded hover:bg-gray-200 disabled:opacity-50 font-bold"
                    title="Acercar"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Visor PDF con iframe */}
              <div
                className="border rounded-lg overflow-hidden bg-gray-100"
                style={{ height: "600px" }}
              >
                <iframe
                  src={pdfData.pdfBase64}
                  className="w-full h-full"
                  style={{
                    transform: `scale(${escala / 100})`,
                    transformOrigin: "top left",
                    width: `${100 / (escala / 100)}%`,
                    height: `${100 / (escala / 100)}%`,
                  }}
                  title="PDF Viewer"
                />
              </div>

              {pdfData.pdfNombre && (
                <p className="text-xs text-gray-500 text-center">
                  📄 {pdfData.pdfNombre}
                </p>
              )}

              {/* Botón de Guardar - solo si NO tiene orden de compra */}
              {!cotizacion?.tiene_orden_compra && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={guardarOrdenCompra}
                    disabled={guardando}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-gray-400 font-semibold transition-colors"
                  >
                    {guardando ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Guardando...
                      </>
                    ) : (
                      <>💾 Guardar Orden de Compra</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
