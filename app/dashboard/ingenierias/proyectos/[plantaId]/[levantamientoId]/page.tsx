"use client";

import { JSX, useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import {
  Building2,
  Calendar,
  MapPin,
  User,
  Mail,
  FileText,
  Plus,
  FolderOpen,
  Upload,
  CheckCircle,
  X,
  Lock,
} from "lucide-react";
import * as XLSX from "xlsx";
import Image from "next/image";
import { Breadcrumb } from "@/components/breadcrumb";
import {
  obtenerPlantaPorId,
  obtenerLevantamientoPorId,
  obtenerProyectosPorLevantamiento,
  obtenerArchivosPorLevantamiento,
  crearProyecto,
  crearCotizacion,
  actualizarCotizacion
} from "@/utils/api/ing-proyectos";
import { toast } from "react-toastify";

// Interfaces
interface Levantamiento {
  id: number;
  planta_id: number;
  folio: string;
  nombre: string;
  cliente: string;
  planta_nombre?: string;
  obra?: string;
  solicitante?: string;
  fecha_solicitud?: string;
  usuario_requiriente?: string;
  correo_usuario?: string;
  area_trabajo?: string;
  titulo_cotizacion?: string;
  trabajos_alturas_aplica: boolean;
  trabajos_alturas_certificado: boolean;
  trabajos_alturas_notas?: string;
  espacios_confinados_aplica: boolean;
  espacios_confinados_certificado: boolean;
  espacios_confinados_notas?: string;
  corte_soldadura_aplica: boolean;
  corte_soldadura_certificado: boolean;
  corte_soldadura_notas?: string;
  izaje_aplica: boolean;
  izaje_certificado: boolean;
  izaje_notas?: string;
  apertura_lineas_aplica: boolean;
  apertura_lineas_certificado: boolean;
  apertura_lineas_notas?: string;
  excavacion_aplica: boolean;
  excavacion_certificado: boolean;
  excavacion_notas?: string;
  notas_maquinaria?: string;
  fecha_creacion: string;
  fecha_modificacion?: string;
  proyectos?: Proyecto[];
  archivos?: Archivo[];
}

interface Proyecto {
  id: number;
  levantamiento_id: number;
  folio: string;
  nombre: string;
  descripcion?: string;
  bloqueado: number;
  motivo_bloqueo?: string;
  fecha_creacion: string;
  fecha_modificacion?: string;
  cotizaciones?: Cotizacion[];
}

interface Cotizacion {
  id: number;
  proyecto_id: number;
  folio: string;
  fecha: string;
  subtotal: string;
  iva: string;
  total: string;
  estado: string;
  fecha_aprobacion?: string;
  tiene_partidas: number;
  tiene_insumos: number;
  tiene_orden_compra: number;
  usuario_id: number;
  fecha_creacion: string;
  fecha_modificacion?: string;
  partidas?: Partida[];
  insumos?: Insumo[];
}

interface Partida {
  id: number;
  cotizacion_id: number;
  numero_partida: number;
  descripcion: string;
  cantidad: string;
  unidad: string;
  precio_unitario: string;
  importe: string;
  fecha_creacion: string;
  fecha_modificacion?: string;
}

interface Insumo {
  id: number;
  // Definir propiedades de insumo según tu API
  [key: string]: unknown;
}

interface Archivo {
  id: number;
  nombre_archivo: string;
  tipo: string;
  tipo_mime: string;
  contenido_base64: string;
  descripcion?: string;
  orden?: number;
  fecha_creacion: string;
}

interface Planta {
  id: number;
  folio: string;
  nombre: string;
  fecha_creacion: string;
}

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol_id: number;
}

interface PartidaExtraida {
  id: string;
  numero: string;
  concepto: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

interface BufferData {
  type: "Buffer";
  data: number[];
}

// Tipo para el objeto de error de la API
interface ApiError extends Error {
  response?: {
    data?: {
      message: string;
    };
  };
}

export default function LevantamientoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const plantaId = Number(params.plantaId);
  const levantamientoId = Number(params.levantamientoId);
  const pathname = usePathname();

