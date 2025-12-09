'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { FileText, Calendar, DollarSign, Upload, CheckCircle, Clock, XCircle, Lock, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Breadcrumb } from '@/components/breadcrumb';
import { toast } from 'react-toastify';
import {
  obtenerPlantaPorId,
  obtenerProyectoPorId,
  obtenerCotizacionesPorProyecto,
} from '@/utils/api/ing-proyectos';

// Interfaces basadas en tu API
interface Proyecto {
  id: number;
  levantamiento_id: number;
  nombre: string;
  descripcion?: string;
  estado: string;
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
  [key: string]: unknown;
}

interface Planta {
  id: number;
  folio: string;
  nombre: string;
  fecha_creacion: string;
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

interface ApiError extends Error {
  response?: {
    data?: {
      message: string;
    };
  };
}

export default function ProyectoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const plantaId = Number(params.plantaId);
  const levantamientoId = Number(params.levantamientoId);
  const proyectoId = Number(params.proyectoId);
  const pathname = usePathname();

  const [, setPlanta] = useState<Planta | null>(null);
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalSubirCotizacion, setModalSubirCotizacion] = useState(false);
  const [procesandoExcel, setProcesandoExcel] = useState(false);
  const [proyectoBloqueado, setProyectoBloqueado] = useState(false);

  // Obtener usuario de cookies
  // const obtenerUsuarioActual = () => {
  //   try {
  //     const cookies = document.cookie.split(";");
  //     const usuarioCookie = cookies.find((c) => c.trim().startsWith("usuario="));
  //     if (usuarioCookie) {
  //       const usuarioData = JSON.parse(decodeURIComponent(usuarioCookie.split("=")[1]));
  //       return usuarioData.usuario;
  //     }
  //   } catch (error) {
  //     console.error("Error obteniendo usuario:", error);
  //   }
  //   return null;
  // };

  // Función para verificar si el proyecto está bloqueado
  const verificarProyectoBloqueado = (proyecto: Proyecto): boolean => {
    if (proyecto.bloqueado === 1) return true;

    if (proyecto.cotizaciones?.some(cot => {
      const tieneOC = typeof cot.tiene_orden_compra === 'number'
        ? cot.tiene_orden_compra
        : (cot.tiene_orden_compra as { data: (number | boolean)[] })?.data?.[0] || 0;
      return tieneOC === 1;
    })) {
      return true;
    }

    return false;
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        // Cargar planta
        const plantaData = await obtenerPlantaPorId(plantaId);
        setPlanta(plantaData);

        // Cargar proyecto
        const proyData = await obtenerProyectoPorId(proyectoId);
        setProyecto(proyData);

        // Verificar si está bloqueado
        const bloqueado = verificarProyectoBloqueado(proyData);
        setProyectoBloqueado(bloqueado);

        // Cargar cotizaciones
        const cotizacionesData = await obtenerCotizacionesPorProyecto(proyectoId);
        setCotizaciones(cotizacionesData);

      } catch (error) {
        console.error("Error cargando datos:", error);
        toast.error("Error al cargar los datos del proyecto");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [proyectoId, plantaId]);

  // ==========================================
  // FUNCIONES DE PROCESAMIENTO DE EXCEL
  // ==========================================

  // const buscarValor = (data: string[][], patrones: string[]): string => {
  //   for (const patron of patrones) {
  //     const patronUpper = patron.toUpperCase();
  //     for (let i = 0; i < data.length; i++) {
  //       for (let j = 0; j < data[i].length; j++) {
  //         const celda = data[i][j]?.toString().toUpperCase() || "";
  //         if (celda.includes(patronUpper)) {
  //           for (let k = j + 1; k < data[i].length; k++) {
  //             if (data[i][k] && data[i][k].toString().trim()) {
  //               return data[i][k].toString().trim();
  //             }
  //           }
  //           if (i + 1 < data.length) {
  //             for (let k = 0; k < data[i + 1].length; k++) {
  //               if (data[i + 1][k] && data[i + 1][k].toString().trim()) {
  //                 return data[i + 1][k].toString().trim();
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  //   return "";
  // };

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
      const esSubpartida = /^\d+\.\d+$/.test(primeraCelda || '');
      const esCategoriaPrincipal = /^\d+$/.test(primeraCelda || '');

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

  // const formatearFechaParaAPI = (fechaStr: string): string => {
  //   if (!fechaStr) {
  //     return new Date().toISOString().split('T')[0];
  //   }
  //
  //   try {
  //     const fecha = new Date(fechaStr);
  //     if (!isNaN(fecha.getTime())) {
  //       return fecha.toISOString().split('T')[0];
  //     }
  //
  //     const partes = fechaStr.split(/[/\-.]/);
  //     if (partes.length === 3) {
  //       let año: string, mes: string, dia: string;
  //
  //       if (partes[0].length === 4) {
  //         [año, mes, dia] = partes;
  //       } else if (partes[2].length === 4) {
  //         [dia, mes, año] = partes;
  //         if (parseInt(mes) > 12) {
  //           [mes, dia, año] = partes;
  //         }
  //       } else {
  //         return new Date().toISOString().split('T')[0];
  //       }
  //
  //       if (año && mes && dia) {
  //         const fechaFormateada = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
  //         if (!isNaN(fechaFormateada.getTime())) {
  //           return fechaFormateada.toISOString().split('T')[0];
  //         }
  //       }
  //     }
  //
  //     return new Date().toISOString().split('T')[0];
  //   } catch (error) {
  //     console.error('Error formateando fecha:', error);
  //     return new Date().toISOString().split('T')[0];
  //   }
  // };

  const procesarExcel = async (file: File): Promise<void> => {
    // ✅ VERIFICAR SI EL PROYECTO ESTÁ BLOQUEADO
    if (proyectoBloqueado) {
      toast.error(
        `⚠️ PROYECTO BLOQUEADO\n\nEste proyecto ya tiene una orden de compra registrada.\nNo se pueden agregar más cotizaciones.`
      );
      setModalSubirCotizacion(false);
      return;
    }

    setProcesandoExcel(true);
    setModalSubirCotizacion(false);

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
      // const cliente = buscarValor(jsonData, ["CLIENTE"]);
      // const direccion = buscarValor(jsonData, ["DIRECCION", "DIRECCIÓN"]);
      // const fechaExcel = buscarValor(jsonData, ["FECHA:"]);
      // const vendedor = buscarValor(jsonData, ["VENDEDOR:"]);
      // const proveedor = buscarValor(jsonData, ["PROVEEDOR"]);
      // const correo = buscarValor(jsonData, ["@"]);
      // const obra = buscarValor(jsonData, ["OBRA"]);
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
      // const usuario = obtenerUsuarioActual();
      // const usuarioId = usuario?.id;

      toast.update(toastId, {
        render: "💰 Creando cotización en la base de datos...",
        type: "info",
        isLoading: true,
      });

      // const fechaFormateada = formatearFechaParaAPI(fechaExcel);

      // Crear cotización usando la API
      // const cotizacionData = {
      //   proyecto_id: proyectoId,
      //   fecha: fechaFormateada,
      //   subtotal: subtotal,
      //   iva: iva,
      //   total: total,
      //   partidas: partidas.map((partida: PartidaExtraida, index: number) => ({
      //     numero_partida: index + 1,
      //     descripcion: partida.concepto || `Partida ${index + 1}`,
      //     cantidad: partida.cantidad || 1,
      //     unidad: partida.unidad || "Servicio",
      //     precio_unitario: partida.precioUnitario || 0,
      //     importe: partida.total || 0,
      //   })),
      //   usuario_id: usuarioId,
      // };

      // const nuevaCotizacion = await crearCotizacion(cotizacionData);

      // Actualizar lista de cotizaciones
      const cotizacionesActualizadas = await obtenerCotizacionesPorProyecto(proyectoId);
      setCotizaciones(cotizacionesActualizadas);

      toast.update(toastId, {
        render: `✅ ¡Cotización creada exitosamente!\n\n📊 ${partidas.length} partidas procesadas\n💰 $${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

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
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (err) {
      return (`Fecha inválida: ${err}`);
    }
  };

  const formatearMonto = (monto: number | string): string => {
    const montoNumero = typeof monto === 'string' ? parseFloat(monto) : monto;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(montoNumero || 0);
  };

  const obtenerColorEstado = (estado: string): string => {
    const colores = {
      borrador: 'bg-gray-100 text-gray-800',
      enviada: 'bg-blue-100 text-blue-800',
      aprobada: 'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const obtenerIconoEstado = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'enviada':
        return <Clock size={16} className="text-blue-600" />;
      case 'rechazada':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (!proyecto) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Proyecto no encontrado</p>
          <button
            onClick={() => router.push(`/dashboard/ingenierias/proyectos/${plantaId}/${levantamientoId}`)}
            className="mt-4 text-blue-600 hover:underline"
          >
            Volver al levantamiento
          </button>
        </div>
      </div>
    );
  }

  const montoTotal = cotizaciones
    .filter(c => c.estado === 'aprobada')
    .reduce((acc, c) => acc + parseFloat(c.total || '0'), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <Breadcrumb />

      <div className="max-w-7xl mx-auto p-6">
        {/* ✅ BANNER DE PROYECTO BLOQUEADO */}
        {proyectoBloqueado && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <div className="flex items-start gap-3">
              <Lock size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-1">
                  Proyecto Bloqueado
                </h3>
                <p className="text-sm text-red-800 mb-2">
                  Este proyecto tiene una orden de compra registrada y ya no puede recibir nuevas cotizaciones.
                </p>
                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-100 rounded px-3 py-2">
                  <AlertTriangle size={14} />
                  <span>Para agregar nuevas cotizaciones, crea un nuevo proyecto desde el levantamiento.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header - Info del Proyecto */}
        <div className={`bg-white rounded-lg shadow-md mb-6 overflow-hidden ${proyectoBloqueado ? 'border-2 border-red-300' : ''}`}>
          {/* Banner */}
          <div className={`bg-gradient-to-r p-6 text-white ${proyectoBloqueado ? 'from-red-600 to-red-700' : 'from-purple-600 to-purple-700'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{proyecto.nombre}</h1>
                  {proyectoBloqueado && (
                    <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      <Lock size={16} />
                      BLOQUEADO
                    </span>
                  )}
                </div>
                <p className={proyectoBloqueado ? 'text-red-100' : 'text-purple-100'}>
                  Creado el {formatearFecha(proyecto.fecha_creacion)}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-lg text-sm font-medium ${proyecto.estado === 'activo' ? 'bg-green-500' :
                  proyecto.estado === 'completado' ? 'bg-blue-500' : 'bg-red-500'
                }`}>
                {proyecto.estado.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${proyectoBloqueado ? 'bg-red-50' : 'bg-purple-50'}`}>
                <FileText size={24} className={proyectoBloqueado ? 'text-red-600' : 'text-purple-600'} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cotizaciones</p>
                <p className="text-2xl font-bold text-gray-900">{cotizaciones.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cotizaciones.filter(c => c.estado === 'aprobada').length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <DollarSign size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Monto Total Aprobado</p>
                <p className="text-2xl font-bold text-gray-900">{formatearMonto(montoTotal)}</p>
              </div>
            </div>
          </div>

          {proyecto.descripcion && (
            <div className="px-6 pb-6">
              <p className="text-gray-700">{proyecto.descripcion}</p>
            </div>
          )}
        </div>

        {/* Sección de Cotizaciones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cotizaciones</h2>
              <p className="text-gray-600 mt-1">
                Gestiona las cotizaciones y sus fases
              </p>
            </div>

            <button
              onClick={() => {
                if (proyectoBloqueado) {
                  toast.error(
                    `⚠️ PROYECTO BLOQUEADO\n\nEste proyecto ya tiene una orden de compra registrada.\nNo se pueden agregar más cotizaciones.`
                  );
                } else {
                  setModalSubirCotizacion(true);
                }
              }}
              disabled={procesandoExcel}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors shadow-md disabled:cursor-not-allowed ${proyectoBloqueado
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              title={proyectoBloqueado ? 'Proyecto bloqueado: no se pueden agregar cotizaciones' : 'Subir nueva cotización'}
            >
              {proyectoBloqueado ? <Lock size={20} /> : <Upload size={20} />}
              {proyectoBloqueado ? 'Bloqueado' : 'Subir Cotización'}
            </button>
          </div>

          {cotizaciones.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay cotizaciones
              </h3>
              <p className="text-gray-600 mb-4">
                Sube un archivo Excel para crear tu primera cotización
              </p>
              {!proyectoBloqueado && (
                <button
                  onClick={() => setModalSubirCotizacion(true)}
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Upload size={20} />
                  Subir Cotización
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cotizaciones.map((cotizacion) => (
                <div
                  key={cotizacion.id}
                  onClick={() => router.push(
                    `${pathname}/${cotizacion.id}`
                  )}
                  className={`border-2 rounded-lg p-5 hover:shadow-lg transition-all cursor-pointer bg-white ${cotizacion.tiene_orden_compra === 1
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-purple-300'
                    }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {obtenerIconoEstado(cotizacion.estado)}
                      <span className="font-bold text-sm text-gray-900">
                        {cotizacion.folio}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${obtenerColorEstado(cotizacion.estado)}`}>
                        {cotizacion.estado}
                      </span>
                      {cotizacion.tiene_orden_compra === 1 && (
                        <span className="text-xs px-2 py-1 rounded bg-red-600 text-white font-medium flex items-center gap-1">
                          <Lock size={10} />
                          OC
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fecha y Monto */}
                  <div className="space-y-2 text-sm border-t pt-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={14} />
                      <span>{formatearFecha(cotizacion.fecha)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign size={14} />
                        <span className="font-semibold">{formatearMonto(cotizacion.total)}</span>
                      </div>
                      {cotizacion.partidas && cotizacion.partidas.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {cotizacion.partidas.length} {cotizacion.partidas.length === 1 ? 'partida' : 'partidas'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fases */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between text-xs p-1.5 rounded bg-gray-50">
                        <span className="text-gray-600">Insumos</span>
                        {cotizacion.tiene_insumos === 1 ? (
                          <CheckCircle size={14} className="text-green-500" />
                        ) : (
                          <Clock size={14} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs p-1.5 rounded bg-gray-50">
                        <span className="text-gray-600">O. Compra</span>
                        {cotizacion.tiene_orden_compra === 1 ? (
                          <CheckCircle size={14} className="text-green-500" />
                        ) : (
                          <Clock size={14} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal subir cotización */}
      {modalSubirCotizacion && !proyectoBloqueado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Subir Nueva Cotización</h3>
            <p className="text-gray-600 mb-4">
              Sube un archivo Excel de cotización para agregarlo a este proyecto
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 hover:border-purple-400 transition-colors">
              <Upload size={48} className="mx-auto text-gray-400 mb-3" />
              <label className="cursor-pointer">
                <span className="text-purple-600 hover:text-purple-700 font-medium text-lg">
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
              <p className="text-xs text-gray-400 mt-1">
                El sistema extraerá automáticamente partidas, totales y datos del cliente
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalSubirCotizacion(false)}
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
