import { useState, useEffect } from "react";
import { obtenerInventario } from "../utils/api/inventario";
import {
  crearRequisicion,
  obtenerFolio,
  subirArchivoExcel,
} from "../utils/api/requisicion";
import {
  obtenerPlantas,
  obtenerLevantamientosPorPlanta,
  obtenerProyectosPorLevantamiento,
  obtenerInsumosPorCotizacion,
  obtenerCotizacionesPorProyecto,
} from "../utils/api/ing-proyectos";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  FaFileExcel,
  FaPlus,
  FaTimes,
  FaTrash,
  FaCheck,
  FaBox,
  FaUser,
  FaBuilding,
  FaExclamationTriangle,
  FaInfoCircle,
  FaSpinner,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaClipboardList,
  FaFolderOpen,
} from "react-icons/fa";
import {
    Insumo,
  MaterialPendienteAPI,
  MaterialPendienteUI,
} from "@/types/material";

interface MaterialInventario {
  id: number;
  material: string;
  cantidadDisponible: number;
}

interface MaterialExplosion {
  id: number;
  item_number: string;
  descripcion: string;
  unidad_medida: string;
  cantidad: number;
  cantidad_requisitada: number;
  cantidad_disponible: number;
  precio_hora?: number;
  valor_total: number;
}

interface ModalRequisicionProps {
  onClose: () => void;
  setNotifications: React.Dispatch<React.SetStateAction<number>>;
  actualizarListaRequisiciones: () => Promise<void>;
}

interface Planta {
  id: number;
  nombre: string;
}

interface Levantamiento {
  id: number;
  nombre: string;
  planta_id: number;
}

interface Proyecto {
  id: number;
  nombre: string;
  levantamiento_id: number;
}

interface Cotizacion {
  id: number;
  folio: string;
  proyecto_id: number;
  tiene_insumos: boolean;
}