  const [procesandoExcel, setProcesandoExcel] = useState(false);
  const [modalCrearProyecto, setModalCrearProyecto] = useState(false);
  const [planta, setPlanta] = useState<Planta | null>(null);
  const [levantamiento, setLevantamiento] = useState<Levantamiento | null>(null);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);

  const obtenerUsuarioActual = (): Usuario | null => {
    try {
      const cookies = document.cookie.split(";");
      const usuarioCookie = cookies.find((c) => c.trim().startsWith("usuario="));
      if (usuarioCookie) {
        const usuarioData = JSON.parse(decodeURIComponent(usuarioCookie.split("=")[1]));
        return usuarioData.usuario;
      }
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
    }
    return null;
  };

  const bufferToNumber = (buffer: BufferData | number): number => {
    if (typeof buffer === 'number') return buffer;
    if (!buffer || !buffer.data) return 0;
    return buffer.data[0] || 0;
  };

  const verificarProyectoBloqueado = (proyecto: Proyecto): boolean => {
    if (proyecto.bloqueado === 1) return true;

    if (proyecto.cotizaciones?.some(cot => {
      const tieneOC = bufferToNumber(cot.tiene_orden_compra);
      return tieneOC === 1;
    })) {
      return true;
    }

    return false;
  };

  useEffect(() => {
    const cargarDatos = async (): Promise<void> => {
      try {
        setCargando(true);

        const plantaData = await obtenerPlantaPorId(plantaId);
        setPlanta(plantaData);

        const levData = await obtenerLevantamientoPorId(levantamientoId);
        setLevantamiento(levData);

        const proysData = await obtenerProyectosPorLevantamiento(levantamientoId);
        setProyectos(proysData);

        const archivosData = await obtenerArchivosPorLevantamiento(levantamientoId);
        setLevantamiento(prev => prev ? { ...prev, archivos: archivosData } : null);

      } catch (error) {
        console.error("Error cargando datos:", error);
        router.push(`/dashboard/ingenierias/proyectos/${plantaId}`);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [levantamientoId, plantaId, router]);

  const buscarProyectoExistente = async (nombreProyecto: string): Promise<Proyecto | null> => {
    try {
      const proyectosExistentes = await obtenerProyectosPorLevantamiento(levantamientoId);
      return proyectosExistentes.find((proy: Proyecto) =>
        proy.nombre.toLowerCase() === nombreProyecto.toLowerCase()
      ) || null;
    } catch (error) {
      console.error('Error buscando proyecto existente:', error);
      return null;
    }
  };

  // ==========================================
  // FUNCIONES DE PROCESAMIENTO DE EXCEL
  // ==========================================

  const buscarValor = (data: string[][], patrones: string[]): string => {
    for (const patron of patrones) {
      const patronUpper = patron.toUpperCase();
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const celda = data[i][j]?.toString().toUpperCase() || "";
          if (celda.includes(patronUpper)) {
            for (let k = j + 1; k < data[i].length; k++) {
              if (data[i][k] && data[i][k].toString().trim()) {
                return data[i][k].toString().trim();
              }
            }
            if (i + 1 < data.length) {
              for (let k = 0; k < data[i + 1].length; k++) {
                if (data[i + 1][k] && data[i + 1][k].toString().trim()) {
                  return data[i + 1][k].toString().trim();
                }
              }
            }
          }
        }
      }
    }
    return "";
  };

  const extraerPartidas = (data: string[][]): PartidaExtraida[] => {
    const partidas: PartidaExtraida[] = [];
    let indexInicio = -1;

    for (let i = 0; i < data.length; i++) {
      const fila = data[i];
      const filaStr = fila.join(" ").toUpperCase();
      if (
        filaStr.includes("NO.") ||
        filaStr.includes("CONCEPTO") ||
        filaStr.includes("UNIDAD")
      ) {
        indexInicio = i + 1;
        break;
      }
    }

    if (indexInicio === -1) return partidas;

    for (let i = indexInicio; i < data.length; i++) {
      const fila = data[i];

      if (
        fila.some((celda) =>
          celda?.toString().toUpperCase().includes("SUBTOTAL"),
        )
      ) {
        break;
      }

      const primeraCelda = fila[0]?.toString().trim();
      const esSubpartida = /^\d+\.\d+$/.test(primeraCelda);
      const esCategoriaPrincipal = /^\d+$/.test(primeraCelda);

      if (esCategoriaPrincipal) continue;

      if (esSubpartida && primeraCelda) {
        let concepto = "";
        let unidad = "";
        let cantidad = 0;
        let precioUnitario = 0;
        let total = 0;

        for (let j = 1; j < fila.length; j++) {
          if (fila[j] && !concepto && isNaN(Number(fila[j]))) {
            concepto = fila[j].toString().trim();
            break;
          }
        }

        const valoresNumericos: number[] = [];
        for (let j = fila.length - 1; j >= 0; j--) {
          const valor = fila[j];
          if (
            valor &&
            !isNaN(parseFloat(valor?.toString().replace(/[$,]/g, "")))
          ) {
            valoresNumericos.unshift(
              parseFloat(valor.toString().replace(/[$,]/g, "")),
            );
          }
        }

        if (valoresNumericos.length >= 3) {
          total = valoresNumericos[valoresNumericos.length - 1];
          precioUnitario = valoresNumericos[valoresNumericos.length - 2];
          cantidad = valoresNumericos[valoresNumericos.length - 3];
        }

        for (let j = fila.length - 4; j >= 2; j--) {
          if (fila[j] && isNaN(Number(fila[j]))) {
            unidad = fila[j].toString().trim();
            break;
          }
        }

        if (!concepto && i + 1 < data.length) {
          const siguienteFila = data[i + 1];
          if (
            siguienteFila[0] &&
            !/^\d+(\.\d+)?$/.test(siguienteFila[0].toString())
          ) {
            concepto = siguienteFila
              .filter((c) => c)
              .join(" ")
              .trim();
          }
        }

        partidas.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          numero: primeraCelda,
          concepto: concepto || `Partida ${primeraCelda}`,
          unidad: unidad || "Servicio",
          cantidad: cantidad || 1,
          precioUnitario: precioUnitario || 0,
          total: total || 0,
        });
      }
    }

    return partidas;
  };

  const formatearFechaParaAPI = (fechaStr: string): string => {
    if (!fechaStr) {
      return new Date().toISOString().split('T')[0];
    }

    try {
      const fecha = new Date(fechaStr);
      if (!isNaN(fecha.getTime())) {
        return fecha.toISOString().split('T')[0];
      }
      
      const partes = fechaStr.split(/[/\-.]/);
      if (partes.length === 3) {
        let año: string, mes: string, dia: string;
        
        if (partes[0].length === 4) {
          [año, mes, dia] = partes;
        } else if (partes[2].length === 4) {
          [dia, mes, año] = partes;
          if (parseInt(mes) > 12) {
            [mes, dia, año] = partes;
          }
        } else {
          return new Date().toISOString().split('T')[0];
        }
        
        if (año && mes && dia) {
          const fechaFormateada = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
          if (!isNaN(fechaFormateada.getTime())) {
            return fechaFormateada.toISOString().split('T')[0];
          }
        }
      }
      
      return new Date().toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return new Date().toISOString().split('T')[0];
    }
  };

  const procesarExcel = async (file: File): Promise<void> => {
    setProcesandoExcel(true);
    setModalCrearProyecto(false);

    const toastId = toast.loading("📊 Procesando archivo Excel...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, {
        type: "array",
        cellText: true,
        cellDates: true,
        raw: false,
      });

      const sheetName =
        workbook.SheetNames.find(
          (name) =>
            name.toUpperCase().includes("COTIZACION") ||
            name.toUpperCase().includes("COTIZACIÓN"),
        ) || workbook.SheetNames[0];

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        blankrows: false,
      }) as string[][];

      // const para = buscarValor(jsonData, ["PARA:", "PARA"]);
      const cliente = buscarValor(jsonData, ["CLIENTE"]);
      // const direccion = buscarValor(jsonData, ["DIRECCION", "DIRECCIÓN"]);
      const fechaExcel = buscarValor(jsonData, ["FECHA:"]);
      // const vendedor = buscarValor(jsonData, ["VENDEDOR:"]);
      // const proveedor = buscarValor(jsonData, ["PROVEEDOR"]);
      // const correo = buscarValor(jsonData, ["@"]);
      const obra = buscarValor(jsonData, ["OBRA"]);
      const partidas = extraerPartidas(jsonData);

      let subtotal = 0;
      let iva = 0;
      let total = 0;

      for (let i = 0; i < jsonData.length; i++) {
        const fila = jsonData[i];
        const filaStr = fila.join(" ").toUpperCase();

        if (filaStr.includes("SUBTOTAL")) {
          for (let j = 0; j < fila.length; j++) {
            const valor = parseFloat(fila[j]?.toString().replace(/[$,]/g, ""));
            if (!isNaN(valor) && valor > 0) {
              subtotal = valor;
              break;
            }
          }
        } else if (filaStr.includes("I.V.A") || filaStr.includes("IVA")) {
          for (let j = 0; j < fila.length; j++) {
            const valor = parseFloat(fila[j]?.toString().replace(/[$,]/g, ""));
            if (!isNaN(valor) && valor > 0) {
              iva = valor;
              break;
            }
          }
        } else if (filaStr.includes("TOTAL")) {
          for (let j = 0; j < fila.length; j++) {
            const valor = parseFloat(fila[j]?.toString().replace(/[$,]/g, ""));
            if (!isNaN(valor) && valor > 0) {
              total = valor;
              break;
            }
          }
        }
      }

      if (total === 0 && partidas.length > 0) {
        subtotal = partidas.reduce(
          (sum: number, p: PartidaExtraida) => sum + Number(p.total ?? 0),
          0,
        );
        iva = subtotal * 0.16;
        total = subtotal + iva;
      }

      // Obtener usuario actual
      const usuario = obtenerUsuarioActual();
      const usuarioId = usuario?.id;

      // ✅ IMPLEMENTACIÓN CON API
      const nombreProyecto = obra || `Proyecto ${cliente || 'Sin nombre'} - ${new Date().toLocaleDateString()}`;

      toast.update(toastId, {
        render: "🔍 Buscando proyecto existente...",
        type: "info",
        isLoading: true,
      });

      const proyectoExistente = await buscarProyectoExistente(nombreProyecto);
      let proyectoId: number;

      if (proyectoExistente) {
        if (verificarProyectoBloqueado(proyectoExistente)) {
          toast.update(toastId, {
            render: `❌ No se puede actualizar el proyecto "${nombreProyecto}" porque está bloqueado (tiene orden de compra)`,
            type: "error",
            isLoading: false,
            autoClose: 5000,
          });
          return;
        }

        proyectoId = proyectoExistente.id;
        toast.update(toastId, {
          render: `📁 Actualizando proyecto existente: ${nombreProyecto}`,
          type: "info",
          isLoading: true,
        });
      } else {
        toast.update(toastId, {
          render: "📁 Creando nuevo proyecto...",
          type: "info",
          isLoading: true,
        });

        const proyectoData = {
          levantamiento_id: levantamientoId,
          nombre: nombreProyecto,
          descripcion: `Proyecto creado automáticamente desde Excel. Cliente: ${cliente || 'No especificado'}, Obra: ${obra || 'No especificada'}`,
          usuario_id: usuarioId,
        };

        const proyectoResponse = await crearProyecto(proyectoData);
        proyectoId = proyectoResponse.id;
      }

      // Buscar cotización existente
      let cotizacionExistente: Cotizacion | undefined;
      if (proyectoExistente && proyectoExistente.cotizaciones) {
        cotizacionExistente = proyectoExistente.cotizaciones.find(cot =>
          Math.abs(parseFloat(cot.total) - total) < 1 ||
          cot.partidas?.length === partidas.length
        );
      }

      if (cotizacionExistente) {
        toast.update(toastId, {
          render: "💰 Actualizando cotización existente...",
          type: "info",
          isLoading: true,
        });

        const fechaFormateada = formatearFechaParaAPI(fechaExcel);

        await actualizarCotizacion(cotizacionExistente.id, {
          fecha: fechaFormateada,
          subtotal: subtotal,
          iva: iva,
          total: total,
          partidas: partidas.map((partida: PartidaExtraida, index: number) => ({
            // cotizacion_id: cotizacionExistente.id,
            numero_partida: index + 1,
            descripcion: partida.concepto || `Partida ${index + 1}`,
            cantidad: partida.cantidad || 1,
            unidad: partida.unidad || "Servicio",
            precio_unitario: partida.precioUnitario || 0,
            importe: partida.total || 0,
          })),
        });

        toast.update(toastId, {
          render: `✅ ¡Cotización actualizada en proyecto existente!\n\n📁 ${nombreProyecto}\n💰 $${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}\n📊 ${partidas.length} partidas actualizadas`,
          type: "success",
          isLoading: false,
          autoClose: 5000,
        });

      } else {
        toast.update(toastId, {
          render: "💰 Creando nueva cotización...",
          type: "info",
          isLoading: true,
        });

        const fechaFormateada = formatearFechaParaAPI(fechaExcel);

        const cotizacionData = {
          proyecto_id: proyectoId,
          fecha: fechaFormateada,
          subtotal: subtotal,
          iva: iva,
          total: total,
          partidas: partidas.map((partida: PartidaExtraida, index: number) => ({
            numero_partida: index + 1,
            descripcion: partida.concepto || `Partida ${index + 1}`,
            cantidad: partida.cantidad || 1,
            unidad: partida.unidad || "Servicio",
            precio_unitario: partida.precioUnitario || 0,
            importe: partida.total || 0,
          })),
          usuario_id: usuarioId,
        };

        await crearCotizacion(cotizacionData);

        const mensaje = proyectoExistente
          ? `✅ ¡Nueva cotización agregada a proyecto existente!\n\n📁 ${nombreProyecto}\n💰 $${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}\n📊 ${partidas.length} partidas`
          : `✅ ¡Proyecto y cotización creados exitosamente!\n\n📁 ${nombreProyecto}\n💰 $${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}\n📊 ${partidas.length} partidas`;

        toast.update(toastId, {
          render: mensaje,
          type: "success",
          isLoading: false,
          autoClose: 5000,
        });
      }

      // Actualizar lista de proyectos
      const proyectosActualizados = await obtenerProyectosPorLevantamiento(levantamientoId);
      setProyectos(proyectosActualizados);

    } catch (error: unknown) {
      console.error("Error procesando Excel:", error);
      
      let mensajeError = "Error al procesar el archivo Excel";
      const apiError = error as ApiError;
      
      if (apiError.response?.data?.message) {
        mensajeError += `: ${apiError.response.data.message}`;
      } else if (apiError.message) {
        mensajeError += `: ${apiError.message}`;
      }

      toast.update(toastId, {
        render: mensajeError,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setProcesandoExcel(false);
    }
  };

  const handleSubirCotizacion = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls"].includes(ext || "")) {
      toast.error("⚠️ Solo archivos Excel (.xlsx, .xls)");
      return;
    }

    procesarExcel(file);
  };

  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const obtenerColorEstado = (bloqueado: boolean): string => {
    return bloqueado
      ? "bg-red-100 text-red-800"
      : "bg-green-100 text-green-800";
  };

  const TipoTrabajoVista = ({
    titulo,
    aplica,
    certificado,
    notas,
  }: {
    titulo: string;
    aplica: boolean;
    certificado: boolean;
    notas?: string;
  }): JSX.Element | null => {
    if (!aplica) return null;

    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircle size={18} className="text-green-600" />
          {titulo}
        </h3>
        <div className="space-y-2 ml-6">
          <div className="flex items-center gap-2 text-sm">
            {certificado ? (
              <CheckCircle size={16} className="text-green-600" />
            ) : (
              <X size={16} className="text-red-600" />
            )}
            <span className={certificado ? "text-green-700" : "text-red-700"}>
              {certificado
                ? "Personal certificado disponible"
                : "Sin certificación"}
            </span>
          </div>
          {notas && (
            <div className="bg-white p-2 rounded text-sm text-gray-700 border border-gray-200">
              <span className="font-medium">Notas:</span> {notas}
            </div>
          )}
        </div>
      </div>
    );
  };

