"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaSpinner,
  FaUser,
  FaCalendarAlt,
  FaBox,
  FaExclamationTriangle,
  FaShoppingCart,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaSave,
  FaTimes,
  FaDownload,
} from "react-icons/fa";
import {
  obtenerRequisicionPorId,
  evaluarRequisicion as apiEvaluarRequisicion,
  desbloquearRequiscion,
} from "@/utils/api/requisicion";
import type { Requisicion as RequisicionType } from "@/types/requisicion";
import { toast } from "react-toastify";
import { getCookie } from "cookies-next";

interface MaterialEvaluado {
  id: number;
  material: string;
  descripcion?: string;
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
  urgencia?: { id?: number; descripcion: string } | null;
  fechaLlegada?: string | Date;
  estatus?: { id: number; nombre: string } | null;
}

interface MaterialAPI {
  id: number;
  material: string;
  descripcion?: string;
  cantidad: number;
  unidadMedida: string;
  cantidadEntregada?: number | null;
  inventarioActual?: number | null;
  observacion?: string | null;
  urgencia?: { id?: number; descripcion: string } | null;
  estatus?: { id: number; nombre: string } | null;
  fechaLlegada?: string | Date;
}

export default function RequisicionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number.parseInt(params.id as string);

  const [requisicion, setRequisicion] = useState<RequisicionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [materialesEvaluados, setMaterialesEvaluados] = useState<
    MaterialEvaluado[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de permisos
  const [userRol, setUserRol] = useState<string>("");
  const [, setUserModulos] = useState<Set<string>>(new Set());
  const [canEvaluate, setCanEvaluate] = useState(false);

  const [esBloqueada, setEsBloqueada] = useState(false);
  const [razonesBloqueo, setRazonesBloqueo] = useState<string[]>([]);
  const [desbloqueando, setDesbloqueando] = useState(false);

  // ✅ NUEVO: useRef para evitar que el useEffect sobrescriba
  const justUnlocked = useRef(false);
  const unlockTimestamp = useRef<number>(0);

  // Cargar permisos del usuario
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const userCookie = getCookie("usuario");
      const userData: User = userCookie
        ? JSON.parse(userCookie.toString())
        : null;

      if (!userData) {
        setUserRol("");
        setUserModulos(new Set());
        setCanEvaluate(false);
        return;
      }

      const rol = userData?.usuario?.rol?.nombre?.toLowerCase().trim() || "";
      setUserRol(rol);

      // Extraer módulos y submódulos
      const modulos = new Set<string>();
      if (userData?.permisos) {
        Object.values(userData.permisos).forEach((permiso: Permiso) => {
          if (permiso.endpoint) {
            modulos.add(permiso.endpoint.toLowerCase());
          }
          if (permiso.sub_permisos) {
            Object.values(permiso.sub_permisos).forEach((sub: SubPermiso) => {
              if (sub.endpoint) {
                modulos.add(sub.endpoint.toLowerCase());
              }
            });
          }
        });
      }
      setUserModulos(modulos);

      // Determinar si puede evaluar
      const puedeEvaluar =
        rol === "administrador" ||
        rol === "almacén" ||
        rol === "almacen" ||
        modulos.has("almacen") ||
        modulos.has("inventario");

      setCanEvaluate(puedeEvaluar);
    } catch (err) {
      console.error("Error al cargar permisos:", err);
      setUserRol("");
      setUserModulos(new Set());
      setCanEvaluate(false);
    }
  }, []);

  const prepararMaterial = (mat: MaterialAPI): MaterialEvaluado => {
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
      descripcion: mat.descripcion,
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
      urgencia: mat.urgencia,
      fechaLlegada: mat.fechaLlegada,
      estatus: mat.estatus,
    };
  };

  // ✅ MEJORADO: useEffect con mejor control
  useEffect(() => {
    const fetchRequisicion = async () => {
      try {
        setLoading(true);
        const data = await obtenerRequisicionPorId(id);
        setRequisicion(data);

        // ✅ CRÍTICO: Solo actualizar estados si NO acabamos de desbloquear
        const timeSinceUnlock = Date.now() - unlockTimestamp.current;
        const shouldUpdate = !justUnlocked.current || timeSinceUnlock > 2000;

        console.log("🔍 useEffect - fetchRequisicion", {
          justUnlocked: justUnlocked.current,
          timeSinceUnlock,
          shouldUpdate,
          desbloqueando,
          estadoNombre: data?.estado?.nombre,
          estadoId: data?.estado?.id,
        });

        if (shouldUpdate && !desbloqueando) {
          // ✅ Detectar bloqueo por nombre del estado
          const estadoNombre = (data?.estado?.nombre || "").toLowerCase();
          const bloqueada =
            estadoNombre.includes("bloqueada") ||
            estadoNombre.includes("bloqueo");

          // Extraer razones del observaciones si existen
          let razones: string[] = [];
          if (data?.observaciones) {
            try {
              const obs = JSON.parse(data.observaciones);
              razones = Array.isArray(obs) ? obs : [obs];
            } catch {
              razones = [data.observaciones];
            }
          }

          console.log("✅ useEffect - Actualizando estados:", {
            bloqueada,
            razones,
          });

          setEsBloqueada(bloqueada);
          setRazonesBloqueo(razones);
        } else {
          console.log(
            "⏭️ useEffect - Saltando actualización de estados de bloqueo",
          );
        }

        if (data?.materiales) {
          setMaterialesEvaluados(data.materiales.map(prepararMaterial));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    };

    fetchRequisicion();
  }, [id, desbloqueando]);

  // ✅ MEJORADO: Handler de desbloqueo más robusto
  const handleDesbloquear = async () => {
    if (!confirm("¿Estás seguro de desbloquear esta requisición?")) return;

    try {
      setDesbloqueando(true);
      justUnlocked.current = true;
      unlockTimestamp.current = Date.now();

      // Obtener usuario del sistema
      let evaluador = "Sistema";
      try {
        const userCookie = getCookie("usuario");
        if (userCookie) {
          const userData = JSON.parse(userCookie.toString());
          evaluador =
            userData.usuario.nombre || userData.usuario.correo || "Sistema";
        }
      } catch (error) {
        console.error("Error al obtener usuario:", error);
      }

      console.log("🔓 [1/7] Iniciando desbloqueo para ID:", id);

      // 1️⃣ Desbloquear en la API
      try {
        const response = await desbloquearRequiscion(id, {
          usuario: evaluador,
        });

        if (response.status === 200) {
          const data = await response.json();
          console.log("Todo bien 😎", data);
        } else {
          console.error("Error HTTP:", response.status);
        }
      } catch (error) {
        throw new Error("Error al desbloquear requisición" + error);
      }

      // console.log("📡 [2/7] Respuesta del API:", {
      //   ok: response.ok,
      //   status: response.status,
      // });
      //
      // if (response.status !== 200) {
      // }

      // 2️⃣ Esperar para que la BD se actualice
      console.log("⏳ [3/7] Esperando 500ms para actualización de BD...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 3️⃣ Recargar datos ACTUALIZADOS de la API
      console.log("🔄 [4/7] Recargando datos de la API...");
      const data = await obtenerRequisicionPorId(id);

      console.log("📦 [5/7] Datos recibidos:", {
        estadoNombre: data?.estado?.nombre,
        estadoId: data?.estado?.id,
        observaciones: data?.observaciones,
      });

      // 4️⃣ Actualizar el estado con los nuevos datos
      setRequisicion(data);

      // 5️⃣ Leer estado REAL de los datos
      const estadoNombre = (data?.estado?.nombre || "").toLowerCase();
      const bloqueada =
        estadoNombre.includes("bloqueada") || estadoNombre.includes("bloqueo");

      // Extraer razones del observaciones
      let razones: string[] = [];
      if (data?.observaciones) {
        try {
          const obs = JSON.parse(data.observaciones);
          razones = Array.isArray(obs) ? obs : [obs];
        } catch {
          razones = [data.observaciones];
        }
      }

      console.log("✅ [6/7] Estableciendo estados del componente:", {
        bloqueada,
        cantidadRazones: razones.length,
      });

      // 6️⃣ Actualizar estados basados en datos reales
      setEsBloqueada(bloqueada);
      setRazonesBloqueo(razones);

      // 7️⃣ Actualizar materiales si existen
      if (data?.materiales) {
        setMaterialesEvaluados(data.materiales.map(prepararMaterial));
      }

      // 8️⃣ Mostrar mensaje apropiado
      if (!bloqueada) {
        console.log("✨ [7/7] ¡Requisición desbloqueada exitosamente!");
        toast.success("✅ Requisición desbloqueada correctamente");
      } else {
        console.warn(
          "⚠️ [7/7] La requisición aún tiene validaciones:",
          razones,
        );
        toast.warning(
          "⚠️ La requisición se desbloqueó pero hay campos pendientes",
        );
      }

      // Limpiar flag después de 2 segundos
      setTimeout(() => {
        justUnlocked.current = false;
        console.log("🧹 Flag justUnlocked limpiado");
      }, 2000);
    } catch (err) {
      console.error("❌ ERROR al desbloquear:", err);
      const message =
        err instanceof Error ? err.message : "No se pudo desbloquear";
      toast.error(message);
      justUnlocked.current = false;
    } finally {
      setDesbloqueando(false);
    }
  };

  const handleMaterialChange = (
    index: number,
    field: keyof MaterialEvaluado,
    value: string | number | boolean,
  ) => {
    setMaterialesEvaluados((prev) => {
      const copia = [...prev];
      if (!copia[index].editable) return copia;

      if (field === "cantidadEntregada" && typeof value === "number") {
        const cantidadEntregada = Math.max(
          0,
          Math.min(value, copia[index].cantidad),
        );
        const inventario = Number(copia[index].inventarioActual || 0);
        const faltante = copia[index].cantidad - cantidadEntregada;

        copia[index].cantidadEntregada = cantidadEntregada;
        copia[index].restanteInventario = Math.max(
          0,
          inventario - cantidadEntregada,
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

      // @ts-expect-error: asignación dinámica segura
      copia[index][field] = value;
      return copia;
    });
  };

  const descargarArchivoExcel = async (requisicionId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/requisicion/${requisicionId}/descargar-excel`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Error al descargar el archivo");
      }

      // Obtener el nombre del archivo desde los headers o usar uno por defecto
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `requisicion_${requisicionId}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Convertir la respuesta a blob
      const blob = await response.blob();

      // Crear un enlace temporal para descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Archivo descargado correctamente");
    } catch (error) {
      console.error("Error al descargar:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Error al descargar el archivo";
      toast.error(message);
    }
  };

  const handleSubmitEvaluation = async () => {
    const faltanObs = materialesEvaluados.some(
      (m) => m.editable && m.enviarACompras && !m.observacion?.trim(),
    );

    if (faltanObs) {
      toast.error(
        "Agrega una observación para cada material enviado a compras.",
      );
      return;
    }

    let evaluador = "Sistema";
    try {
      const userCookie = getCookie("usuario");
      if (userCookie) {
        const userData: User = JSON.parse(userCookie.toString());
        evaluador =
          userData.usuario.nombre || userData.usuario.correo || "Sistema";
      }
    } catch (error) {
      console.error("Error al obtener usuario:", error);
    }

    const payload = {
      requisicionId: id,
      evaluador: evaluador,
      materiales: materialesEvaluados
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
      toast.success("Evaluación guardada correctamente ✅");
      setIsEvaluating(false);

      // Refresh data
      const data = await obtenerRequisicionPorId(id);
      setRequisicion(data);
      if (data?.materiales) {
        setMaterialesEvaluados(data.materiales.map(prepararMaterial));
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "No se pudo guardar la evaluación";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (estado: string | { nombre: string }) => {
    const estadoNombre =
      typeof estado === "string" ? estado : estado?.nombre || "";
    switch (estadoNombre.toLowerCase()) {
      case "pendiente":
        return "bg-red-50 text-red-700 border border-red-200";
      case "en seguimiento":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "finalizado":
        return "bg-green-50 text-green-700 border border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const getUrgencyColor = (urgencia?: string) => {
    switch ((urgencia || "").toLowerCase()) {
      case "alta":
        return "bg-red-500";
      case "media":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center gap-3 text-gray-600">
          <FaSpinner className="animate-spin text-2xl text-blue-600" />
          <span className="text-lg">Cargando requisición...</span>
        </div>
      </div>
    );
  }

  if (error || !requisicion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <div className="text-red-600 text-xl font-semibold mb-4">
            {error ? "Error" : "No encontrada"}
          </div>
          <div className="text-gray-700 mb-6">
            {error || "Requisición no encontrada"}
          </div>
          <button
            onClick={() =>
              router.push("/dashboard/requisiciones/requisiciones")
            }
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a requisiciones
          </button>
        </div>
      </div>
    );
  }

  // Agregar estos estilos al final del return, antes del cierre del div principal
  const bloqueadaStyles = esBloqueada ? "opacity-50 pointer-events-none" : "";

  // 🐛 DEBUG: Ver estados
  console.log("🔍 Estados actuales:", {
    esBloqueada,
    razonesBloqueo,
    userRol,
    mostraraBanner: esBloqueada,
    mostraraBoton: userRol === "administrador" || userRol === "administracion",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                router.push("/dashboard/requisiciones/requisiciones")
              }
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200 hover:shadow-md transition-all"
            >
              <FaArrowLeft />
              Volver
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Requisición #{requisicion.id}
              </h1>
              <p className="text-gray-600">{requisicion.folio}</p>
            </div>
          </div>

          {/* Botones de acción - Deshabilitados si está bloqueada */}
          <div className={`flex items-center gap-2 ${bloqueadaStyles}`}>
            {requisicion.archivoExcelNombre && (
              <button
                onClick={() => descargarArchivoExcel(requisicion.id)}
                disabled={esBloqueada}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:cursor-not-allowed"
                title="Descargar Excel"
              >
                <FaDownload />
                Excel
              </button>
            )}
            {canEvaluate && !isEvaluating && !esBloqueada && (
              <button
                onClick={() => setIsEvaluating(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                <FaEdit />
                Evaluar
              </button>
            )}
            {isEvaluating && (
              <>
                <button
                  onClick={handleSubmitEvaluation}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaSave />
                  )}
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={() => setIsEvaluating(false)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <FaTimes />
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>

        {/* ========== BANNER DE BLOQUEO MEJORADO ========== */}
        {esBloqueada && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-500 rounded-2xl shadow-2xl p-8 mb-8 relative overflow-hidden">
            {/* Patrón de fondo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute transform rotate-45 -right-10 -top-10 w-40 h-40 bg-red-500 rounded-full"></div>
              <div className="absolute transform -rotate-45 -left-10 -bottom-10 w-40 h-40 bg-red-500 rounded-full"></div>
            </div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* Contenido del bloqueo */}
                <div className="flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
                      <FaExclamationTriangle className="text-white text-3xl" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-red-900 mb-2">
                        🚫 REQUISICIÓN BLOQUEADA
                      </h3>
                      <p className="text-red-700 font-medium">
                        No puede procesarse hasta aprobación de Administración
                      </p>
                    </div>
                  </div>

                  {/* Razones del bloqueo */}
                  <div className="bg-white/90 backdrop-blur rounded-xl p-5 shadow-inner border border-red-200">
                    <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2 text-lg">
                      <FaInfoCircle className="text-red-600" />
                      Razones del bloqueo:
                    </h4>
                    <ul className="space-y-2">
                      {razonesBloqueo.map((razon, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-sm bg-red-50 p-3 rounded-lg border border-red-200"
                        >
                          <span className="text-red-600 font-bold text-lg flex-shrink-0">
                            •
                          </span>
                          <span className="text-red-800 font-medium">
                            {razon}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Nota informativa */}
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <FaInfoCircle className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800 font-medium">
                        Esta requisición excede el presupuesto planificado o
                        incluye materiales no contemplados en la explosión de
                        insumos.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botón de desbloqueo */}
                {(userRol === "administrador" ||
                  userRol === "administracion") && (
                  <div className="flex-shrink-0 lg:ml-6">
                    <div className="bg-white/90 backdrop-blur rounded-xl p-6 shadow-lg border border-red-300">
                      <button
                        onClick={handleDesbloquear}
                        disabled={desbloqueando}
                        className="flex flex-col items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                      >
                        {desbloqueando ? (
                          <>
                            <FaSpinner className="animate-spin text-3xl" />
                            <span className="font-bold text-sm">
                              Desbloqueando...
                            </span>
                          </>
                        ) : (
                          <>
                            <FaCheckCircle className="text-4xl" />
                            <span className="font-bold text-lg whitespace-nowrap">
                              DESBLOQUEAR
                            </span>
                            <span className="text-xs opacity-90">
                              Aprobar requisición
                            </span>
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-600 text-center mt-3">
                        Solo Administración puede desbloquear
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FaUser className="text-blue-600" />
                Información del Solicitante
              </h2>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(requisicion.estado)}`}
              >
                {typeof requisicion.estado === "string"
                  ? requisicion.estado
                  : requisicion.estado?.nombre || "N/A"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Solicitante
                </label>
                <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-lg">
                  {requisicion.solicitante}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Departamento
                </label>
                <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-lg">
                  {requisicion.departamento}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Fecha
                </label>
                <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-600" />
                  {new Date(requisicion.fechaRegistro).toLocaleDateString(
                    "es-MX",
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <FaInfoCircle className="text-blue-600" />
              Información General
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Proyecto
                </label>
                <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-lg">
                  {requisicion.proyecto}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Orden
                </label>
                <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-lg">
                  {requisicion.orden || "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Origen
                </label>
                <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-lg">
                  {requisicion.origen}
                </p>
              </div>
            </div>
            {requisicion.observaciones && !esBloqueada && (
              <div className="mt-6 space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Observaciones Generales
                </label>
                <p className="text-gray-900 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  {requisicion.observaciones}
                </p>
              </div>
            )}
          </div>

          {/* Materiales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FaBox className="text-green-600" />
                Materiales Solicitados
              </h2>
              {isEvaluating && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm">
                  <FaInfoCircle className="inline mr-2" />
                  Modo de evaluación activo
                </div>
              )}
            </div>

            <div className="space-y-6">
              {(isEvaluating
                ? materialesEvaluados
                : requisicion.materiales
              ).map((material, index) => {
                const isEvalMaterial = isEvaluating && "editable" in material;
                return (
                  <div
                    key={material.id || index}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                  >
                    {/* Material Header */}
                    <div className="bg-gray-50 p-6 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {isEvalMaterial &&
                              getStatusIcon(material as MaterialEvaluado)}
                            <div
                              className={`w-3 h-3 rounded-full ${getUrgencyColor(material.urgencia?.descripcion)}`}
                            />
                            <h3 className="text-lg font-semibold text-gray-900">
                              {material.material}
                            </h3>
                          </div>

                          <p className="text-gray-600 mb-4">
                            {material.descripcion}
                          </p>

                          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <FaBox className="w-4 h-4" />
                              Solicitado: {material.cantidad}{" "}
                              {material.unidadMedida}
                            </span>
                            {isEvalMaterial && (
                              <>
                                <span>
                                  Entregado:{" "}
                                  {
                                    (material as MaterialEvaluado)
                                      .cantidadEntregada
                                  }{" "}
                                  de {material.cantidad}
                                </span>
                                {(material as MaterialEvaluado)
                                  .inventarioActual !== undefined && (
                                  <span>
                                    Inventario:{" "}
                                    {
                                      (material as MaterialEvaluado)
                                        .inventarioActual
                                    }
                                  </span>
                                )}
                              </>
                            )}
                            <span>
                              Urgencia:{" "}
                              {material.urgencia?.descripcion || "Sin definir"}
                            </span>
                            <span>
                              Estatus: {material.estatus?.nombre || "N/A"}
                            </span>
                            <span>
                              Llegada:{" "}
                              {material.fechaLlegada
                                ? new Date(
                                    material.fechaLlegada,
                                  ).toLocaleDateString("es-MX")
                                : "N/A"}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          {isEvalMaterial && (
                            <div className="mt-4">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progreso de entrega</span>
                                <span>
                                  {Math.round(
                                    getProgressWidth(
                                      material as MaterialEvaluado,
                                    ),
                                  )}
                                  %
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    getProgressWidth(
                                      material as MaterialEvaluado,
                                    ) === 100
                                      ? "bg-green-500"
                                      : getProgressWidth(
                                            material as MaterialEvaluado,
                                          ) > 0
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{
                                    width: `${getProgressWidth(material as MaterialEvaluado)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Status Messages */}
                          {isEvalMaterial &&
                            (material as MaterialEvaluado).mostrarLeyenda && (
                              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm mt-4">
                                <FaInfoCircle className="inline mr-2" />
                                {(material as MaterialEvaluado).mostrarLeyenda}
                              </div>
                            )}

                          {isEvalMaterial &&
                            (material as MaterialEvaluado)
                              .mensajeInventario && (
                              <div
                                className={`px-3 py-2 rounded-lg text-sm font-medium mt-4 ${
                                  (material as MaterialEvaluado)
                                    .colorInventario === "text-green-600"
                                    ? "bg-green-50 border border-green-200 text-green-700"
                                    : "bg-red-50 border border-red-200 text-red-700"
                                }`}
                              >
                                {(material as MaterialEvaluado)
                                  .colorInventario === "text-green-600" ? (
                                  <FaCheckCircle className="inline mr-2" />
                                ) : (
                                  <FaExclamationTriangle className="inline mr-2" />
                                )}
                                {
                                  (material as MaterialEvaluado)
                                    .mensajeInventario
                                }
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Evaluation Controls */}
                    {isEvaluating &&
                      isEvalMaterial &&
                      (material as MaterialEvaluado).editable && (
                        <div className="p-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cantidad a entregar
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min={0}
                                  max={material.cantidad}
                                  value={
                                    (material as MaterialEvaluado)
                                      .cantidadEntregada
                                  }
                                  onChange={(e) =>
                                    handleMaterialChange(
                                      index,
                                      "cantidadEntregada",
                                      Number.parseInt(e.target.value) || 0,
                                    )
                                  }
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                  {material.unidadMedida}
                                </span>
                              </div>
                            </div>

                            {(material as MaterialEvaluado).inventarioActual !==
                              undefined &&
                              (material as MaterialEvaluado).inventarioActual! <
                                material.cantidad -
                                  (material as MaterialEvaluado)
                                    .cantidadEntregada && (
                                <div className="space-y-3">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`compras-${material.id}`}
                                      checked={
                                        (material as MaterialEvaluado)
                                          .enviarACompras
                                      }
                                      onChange={(e) =>
                                        handleMaterialChange(
                                          index,
                                          "enviarACompras",
                                          e.target.checked,
                                        )
                                      }
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label
                                      htmlFor={`compras-${material.id}`}
                                      className="ml-2 flex items-center gap-2 text-sm font-medium text-gray-700"
                                    >
                                      <FaShoppingCart className="w-4 h-4 text-blue-600" />
                                      Enviar a compras
                                    </label>
                                  </div>

                                  {(material as MaterialEvaluado)
                                    .enviarACompras && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Cantidad sugerida a comprar
                                      </label>
                                      <input
                                        type="number"
                                        value={
                                          (material as MaterialEvaluado)
                                            .sugerenciaCompra
                                        }
                                        disabled
                                        className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Observaciones
                              {(material as MaterialEvaluado)
                                .enviarACompras && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            <textarea
                              value={(material as MaterialEvaluado).observacion}
                              onChange={(e) =>
                                handleMaterialChange(
                                  index,
                                  "observacion",
                                  e.target.value,
                                )
                              }
                              rows={3}
                              placeholder={
                                (material as MaterialEvaluado).enviarACompras
                                  ? "Describe el motivo por el cual se envía a compras..."
                                  : "Observaciones adicionales (opcional)"
                              }
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                                (material as MaterialEvaluado).enviarACompras &&
                                !(
                                  material as MaterialEvaluado
                                ).observacion.trim()
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                            />
                          </div>

                          {typeof (material as MaterialEvaluado)
                            .restanteInventario === "number" && (
                            <div className="bg-gray-100 p-4 rounded-lg">
                              <span className="text-sm text-gray-600">
                                Inventario restante después de entrega:
                                <span className="font-medium text-gray-900 ml-1">
                                  {
                                    (material as MaterialEvaluado)
                                      .restanteInventario
                                  }{" "}
                                  {material.unidadMedida}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                    {!isEvaluating && material.observacion && (
                      <div className="p-6 bg-gray-50 border-t border-gray-200">
                        <label className="text-sm font-medium text-gray-600">
                          Observación
                        </label>
                        <p className="text-gray-900 mt-1">
                          {material.observacion}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