export default function ModalRequisicion({
  onClose,
  setNotifications,
  actualizarListaRequisiciones,
}: ModalRequisicionProps) {
  const [inventario, setInventario] = useState<MaterialInventario[]>([]);
  const [materialesExplosion, setMaterialesExplosion] = useState<MaterialExplosion[]>([]);
  const [folio, setFolio] = useState("");

  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [plantaSeleccionada, setPlantaSeleccionada] = useState<number | null>(null);

  const [levantamientos, setLevantamientos] = useState<Levantamiento[]>([]);
  const [levantamientoSeleccionado, setLevantamientoSeleccionado] = useState<number | null>(null);

  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<number | null>(null);
  const [proyectoNombre, setProyectoNombre] = useState("");

  const [orden, setOrden] = useState("");
  const [materialSeleccionado, setMaterialSeleccionado] = useState<string>("");
  const [cantidad, setCantidad] = useState<number>(1);
  const [unidadMedida, setUnidadMedida] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [urgencia, setUrgencia] = useState<number>(2);

  const [requisicionesPendientes, setRequisicionesPendientes] = useState<MaterialPendienteUI[]>([]);
  const [solicitadoPor, setSolicitadoPor] = useState("");
  const [area, setArea] = useState("");
  const [erroresExcel, setErroresExcel] = useState<string[]>([]);
  const [archivoSubido, setArchivoSubido] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setShowErrors] = useState(false);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [animatingItems, setAnimatingItems] = useState<Set<number>>(new Set());
  const [loadingMateriales, setLoadingMateriales] = useState(false);
  const [advertenciasGlobales, setAdvertenciasGlobales] = useState<string[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inventarioData, plantasData, nuevoFolio] = await Promise.all([
          obtenerInventario(),
          obtenerPlantas(),
          obtenerFolio(),
        ]);

        setInventario(inventarioData);
        setPlantas(plantasData);
        setFolio(nuevoFolio.folio);
      } catch (error) {
        console.error("Error al obtener datos:", error);
        toast.error("Error al cargar datos iniciales");
      }
    };
    fetchData();
  }, []);

  // Cargar levantamientos cuando se selecciona planta
  useEffect(() => {
    if (!plantaSeleccionada) {
      setLevantamientos([]);
      setLevantamientoSeleccionado(null);
      setProyectos([]);
      setProyectoSeleccionado(null);
      setMaterialesExplosion([]);
      setMaterialSeleccionado("");
      setAdvertenciasGlobales([]);
      return;
    }

    const cargarLevantamientos = async () => {
      try {
        const levs = await obtenerLevantamientosPorPlanta(plantaSeleccionada);
        setLevantamientos(levs);
        setLevantamientoSeleccionado(null);
        setProyectos([]);
        setProyectoSeleccionado(null);
        setMaterialesExplosion([]);
        setMaterialSeleccionado("");
        setAdvertenciasGlobales([]);
      } catch (error) {
        console.error("Error cargando levantamientos:", error);
        toast.error("Error al cargar levantamientos");
      }
    };

    cargarLevantamientos();
  }, [plantaSeleccionada]);

  // Cargar proyectos cuando se selecciona levantamiento
  useEffect(() => {
    if (!levantamientoSeleccionado) {
      setProyectos([]);
      setProyectoSeleccionado(null);
      setMaterialesExplosion([]);
      setMaterialSeleccionado("");
      setAdvertenciasGlobales([]);
      return;
    }

    const cargarProyectos = async () => {
      try {
        const proys = await obtenerProyectosPorLevantamiento(levantamientoSeleccionado);
        setProyectos(proys);
        setProyectoSeleccionado(null);
        setMaterialesExplosion([]);
        setMaterialSeleccionado("");
        setAdvertenciasGlobales([]);
      } catch (error) {
        console.error("Error cargando proyectos:", error);
        toast.error("Error al cargar proyectos");
      }
    };

    cargarProyectos();
  }, [levantamientoSeleccionado]);

  // Cargar materiales cuando se selecciona proyecto
  useEffect(() => {
    if (!proyectoSeleccionado) {
      setMaterialesExplosion([]);
      setMaterialSeleccionado("");
      setAdvertenciasGlobales([]);
      return;
    }

    const cargarMaterialesProyecto = async () => {
      setLoadingMateriales(true);
      try {
        // 1. Obtener cotizaciones del proyecto
        const cotizaciones = await obtenerCotizacionesPorProyecto(proyectoSeleccionado);
        
        // 2. Buscar cotización con insumos
        const cotizacionConInsumos = cotizaciones.find((c: Cotizacion) => c.tiene_insumos);

        if (!cotizacionConInsumos) {
          setAdvertenciasGlobales([
            "⚠️ Este proyecto no tiene explosión de insumos registrada. Completa primero la explosión de insumos en la cotización.",
          ]);
          setMaterialesExplosion([]);
          return;
        }

        // 3. Obtener insumos de la cotización
        const insumos = await obtenerInsumosPorCotizacion(cotizacionConInsumos.id);
        
        if (insumos.length === 0) {
          setAdvertenciasGlobales([
            "⚠️ La cotización no tiene insumos cargados.",
          ]);
          setMaterialesExplosion([]);
          return;
        }

        // 4. Convertir a formato MaterialExplosion
        const materialesFormateados: MaterialExplosion[] = insumos.map((insumo: Insumo) => ({
          id: insumo.id,
          item_number: insumo.item_number,
          descripcion: insumo.descripcion,
          unidad_medida: insumo.unidad_medida,
          cantidad: insumo.cantidad,
          cantidad_requisitada: insumo.cantidad_requisitada || 0,
          cantidad_disponible: insumo.cantidad_disponible || insumo.cantidad,
          precio_hora: insumo.precio_hora,
          valor_total: insumo.valor_total || 0,
        }));

        setMaterialesExplosion(materialesFormateados);
        setAdvertenciasGlobales([]);
        toast.success(`✅ ${materialesFormateados.length} materiales cargados`);
      } catch (error) {
        console.error("Error cargando materiales:", error);
        toast.error("Error al cargar materiales del proyecto");
        setMaterialesExplosion([]);
        setAdvertenciasGlobales([
          "⚠️ Error al cargar los materiales. Verifica que el proyecto tenga una explosión de insumos.",
        ]);
      } finally {
        setLoadingMateriales(false);
      }
    };

    cargarMaterialesProyecto();
  }, [proyectoSeleccionado]);

  // Actualizar unidad y descripción cuando se selecciona material
  useEffect(() => {
    if (!materialSeleccionado || materialesExplosion.length === 0) return;

    const materialEncontrado = materialesExplosion.find(
      (m) => m.descripcion === materialSeleccionado
    );

    if (materialEncontrado) {
      setUnidadMedida(materialEncontrado.unidad_medida);
      setDescripcion(materialEncontrado.descripcion);
    }
  }, [materialSeleccionado, materialesExplosion]);

  const getUrgenciaConfig = (urgenciaId: number) => {
    const configs = {
      1: {
        label: "Alta",
        color: "text-red-600",
        bgColor: "bg-red-100",
        borderColor: "border-red-200",
      },
      2: {
        label: "Media",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        borderColor: "border-yellow-200",
      },
      3: {
        label: "Baja",
        color: "text-green-600",
        bgColor: "bg-green-100",
        borderColor: "border-green-200",
      },
    };
    return configs[urgenciaId as keyof typeof configs] || configs[2];
  };

  const validateForm = () => {
    const errors = [];
    if (!plantaSeleccionada) errors.push("Debe seleccionar una planta");
    if (!levantamientoSeleccionado) errors.push("Debe seleccionar un levantamiento");
    if (!proyectoSeleccionado) errors.push("Debe seleccionar un proyecto");
    if (!materialSeleccionado.trim()) errors.push("Debe seleccionar un material");
    if (cantidad <= 0) errors.push("La cantidad debe ser mayor a 0");
    if (!unidadMedida) errors.push("Debe seleccionar una unidad de medida");
    if (!descripcion.trim()) errors.push("La descripción es requerida");
    return errors;
  };

  const validarMaterialContraPresupuesto = (
    material: string,
    cantidadSolicitada: number
  ) => {
    const advertencias: string[] = [];

    const materialExplosion = materialesExplosion.find(
      (m) => m.descripcion.toLowerCase().trim() === material.toLowerCase().trim()
    );

    if (!materialExplosion) {
      advertencias.push("⚠️ Este material NO está en la explosión de insumos");
      return { advertencias, bloqueara: true, presupuestoDisponible: null };
    }

    const disponible = materialExplosion.cantidad_disponible;

    if (cantidadSolicitada > disponible) {
      advertencias.push(
        `⚠️ EXCEDE PRESUPUESTO: Disponible ${disponible}, Solicitas ${cantidadSolicitada}`
      );
      return {
        advertencias,
        bloqueara: true,
        presupuestoDisponible: disponible,
      };
    }

    const inventarioItem = inventario.find(
      (i) => i.material.toLowerCase().trim() === material.toLowerCase().trim()
    );

    if (inventarioItem) {
      if (inventarioItem.cantidadDisponible < cantidadSolicitada) {
        advertencias.push(
          `ℹ️ Inventario: ${inventarioItem.cantidadDisponible}. Se enviará a Compras`
        );
      } else {
        advertencias.push(
          `✅ Suficiente en inventario (${inventarioItem.cantidadDisponible})`
        );
      }
    } else {
      advertencias.push("ℹ️ No existe en inventario, se enviará a Compras");
    }

    return {
      advertencias,
      bloqueara: false,
      presupuestoDisponible: disponible,
    };
  };

  const leerArchivoExcel = async (file: File) => {
    setIsUploadingExcel(true);
    setErroresExcel([]);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const hoja = workbook.Sheets[workbook.SheetNames[0]];

        const getValor = (celda: string) =>
          hoja[celda]?.v ? String(hoja[celda].v).trim() : "";

        setSolicitadoPor(getValor("A6"));
        setArea(getValor("B6"));
        const proyectoExcel = getValor("C6");
        setOrden(getValor("D6"));

        const proyectoEncontrado = proyectos.find(
          (p) => p.nombre.toLowerCase().trim() === proyectoExcel.toLowerCase().trim()
        );

        if (proyectoEncontrado) {
          setProyectoSeleccionado(proyectoEncontrado.id);
          setProyectoNombre(proyectoEncontrado.nombre);
        }

        const errores: string[] = [];
        const nuevosMateriales: MaterialPendienteAPI[] = [];
        let fila = 9;

        while (true) {
          const urgencia = getValor(`A${fila}`);
          const descripcion = getValor(`B${fila}`);

          if (urgencia.toUpperCase().includes("JUSTIFICACIÓN")) break;
          if (!urgencia || !descripcion) {
            fila++;
            continue;
          }

          const cantidad = getValor(`C${fila}`);
          const unidad = getValor(`D${fila}`);

          if (!cantidad || isNaN(Number(cantidad))) {
            errores.push(`Fila ${fila}: cantidad inválida`);
            fila++;
            continue;
          }

          if (!unidad) {
            errores.push(`Fila ${fila}: unidad vacía`);
            fila++;
            continue;
          }

          const materialEncontrado = inventario.find(
            (mat) =>
              mat.material.toLowerCase().trim() === descripcion.toLowerCase().trim()
          );

          nuevosMateriales.push({
            material: descripcion,
            cantidad: Number(cantidad),
            unidadMedida: unidad,
            descripcion,
            idUrgencia: Number(urgencia) || 3,
            inventarioActual: materialEncontrado?.cantidadDisponible ?? null,
          });

          fila++;
        }

        setErroresExcel(errores);
        setRequisicionesPendientes((prev) => [...prev, ...nuevosMateriales]);

        if (errores.length === 0) {
          toast.success(`Se cargaron ${nuevosMateriales.length} materiales`);
        } else {
          toast.warning(`Cargado con ${errores.length} errores`);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      toast.error("Error al procesar Excel");
      console.error(error);
    } finally {
      setIsUploadingExcel(false);
    }
  };

  const agregarMaterial = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setShowErrors(true);
      toast.error(errors[0]);
      return;
    }

    const validacion = validarMaterialContraPresupuesto(materialSeleccionado, cantidad);

    const materialEnInventario = inventario.find(
      (i) => i.material.toLowerCase().trim() === materialSeleccionado.toLowerCase().trim()
    );

    const nuevoItem: MaterialPendienteUI = {
      material: materialSeleccionado,
      cantidad,
      unidadMedida,
      descripcion,
      idUrgencia: urgencia,
      inventarioActual: materialEnInventario?.cantidadDisponible ?? null,
      presupuestoDisponible: validacion.presupuestoDisponible,
      advertencias: validacion.advertencias,
    };

    setRequisicionesPendientes([...requisicionesPendientes, nuevoItem]);

    setMaterialSeleccionado("");
    setCantidad(1);
    setUnidadMedida("");
    setDescripcion("");
    setUrgencia(2);
    setShowErrors(false);

    if (validacion.bloqueara) {
      toast.warning("Material agregado - Requisición será bloqueada");
    } else {
      toast.success("Material agregado");
    }
  };

  const eliminarMaterial = (index: number) => {
    setAnimatingItems((prev) => new Set([...prev, index]));
    setTimeout(() => {
      setRequisicionesPendientes((prev) => prev.filter((_, i) => i !== index));
      setAnimatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }, 300);
  };

  const enviarRequisiciones = async () => {
    if (requisicionesPendientes.length === 0) {
      toast.error("Agrega al menos un material");
      return;
    }

    if (!proyectoNombre) {
      toast.error("El proyecto es requerido");
      return;
    }

    const materialesBloqueantes = requisicionesPendientes.filter((m) =>
      m.advertencias?.some((a) => a.includes("⚠️"))
    );

    if (materialesBloqueantes.length > 0) {
      const confirmar = window.confirm(
        `⚠️ ${materialesBloqueantes.length} materiales bloquearán la requisición.\n\nRequiere aprobación. ¿Continuar?`
      );
      if (!confirmar) return;
    }

    setIsSubmitting(true);

    try {
      const materialesLimpios = requisicionesPendientes.map((mat) => ({
        material: mat.material,
        cantidad: mat.cantidad,
        unidadMedida: mat.unidadMedida,
        descripcion: mat.descripcion,
        idUrgencia: mat.idUrgencia,
        inventarioActual: mat.inventarioActual,
      }));

      const res = await crearRequisicion({
        folio,
        proyecto: proyectoNombre,
        orden,
        materiales: materialesLimpios,
      });

      const requisicionId = res.requisicion.id;

      if (archivoSubido) {
        await subirArchivoExcel(requisicionId, archivoSubido);
      }

      if (res.bloqueada) {
        toast.warning("⚠️ Requisición BLOQUEADA. Requiere aprobación.", {
          autoClose: 5000,
        });
      } else {
        toast.success("✅ Requisición enviada");
      }

      setNotifications((prev) => prev + 1);
      await actualizarListaRequisiciones();
      setRequisicionesPendientes([]);
      onClose();
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : "Error al enviar";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string; error?: string } };
        };
        const mensajeAPI =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          "Error al enviar";
        toast.error(mensajeAPI);
        console.error("❌ Error del servidor:", axiosError.response?.data);
      } else {
        toast.error(mensaje);
      }
      console.error("❌ Error completo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMaterialInfo = () => {
    if (!materialSeleccionado || materialesExplosion.length === 0) return null;

    const mat = materialesExplosion.find((m) => m.descripcion === materialSeleccionado);
    if (!mat) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <div className="flex items-center gap-2 mb-2">
          <FaInfoCircle className="text-blue-600" />
          <span className="font-semibold text-blue-800">Presupuesto</span>
        </div>
        <div className="space-y-1 text-blue-700">
          <div>
            Planeado:{" "}
            <span className="font-medium">
              {mat.cantidad} {mat.unidad_medida}
            </span>
          </div>
          <div>
            Requisitado: <span className="font-medium">{mat.cantidad_requisitada}</span>
          </div>
          <div>
            Disponible:{" "}
            <span className="font-medium">
              {mat.cantidad_disponible} {mat.unidad_medida}
            </span>
          </div>
          {cantidad > mat.cantidad_disponible && (
            <div className="text-red-600 font-semibold mt-2 flex items-center gap-2">
              <FaExclamationTriangle />
              ⚠️ EXCEDE presupuesto - Bloqueará requisición
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FaBox className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Nueva Requisición</h2>
                <p className="text-blue-100 text-sm">Solicita materiales del proyecto</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-full">
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="space-y-6">
              {advertenciasGlobales.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  {advertenciasGlobales.map((adv, i) => (
                    <p key={i} className="text-yellow-800 text-sm">
                      {adv}
                    </p>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folio
                  </label>
                  <input
                    value={folio}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaMapMarkerAlt className="text-blue-600" />
                    Planta <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={plantaSeleccionada || ""}
                    onChange={(e) => setPlantaSeleccionada(Number(e.target.value) || null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona una planta</option>
                    {plantas.map((planta) => (
                      <option key={planta.id} value={planta.id}>
                        {planta.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {plantaSeleccionada && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FaClipboardList className="text-green-600" />
                      Levantamiento <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={levantamientoSeleccionado || ""}
                      onChange={(e) =>
                        setLevantamientoSeleccionado(Number(e.target.value) || null)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecciona un levantamiento</option>
                      {levantamientos.map((lev) => (
                        <option key={lev.id} value={lev.id}>
                          {lev.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {levantamientoSeleccionado && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FaFolderOpen className="text-purple-600" />
                      Proyecto <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={proyectoSeleccionado || ""}
                      onChange={(e) => {
                        const id = Number(e.target.value) || null;
                        setProyectoSeleccionado(id);
                        const proy = proyectos.find((p) => p.id === id);
                        setProyectoNombre(proy?.nombre || "");
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecciona un proyecto</option>
                      {proyectos.map((proy) => (
                        <option key={proy.id} value={proy.id}>
                          {proy.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orden (Opcional)
                  </label>
                  <input
                    value={orden}
                    onChange={(e) => setOrden(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    placeholder="Número de orden"
                  />
                </div>
              </div>

              {proyectoSeleccionado && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FaBox className="text-blue-600" />
                    <h3 className="text-lg font-semibold">Selección de Material</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Material <span className="text-red-500">*</span>
                    </label>
                    {loadingMateriales ? (
                      <div className="flex items-center justify-center py-8">
                        <FaSpinner className="animate-spin text-blue-600 text-2xl" />
                      </div>
                    ) : (
                      <select
                        value={materialSeleccionado}
                        onChange={(e) => setMaterialSeleccionado(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Selecciona --</option>
                        {materialesExplosion.map((m) => (
                          <option key={m.id} value={m.descripcion}>
                            {m.descripcion} (Disp: {m.cantidad_disponible}{" "}
                            {m.unidad_medida})
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Solo materiales de la explosión de insumos
                    </p>
                  </div>

                  {getMaterialInfo()}
                </div>
              )}

              {materialSeleccionado && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={cantidad}
                        onChange={(e) => setCantidad(Number(e.target.value))}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unidad
                      </label>
                      <input
                        value={unidadMedida}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgencia
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          id: 1,
                          label: "Alta",
                          icon: FaExclamationTriangle,
                          color: "red",
                        },
                        {
                          id: 2,
                          label: "Media",
                          icon: FaInfoCircle,
                          color: "yellow",
                        },
                        {
                          id: 3,
                          label: "Baja",
                          icon: FaCheckCircle,
                          color: "green",
                        },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setUrgencia(opt.id)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            urgencia === opt.id
                              ? `border-${opt.color}-500 bg-${opt.color}-50`
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <opt.icon className="w-5 h-5" />
                            <span className="text-sm font-medium">{opt.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
                      {isUploadingExcel ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaFileExcel />
                      )}
                      {isUploadingExcel ? "Procesando..." : "Subir Excel"}
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            leerArchivoExcel(file);
                            setArchivoSubido(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    <button
                      onClick={agregarMaterial}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FaPlus />
                      Agregar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="w-full lg:w-96 bg-gray-50 border-l flex flex-col max-h-[calc(90vh-80px)]">
            <div className="p-6 border-b bg-white">
              <h3 className="text-lg font-semibold mb-4">Materiales Solicitados</h3>
              {solicitadoPor && (
                <div className="flex items-center gap-2 text-sm mb-2">
                  <FaUser className="text-gray-400" />
                  <span>{solicitadoPor}</span>
                </div>
              )}
              {area && (
                <div className="flex items-center gap-2 text-sm mb-2">
                  <FaBuilding className="text-gray-400" />
                  <span>{area}</span>
                </div>
              )}
            </div>

            {erroresExcel.length > 0 && (
              <div className="mx-6 mt-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
                <p className="font-semibold mb-2">Errores:</p>
                <ul className="list-disc list-inside text-sm space-y-1 max-h-20 overflow-y-auto">
                  {erroresExcel.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex-1 p-6 overflow-y-auto">
              {requisicionesPendientes.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <FaBox className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No hay materiales</p>
                  <p className="text-sm mt-1">Selecciona un material para agregar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requisicionesPendientes.map((mat, idx) => {
                    const config = getUrgenciaConfig(mat.idUrgencia);
                    const isAnimating = animatingItems.has(idx);

                    return (
                      <div
                        key={idx}
                        className={`bg-white rounded-lg border p-4 transition-all duration-300 ${
                          isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {mat.material}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span>
                                {mat.cantidad} {mat.unidadMedida}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${config.bgColor} ${config.color}`}
                              >
                                {config.label}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => eliminarMaterial(idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>

                        <p className="text-xs text-gray-600 mb-2">{mat.descripcion}</p>

                        {mat.advertencias && mat.advertencias.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {mat.advertencias.map((adv, i) => (
                              <div
                                key={i}
                                className={`text-xs px-2 py-1 rounded ${
                                  adv.includes("⚠️")
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : adv.includes("✅")
                                      ? "bg-green-50 text-green-700 border border-green-200"
                                      : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}
                              >
                                {adv}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {requisicionesPendientes.length > 0 && (
              <div className="p-6 border-t bg-white">
                <button
                  onClick={enviarRequisiciones}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      Enviar Requisición
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