if (cargando) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Cargando levantamiento...</p>
      </div>
    </div>
  );
}

if (!levantamiento) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 text-lg">Levantamiento no encontrado</p>
        <button
          onClick={() => router.push(`/dashboard/ingenierias/proyectos/${plantaId}`)}
          className="mt-4 text-blue-600 hover:underline"
        >
          Volver a {planta?.nombre || "Planta"}
        </button>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen bg-gray-50">
    {procesandoExcel && (
      <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        <span>Procesando Excel...</span>
      </div>
    )}

    {/* Breadcrumb */}
    <Breadcrumb />

    <div className="max-w-7xl mx-auto p-6">
      {/* INFORMACIÓN DEL LEVANTAMIENTO */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 size={32} />
                <h1 className="text-3xl font-bold">{levantamiento.nombre}</h1>
              </div>
              <span className="inline-block bg-white/20 px-3 py-1 rounded text-sm">
                {levantamiento.folio}
              </span>
            </div>
          </div>
        </div>

        {/* Datos Generales */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Datos Generales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Solicitante</p>
                <p className="font-semibold text-gray-900">
                  {levantamiento.solicitante || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Solicitud</p>
                <p className="font-semibold text-gray-900">
                  {levantamiento.fecha_solicitud
                    ? formatearFecha(levantamiento.fecha_solicitud)
                    : "-"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <MapPin size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Planta</p>
                <p className="font-semibold text-gray-900">
                  {levantamiento.planta_nombre || planta?.nombre || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Mail size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Correo</p>
                <p className="font-semibold text-gray-900">
                  {levantamiento.correo_usuario || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Área de Trabajo</p>
                <p className="font-semibold text-gray-900">
                  {levantamiento.area_trabajo || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tipos de Trabajo */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Tipos de Trabajo Requeridos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TipoTrabajoVista
              titulo="Trabajos en Alturas"
              aplica={levantamiento.trabajos_alturas_aplica}
              certificado={levantamiento.trabajos_alturas_certificado}
              notas={levantamiento.trabajos_alturas_notas}
            />
            <TipoTrabajoVista
              titulo="Espacios Confinados"
              aplica={levantamiento.espacios_confinados_aplica}
              certificado={levantamiento.espacios_confinados_certificado}
              notas={levantamiento.espacios_confinados_notas}
            />
            <TipoTrabajoVista
              titulo="Corte y Soldadura"
              aplica={levantamiento.corte_soldadura_aplica}
              certificado={levantamiento.corte_soldadura_certificado}
              notas={levantamiento.corte_soldadura_notas}
            />
            <TipoTrabajoVista
              titulo="Izaje"
              aplica={levantamiento.izaje_aplica}
              certificado={levantamiento.izaje_certificado}
              notas={levantamiento.izaje_notas}
            />
            <TipoTrabajoVista
              titulo="Apertura de Líneas"
              aplica={levantamiento.apertura_lineas_aplica}
              certificado={levantamiento.apertura_lineas_certificado}
              notas={levantamiento.apertura_lineas_notas}
            />
            <TipoTrabajoVista
              titulo="Excavación"
              aplica={levantamiento.excavacion_aplica}
              certificado={levantamiento.excavacion_certificado}
              notas={levantamiento.excavacion_notas}
            />
          </div>
        </div>

        {/* Imágenes de Equipos */}
        {levantamiento.archivos && levantamiento.archivos.filter(archivo => archivo.tipo === 'imagen').length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Imágenes de Equipos ({levantamiento.archivos.filter(archivo => archivo.tipo === 'imagen').length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {levantamiento.archivos
                .filter(archivo => archivo.tipo === 'imagen')
                .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                .map((img) => {
                  // ✅ CONVERTIR BASE64 A URL
                  const imageUrl = `data:${img.tipo_mime};base64,${img.contenido_base64}`;

                  return (
                    <div key={img.id} className="relative group">
                      <div className="relative aspect-square">
                        <Image
                          src={imageUrl}
                          alt={img.descripcion || img.nombre_archivo}
                          width={150}
                          height={150}
                          className="w-full h-full object-cover rounded-lg border border-gray-300 shadow-sm"
                          onError={(e) => {
                            // Fallback si hay error cargando la imagen
                            console.error('Error cargando imagen:', img.nombre_archivo);
                            e.currentTarget.src = '/placeholder-image.jpg';
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {img.nombre_archivo}
                      </p>
                      {img.descripcion && (
                        <p className="text-xs text-gray-500 truncate">
                          {img.descripcion}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
            {levantamiento.notas_maquinaria && (
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm font-semibold text-yellow-800 mb-1">
                  Notas sobre Equipos:
                </p>
                <p className="text-sm text-yellow-700">
                  {levantamiento.notas_maquinaria}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PROYECTOS ASOCIADOS */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Proyectos</h2>
            <p className="text-gray-600 mt-1">
              {proyectos.length}{" "}
              {proyectos.length === 1 ? "proyecto" : "proyectos"} en este
              levantamiento
            </p>
          </div>

          <button
            onClick={() => setModalCrearProyecto(true)}
            disabled={procesandoExcel}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            Nuevo Proyecto
          </button>
        </div>

        {proyectos.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay proyectos
            </h3>
            <p className="text-gray-600 mb-4">
              Sube un Excel de cotización para crear tu primer proyecto
            </p>
            <button
              onClick={() => setModalCrearProyecto(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Crear Proyecto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proyectos.map((proyecto) => {
              const bloqueado = verificarProyectoBloqueado(proyecto);

              return (
                <div
                  key={proyecto.id}
                  onClick={() =>
                    router.push(`${pathname}/${proyecto.id}`)
                  }
                  className={`border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer ${bloqueado
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 hover:border-blue-300"
                    }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                      {proyecto.nombre}
                    </h3>
                    <div className="flex flex-col gap-2 ml-2">
                      <span
                        className={`text-xs px-2 py-1 rounded whitespace-nowrap ${obtenerColorEstado(bloqueado)}`}
                      >
                        {bloqueado ? "BLOQUEADO" : "ACTIVO"}
                      </span>
                      {bloqueado && (
                        <span className="text-xs px-2 py-1 rounded bg-red-600 text-white font-medium flex items-center gap-1 whitespace-nowrap">
                          <Lock size={12} />
                          OC
                        </span>
                      )}
                    </div>
                  </div>

                  {bloqueado && (
                    <div className="mb-3 bg-red-100 border border-red-300 rounded p-2">
                      <p className="text-xs text-red-800 font-medium">
                        ⚠️ Proyecto con orden de compra
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{formatearFecha(proyecto.fecha_creacion)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span>Cotizaciones</span>
                      <span className="font-bold text-blue-600">
                        {proyecto.cotizaciones?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    {/* Modal crear proyecto */}
    {modalCrearProyecto && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-xl font-bold mb-4">Crear Nuevo Proyecto</h3>
          <p className="text-gray-600 mb-4">
            Sube un archivo Excel de cotización para crear automáticamente un
            proyecto con todas las partidas
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 hover:border-blue-400 transition-colors">
            <Upload size={48} className="mx-auto text-gray-400 mb-3" />
            <label className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium text-lg">
                Seleccionar Excel de Cotización
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleSubirCotizacion}
                className="hidden"
                disabled={procesandoExcel}
              />
            </label>
            <p className="text-xs text-gray-500 mt-3">
              Formatos: .xlsx, .xls
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setModalCrearProyecto(false)}
              disabled={procesandoExcel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
