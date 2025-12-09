"use client";
import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Save,
  X,
  Image as ImageIcon,
  Send,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import Image from "next/image";
import { format } from "date-fns";
import { crearLevantamiento, obtenerLevantamientoPorId, subirImagenEquipo } from "@/utils/api/ing-proyectos";

// ==========================================
// TIPOS
// ==========================================

interface User {
  usuario: {
    id: number;
    nombre: string;
    correo: string;
    rol: { id: number; nombre: string };
  };
}

interface DatosLevantamiento {
  id?: string;
  solicitante: string;
  fechaSolicitud: string;
  planta: string;
  usuarioRequiriente: string;
  correoUsuario: string;
  areaTrabajo: string;
  tituloCotizacion: string;
  trabajosAlturas: { aplica: boolean; certificado: boolean; notas: string };
  espaciosConfinados: { aplica: boolean; certificado: boolean; notas: string };
  corteSoldadura: { aplica: boolean; certificado: boolean; notas: string };
  izaje: { aplica: boolean; certificado: boolean; notas: string };
  aperturaLineas: { aplica: boolean; certificado: boolean; notas: string };
  excavacion: { aplica: boolean; certificado: boolean; notas: string };
  imagenesEquipos: Array<{
    id: string;
    nombre: string;
    url: string;
    tipo: string;
  }>;
  notasMaquinaria: string;
  numeroFolio?: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
  estado?: "borrador" | "enviado";
}



// interface Proyecto {
//   id: string;
//   nombre: string;
//   cliente: string;
//   obra: string;
//   fechaCreacion: string;
//   fases: {
//     levantamiento: { completado: boolean; fecha?: string; folio?: string };
//     cotizacion: { completado: boolean; fecha?: string; folio?: string };
//     ordenCompra: { completado: boolean; fecha?: string; folio?: string };
//     explosion: { completado: boolean; fecha?: string; folio?: string };
//   };
//   levantamiento?: DatosLevantamiento;
// }

interface Planta {
  id: string;
  nombre: string;
  fechaCreacion: string;
  levantamientosIds: string[];
}

interface LevantamientoFormProps {
  modo: "crear" | "ver-editar";
  planta?: Planta; // ✅ Pasar el objeto completo
  levantamientoId?: string;
  onGuardar?: (datos: DatosLevantamiento) => void;
  onCrearLevantamiento?: (levantamientoId: string) => void;
  onCancelar?: () => void;
}

interface ExcelRow {
  [key: string]: string | number | boolean | null;
}

// ==========================================
// FUNCIONES DE PROCESAMIENTO EXCEL - CORREGIDAS
// ==========================================

/**
 * Busca un valor en el Excel
 */
const buscarValorMejorado = (
  caratula: ExcelRow[],
  textosBusqueda: string[],
): string => {
  for (const textoBusqueda of textosBusqueda) {
    for (const fila of caratula) {
      if (!fila) continue;
      const columnas = Object.keys(fila);
      for (const columna of columnas) {
        const valorColumna = String(fila[columna] || "").trim();
        if (valorColumna.toUpperCase().includes(textoBusqueda.toUpperCase())) {
          const indiceColumna = columnas.indexOf(columna);
          for (let i = indiceColumna + 1; i < columnas.length; i++) {
            const valorSiguiente = String(fila[columnas[i]] || "").trim();
            if (
              valorSiguiente &&
              !valorSiguiente.toUpperCase().includes("SOLICITUD") &&
              !valorSiguiente.toUpperCase().includes("FECHA") &&
              !valorSiguiente.toUpperCase().includes("PLANTA") &&
              !valorSiguiente.toUpperCase().includes("USUARIO") &&
              !valorSiguiente.toUpperCase().includes("CORREO") &&
              !valorSiguiente.toUpperCase().includes("ÁREA") &&
              !valorSiguiente.toUpperCase().includes("TITULO") &&
              !valorSiguiente.toUpperCase().includes("TRABAJOS") &&
              !valorSiguiente.toUpperCase().includes("RENTA") &&
              !valorSiguiente.toUpperCase().includes("NOTAS")
            ) {
              return valorSiguiente;
            }
          }
        }
      }
    }
  }
  return "";
};

/**
 * Verifica si una celda tiene color amarillo (o cualquier color)
 */
const tieneColorAmarillo = (cell: XLSX.CellObject): boolean => {
  if (!cell || !cell.s) return false;

  // Verificar fgColor (fill color)
  if (cell.s.fgColor && cell.s.fgColor.rgb) {
    const rgb = cell.s.fgColor.rgb.toUpperCase();
    // Cualquier color que NO sea blanco
    if (rgb !== "FFFFFF" && rgb !== "00000000" && rgb !== "FFFFFFFF") {
      return true;
    }
  }

  // Verificar bgColor
  if (cell.s.bgColor && cell.s.bgColor.rgb) {
    const rgb = cell.s.bgColor.rgb.toUpperCase();
    if (rgb !== "FFFFFF" && rgb !== "00000000" && rgb !== "FFFFFFFF") {
      return true;
    }
  }

  // Verificar patrón
  if (cell.s.patternType && cell.s.patternType !== "none") {
    return true;
  }

  return false;
};

/**
 * NUEVA FUNCIÓN CORREGIDA: Detecta ambas celdas y ve cuál tiene color
 * Retorna: { SI: boolean, NO: boolean }
 */
const detectarCeldasColoreadas = (
  sheet: XLSX.WorkSheet,
  textosBusqueda: string[],
): { SI: boolean; NO: boolean } => {
  const resultado = {
    SI: false,
    NO: false,
  };

  if (!sheet || !sheet["!ref"]) return resultado;

  const rango = XLSX.utils.decode_range(sheet["!ref"]);

  // Buscar la fila que contiene el texto
  for (const textoBusqueda of textosBusqueda) {
    for (let R = rango.s.r; R <= rango.e.r; R++) {
      let filaEncontrada = false;
      let columnaInicio = -1;

      // Primero encontrar la fila correcta
      for (let C = rango.s.c; C <= rango.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = sheet[cellAddress];

        if (cell && cell.v) {
          const valor = String(cell.v).trim().toUpperCase();
          if (valor.includes(textoBusqueda.toUpperCase())) {
            filaEncontrada = true;
            columnaInicio = C;
            break;
          }
        }
      }

      // Si encontramos la fila, buscar las celdas SI y NO
      if (filaEncontrada) {
        let celdaSI: XLSX.CellObject | null = null;
        let celdaNO: XLSX.CellObject | null = null;

        // Buscar AMBAS celdas (SI y NO) en la fila
        for (let C = columnaInicio + 1; C <= rango.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = sheet[cellAddress];

          if (cell && cell.v) {
            const valor = String(cell.v).trim().toUpperCase();

            if ((valor === "SI" || valor === "SÍ") && !celdaSI) {
              celdaSI = cell;
            } else if (valor === "NO" && !celdaNO) {
              celdaNO = cell;
            }
          }
        }

        // NUEVA LÓGICA: Solo UNO puede estar coloreado (comportamiento de radio button)
        const siColoreado = celdaSI ? tieneColorAmarillo(celdaSI) : false;
        const noColoreado = celdaNO ? tieneColorAmarillo(celdaNO) : false;

        // Si ambos están coloreados, es un error - priorizar SI
        if (siColoreado && noColoreado) {
          console.warn(
            `⚠️ Ambos checkboxes coloreados para ${textoBusqueda}, priorizando SI`,
          );
          resultado.SI = true;
          resultado.NO = false;
        } else {
          resultado.SI = siColoreado;
          resultado.NO = noColoreado;
        }

        console.log(`🔍 ${textoBusqueda}:`, {
          SI: resultado.SI,
          NO: resultado.NO,
          resultado: resultado.SI
            ? "SI marcado"
            : resultado.NO
              ? "NO marcado"
              : "Ninguno marcado",
        });

        return resultado;
      }
    }
  }

  return resultado;
};
/**
 * CORREGIDA: Busca cuál celda (SI o NO) está coloreada
 * SI coloreado = true, NO coloreado = false
 */

const buscarCeldaColoreada = (
  sheet: XLSX.WorkSheet,
  textosBusqueda: string[],
): boolean => {
  const celdas = detectarCeldasColoreadas(sheet, textosBusqueda);

  // DEBUG - Ver qué está pasando
  console.log("=".repeat(50));
  console.log("🔍 Buscando:", textosBusqueda[0]);
  console.log("📊 Celdas detectadas:", {
    "SI coloreado": celdas.SI,
    "NO coloreado": celdas.NO,
  });

  // LÓGICA SIMPLIFICADA: Solo SI coloreado = true
  const resultado = celdas.SI === true;

  console.log(
    `📌 RETORNANDO: ${resultado} (SI coloreado: ${celdas.SI}, NO coloreado: ${celdas.NO})`,
  );
  console.log("=".repeat(50));

  return resultado;
};

/**
 * CORREGIDA: Busca si requiere certificado
 */
// const buscarCertificado = (
//   sheet: XLSX.WorkSheet,
//   textoTrabajo: string,
// ): boolean => {
//   if (!sheet || !sheet["!ref"]) return false;
//
//   const rango = XLSX.utils.decode_range(sheet["!ref"]);
//
//   for (let R = rango.s.r; R <= rango.e.r; R++) {
//     for (let C = rango.s.c; C <= rango.e.c; C++) {
//       const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
//       const cell = sheet[cellAddress];
//
//       if (cell && cell.v) {
//         const valor = String(cell.v).trim().toUpperCase();
//
//         if (valor.includes(textoTrabajo.toUpperCase())) {
//           // Buscar en las siguientes 2 filas la línea de certificación
//           for (
//             let nextR = R + 1;
//             nextR <= Math.min(R + 2, rango.e.r);
//             nextR++
//           ) {
//             for (let nextC = rango.s.c; nextC <= rango.e.c; nextC++) {
//               const nextAddress = XLSX.utils.encode_cell({
//                 r: nextR,
//                 c: nextC,
//               });
//               const nextCell = sheet[nextAddress];
//
//               if (nextCell && nextCell.v) {
//                 const nextValor = String(nextCell.v).trim().toUpperCase();
//
//                 if (
//                   nextValor.includes("CERTIFICAD") ||
//                   nextValor.includes("CUENTA")
//                 ) {
//                   // Buscar específicamente en esta fila las celdas SI/NO para certificado
//                   const celdasCertificado = detectarCeldasColoreadas(sheet, [
//                     "SE CUENTA CON GENTE CERTIFICADA",
//                     "CERTIFICADO",
//                     "CUENTA CON CERTIFICACIÓN",
//                   ]);
//
//                   console.log(
//                     `🔍 Certificado ${textoTrabajo}:`,
//                     celdasCertificado,
//                   );
//
//                   // Solo retorna true si EXPLÍCITAMENTE el SI está coloreado
//                   return celdasCertificado.SI === true;
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//   }
//
//   return false;
// };

/**
 * Busca las notas asociadas a un tipo de trabajo
 */
const buscarNotas = (sheet: XLSX.WorkSheet, textoTrabajo: string): string => {
  if (!sheet || !sheet["!ref"]) return "";

  const rango = XLSX.utils.decode_range(sheet["!ref"]);
  let filaNotas = -1;

  // Buscar la fila que tiene "NOTAS:" después del tipo de trabajo
  for (let R = rango.s.r; R <= rango.e.r; R++) {
    for (let C = rango.s.c; C <= rango.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = sheet[cellAddress];

      if (cell && cell.v) {
        const valor = String(cell.v).trim().toUpperCase();

        if (valor.includes(textoTrabajo.toUpperCase())) {
          // Buscar "NOTAS:" en las siguientes 5 filas
          for (
            let nextR = R + 1;
            nextR <= Math.min(R + 5, rango.e.r);
            nextR++
          ) {
            const notasAddress = XLSX.utils.encode_cell({ r: nextR, c: 0 });
            const notasCell = sheet[notasAddress];

            if (notasCell && notasCell.v) {
              const notasLabel = String(notasCell.v).trim().toUpperCase();
              if (notasLabel.includes("NOTAS")) {
                filaNotas = nextR;
                break;
              }
            }
          }
          break;
        }
      }
    }
    if (filaNotas !== -1) break;
  }

  // Si encontró la fila de NOTAS, buscar el valor
  if (filaNotas !== -1) {
    for (let C = 1; C <= rango.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: filaNotas, c: C });
      const cell = sheet[cellAddress];

      if (cell && cell.v) {
        const valor = String(cell.v).trim();
        if (
          valor &&
          !valor.toUpperCase().includes("NOTAS") &&
          valor.length > 0
        ) {
          return valor;
        }
      }
    }
  }

  return "";
};

/**
 * CORREGIDA: Busca si requiere certificado
 */
const buscarCertificado = (
  sheet: XLSX.WorkSheet,
  textoTrabajo: string,
): boolean | null => {
  if (!sheet || !sheet["!ref"]) return null;

  const rango = XLSX.utils.decode_range(sheet["!ref"]);

  for (let R = rango.s.r; R <= rango.e.r; R++) {
    for (let C = rango.s.c; C <= rango.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = sheet[cellAddress];

      if (cell && cell.v) {
        const valor = String(cell.v).trim().toUpperCase();

        if (valor.includes(textoTrabajo.toUpperCase())) {
          // Buscar en las siguientes 2 filas la línea de certificación
          for (
            let nextR = R + 1;
            nextR <= Math.min(R + 2, rango.e.r);
            nextR++
          ) {
            for (let nextC = rango.s.c; nextC <= rango.e.c; nextC++) {
              const nextAddress = XLSX.utils.encode_cell({
                r: nextR,
                c: nextC,
              });
              const nextCell = sheet[nextAddress];

              if (nextCell && nextCell.v) {
                const nextValor = String(nextCell.v).trim().toUpperCase();

                if (
                  nextValor.includes("CERTIFICAD") ||
                  nextValor.includes("CUENTA")
                ) {
                  // Usar la misma lógica para detectar celdas coloreadas
                  const celdasCertificado = detectarCeldasColoreadas(sheet, [
                    "SE CUENTA CON GENTE CERTIFICADA",
                  ]);

                  console.log(
                    `🔍 Certificado ${textoTrabajo}:`,
                    celdasCertificado,
                  );

                  if (celdasCertificado.SI && !celdasCertificado.NO) {
                    return true;
                  } else if (celdasCertificado.NO && !celdasCertificado.SI) {
                    return false;
                  } else {
                    return false;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return false;
};

/**
 * Función para detectar estados de trabajos
 */
const procesarTipoTrabajo = (
  sheet: XLSX.WorkSheet,
  textosBusqueda: string[],
): { aplica: boolean; certificado: boolean; notas: string } => {
  const aplica = buscarCeldaColoreada(sheet, textosBusqueda) ?? false;
  const certificado = buscarCertificado(sheet, textosBusqueda[0]) ?? false;
  const notas = buscarNotas(sheet, textosBusqueda[0]);

  console.log(`📊 RESULTADO ${textosBusqueda[0]}:`, {
    aplica,
    certificado,
    notas: notas || "(sin notas)",
  });

  return { aplica, certificado, notas };
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export function LevantamientoForm({
  modo,
  planta,
  levantamientoId,
  onGuardar,
  onCrearLevantamiento,
  onCancelar,
}: LevantamientoFormProps) {
  const [, setUsuarioActual] = useState<User | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [modoEdicion] = useState(modo === "crear");
  const [guardando, setGuardando] = useState(false);
  const [notificacion, setNotificacion] = useState<{
    tipo: "exito" | "error" | "info";
    mensaje: string;
  } | null>(null);

  const [datos, setDatos] = useState<DatosLevantamiento>({
    solicitante: "",
    fechaSolicitud: "",
    planta: "",
    usuarioRequiriente: "",
    correoUsuario: "",
    areaTrabajo: "",
    tituloCotizacion: "",
    trabajosAlturas: { aplica: false, certificado: false, notas: "" },
    espaciosConfinados: { aplica: false, certificado: false, notas: "" },
    corteSoldadura: { aplica: false, certificado: false, notas: "" },
    izaje: { aplica: false, certificado: false, notas: "" },
    aperturaLineas: { aplica: false, certificado: false, notas: "" },
    excavacion: { aplica: false, certificado: false, notas: "" },
    imagenesEquipos: [],
    notasMaquinaria: "",
  });

  // Obtener usuario actual de cookies
  useEffect(() => {
    try {
      const cookies = document.cookie.split(";");
      const usuarioCookie = cookies.find((c) =>
        c.trim().startsWith("usuario="),
      );
      if (usuarioCookie) {
        const usuario = JSON.parse(
          decodeURIComponent(usuarioCookie.split("=")[1]),
        );
        setUsuarioActual(usuario);
        setDatos((prev) => ({
          ...prev,
          usuarioRequiriente: usuario.usuario.nombre,
        }));
      }
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
    }
    const cargarLevantamientoExistente = async () => {
      try {

        if (!levantamientoId) {
          mostrarNotificacion("error", "ID de levantamiento no válido");
          return;
        }

        const levantamientoData = await obtenerLevantamientoPorId(parseInt(levantamientoId));

        if (levantamientoData) {
          // Adaptar los datos de la API al formato del formulario
          setDatos({
            solicitante: levantamientoData.cliente || "",
            fechaSolicitud: levantamientoData.fecha_solicitud || "",
            planta: levantamientoData.planta_nombre || levantamientoData.planta || "",
            usuarioRequiriente: levantamientoData.usuario_requiriente || "",
            correoUsuario: levantamientoData.correo_usuario || "",
            areaTrabajo: levantamientoData.area_trabajo || "",
            tituloCotizacion: levantamientoData.titulo_cotizacion || "",
            trabajosAlturas: {
              aplica: levantamientoData.trabajos_alturas?.aplica || false,
              certificado: levantamientoData.trabajos_alturas?.certificado || false,
              notas: levantamientoData.trabajos_alturas?.notas || "",
            },
            espaciosConfinados: {
              aplica: levantamientoData.espacios_confinados?.aplica || false,
              certificado: levantamientoData.espacios_confinados?.certificado || false,
              notas: levantamientoData.espacios_confinados?.notas || "",
            },
            corteSoldadura: {
              aplica: levantamientoData.corte_soldadura?.aplica || false,
              certificado: levantamientoData.corte_soldadura?.certificado || false,
              notas: levantamientoData.corte_soldadura?.notas || "",
            },
            izaje: {
              aplica: levantamientoData.izaje?.aplica || false,
              certificado: levantamientoData.izaje?.certificado || false,
              notas: levantamientoData.izaje?.notas || "",
            },
            aperturaLineas: {
              aplica: levantamientoData.apertura_lineas?.aplica || false,
              certificado: levantamientoData.apertura_lineas?.certificado || false,
              notas: levantamientoData.apertura_lineas?.notas || "",
            },
            excavacion: {
              aplica: levantamientoData.excavacion?.aplica || false,
              certificado: levantamientoData.excavacion?.certificado || false,
              notas: levantamientoData.excavacion?.notas || "",
            },
            imagenesEquipos: [], // Las imágenes se manejarán por separado
            notasMaquinaria: levantamientoData.notas_maquinaria || "",
          });
        }
      } catch (error) {
        console.error("Error cargando levantamiento:", error);
        mostrarNotificacion("error", "Error al cargar el levantamiento");
      }
    };

    // Cargar datos del levantamiento si estamos en modo edición
    if (modo === "ver-editar" && levantamientoId) {
      cargarLevantamientoExistente();
    }
  }, [modo, levantamientoId]); // Agregar levantamientoId como dependencia


  const mostrarNotificacion = (
    tipo: "exito" | "error" | "info",
    mensaje: string,
  ) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion(null), 4000);
  };

  const handleCargarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls") &&
      !file.name.endsWith(".xlsm")
    ) {
      mostrarNotificacion("error", "Solo se permiten archivos Excel");
      return;
    }

    setProcesando(true);
    setArchivo(file);

    try {
      const reader = new FileReader();

      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);

        const workbook = XLSX.read(data, {
          type: "array",
          cellStyles: true,
          cellHTML: false,
          cellFormula: false,
        });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const caratula = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          raw: false,
        }) as ExcelRow[];

        console.log("📊 Procesando Excel con nueva lógica...");

        // Datos básicos
        const solicitante = buscarValorMejorado(caratula, [
          "SOLICITANTE",
          "EMPRESA",
          "COMPAÑÍA",
        ]);

        const fechaSolicitud = buscarValorMejorado(caratula, [
          "FECHA DE SOLICITUD",
          "FECHA SOLICITUD",
        ]);

        const planta = buscarValorMejorado(caratula, [
          "PLANTA",
          "UBICACIÓN",
          "LUGAR",
        ]);

        const areaTrabajo = buscarValorMejorado(caratula, [
          "ÁREA DE TRABAJO",
          "AREA",
          "ZONA",
        ]);

        const tituloCotizacion = buscarValorMejorado(caratula, [
          "TITULO DE COTIZACIÓN",
          "TITULO",
          "ASUNTO",
          "PROYECTO",
        ]);

        const correoUsuario = buscarValorMejorado(caratula, [
          "CORREO",
          "EMAIL",
          "E-MAIL",
          "CORREO ELECTRÓNICO",
        ]);

        console.log("🔍 Procesando tipos de trabajo...");

        // Procesar todos los tipos de trabajo
        const trabajosAlturas = procesarTipoTrabajo(sheet, [
          "TRABAJOS EN ALTURAS",
          "ALTURAS",
        ]);

        const espaciosConfinados = procesarTipoTrabajo(sheet, [
          "ESPACIOS CONFINADOS",
          "CONFINADOS",
        ]);

        const corteSoldadura = procesarTipoTrabajo(sheet, [
          "CORTE Y SOLDADURA",
          "SOLDADURA",
        ]);

        const izaje = procesarTipoTrabajo(sheet, [
          "TRABAJOS DE IZAJE",
          "IZAJE",
        ]);

        const aperturaLineas = procesarTipoTrabajo(sheet, [
          "APERTURA DE LÍNEAS",
          "APERTURA DE LINEAS",
          "LÍNEAS",
        ]);

        const excavacion = procesarTipoTrabajo(sheet, [
          "TRABAJOS DE EXCAVACION",
          "EXCAVACIÓN",
          "EXCAVACION",
        ]);

        console.log("📋 RESULTADOS FINALES:");
        console.table([
          {
            Trabajo: "Alturas",
            Aplica: trabajosAlturas.aplica,
            Certificado: trabajosAlturas.certificado,
            Notas: trabajosAlturas.notas,
          },
          {
            Trabajo: "Confinados",
            Aplica: espaciosConfinados.aplica,
            Certificado: espaciosConfinados.certificado,
            Notas: espaciosConfinados.notas,
          },
          {
            Trabajo: "Corte/Soldadura",
            Aplica: corteSoldadura.aplica,
            Certificado: corteSoldadura.certificado,
            Notas: corteSoldadura.notas,
          },
          {
            Trabajo: "Izaje",
            Aplica: izaje.aplica,
            Certificado: izaje.certificado,
            Notas: izaje.notas,
          },
          {
            Trabajo: "Apertura Líneas",
            Aplica: aperturaLineas.aplica,
            Certificado: aperturaLineas.certificado,
            Notas: aperturaLineas.notas,
          },
          {
            Trabajo: "Excavación",
            Aplica: excavacion.aplica,
            Certificado: excavacion.certificado,
            Notas: excavacion.notas,
          },
        ]);

        setDatos((prev) => ({
          ...prev,
          solicitante: solicitante || prev.solicitante,
          fechaSolicitud:
            format(fechaSolicitud, "yyyy-MM-dd") ||
            format(prev.fechaSolicitud, "yyyy-MM-dd"),
          planta: planta || prev.planta,
          correoUsuario: correoUsuario || prev.correoUsuario,
          areaTrabajo: areaTrabajo || prev.areaTrabajo,
          tituloCotizacion: tituloCotizacion || prev.tituloCotizacion,
          trabajosAlturas,
          espaciosConfinados,
          corteSoldadura,
          izaje,
          aperturaLineas,
          excavacion,
        }));

        mostrarNotificacion("exito", "✅ Excel procesado");
        setProcesando(false);
      };

      reader.onerror = () => {
        mostrarNotificacion("error", "Error al leer el archivo");
        setProcesando(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error procesando Excel:", error);
      mostrarNotificacion("error", "Error al procesar el archivo Excel");
      setProcesando(false);
    }
  };

  // ... (resto de las funciones handleImagenesEquipos, eliminarImagen, handleGuardar se mantienen igual)

  // En LevantamientoForm.tsx
  const handleImagenesEquipos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Limitar a 3 imágenes máximo para reducir payload
    const archivos = Array.from(files).slice(0, 3);

    for (const file of archivos) {
      // Validar tamaño máximo inicial (2MB)
      if (file.size > 2 * 1024 * 1024) {
        mostrarNotificacion("error", `Imagen ${file.name} muy grande (máx 2MB)`);
        continue;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        mostrarNotificacion("error", `El archivo ${file.name} no es una imagen válida`);
        continue;
      }

      // Mostrar información de compresión
      mostrarNotificacion("info", `Comprimiendo: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

      try {
        // Crear vista previa inmediata
        const reader = new FileReader();
        reader.onload = (event) => {
          const nuevaImagen = {
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            nombre: file.name,
            url: event.target?.result as string,
            tipo: file.type,
            tamaño: file.size,
            estado: 'pendiente' as const
          };

          setDatos((prev) => ({
            ...prev,
            imagenesEquipos: [...prev.imagenesEquipos, nuevaImagen],
          }));
        };
        reader.readAsDataURL(file);

      } catch (error) {
        console.error("Error procesando imagen:", error);
        mostrarNotificacion("error", `Error al procesar ${file.name}`);
      }
    }
  };

  const eliminarImagen = (id: string) => {
    setDatos((prev) => ({
      ...prev,
      imagenesEquipos: prev.imagenesEquipos.filter((img) => img.id !== id),
    }));
  };

  const handleGuardar = async () => {
    if (!datos.solicitante || !datos.planta) {
      mostrarNotificacion("error", "Completa los campos obligatorios");
      return;
    }

    if (modo === "crear" && !planta) {
      mostrarNotificacion("error", "Error: No se encontró la planta");
      return;
    }

    setGuardando(true);

    try {
      if (modo === "crear") {
        // Obtener usuario actual para el usuario_id
        const cookies = document.cookie.split(";");
        const usuarioCookie = cookies.find((c) => c.trim().startsWith("usuario="));
        let usuarioId: number | undefined;

        if (usuarioCookie) {
          const usuario = JSON.parse(decodeURIComponent(usuarioCookie.split("=")[1]));
          usuarioId = usuario.usuario.id;
        }

        // Crear levantamiento usando la API
        const levantamientoData = {
          planta_id: parseInt(planta!.id),
          nombre: datos.tituloCotizacion || `Levantamiento ${planta!.nombre}`,
          cliente: datos.solicitante,
          planta_nombre: datos.planta,
          obra: datos.areaTrabajo,
          solicitante: datos.solicitante,
          fecha_solicitud: datos.fechaSolicitud || new Date().toISOString().split('T')[0],
          usuario_requiriente: datos.usuarioRequiriente,
          correo_usuario: datos.correoUsuario,
          area_trabajo: datos.areaTrabajo,
          titulo_cotizacion: datos.tituloCotizacion,
          trabajos_alturas: datos.trabajosAlturas,
          espacios_confinados: datos.espaciosConfinados,
          corte_soldadura: datos.corteSoldadura,
          izaje: datos.izaje,
          apertura_lineas: datos.aperturaLineas,
          excavacion: datos.excavacion,
          notas_maquinaria: datos.notasMaquinaria,
          usuario_id: usuarioId,
        };

        const response = await crearLevantamiento(levantamientoData);

        // Subir imágenes si hay alguna
        // En la parte de creación, después de crear el levantamiento:
        if (datos.imagenesEquipos.length > 0 && response.id) {
          for (const imagen of datos.imagenesEquipos) {
            try {
              // Convertir data URL a File
              const responseImg = await fetch(imagen.url);
              const blob = await responseImg.blob();
              const file = new File([blob], imagen.nombre, { type: imagen.tipo });

              await subirImagenEquipo(
                response.id, // Usar el ID de la respuesta
                file,
                `Imagen de equipo ${imagen.nombre}`,
                datos.imagenesEquipos.indexOf(imagen) + 1
              );
            } catch (error) {
              console.error("Error subiendo imagen:", error);
            }
          }
        }

        mostrarNotificacion("exito", "✅ Levantamiento creado correctamente");

        if (onCrearLevantamiento) {
          onCrearLevantamiento(response.id.toString());
        }
      } else {
        // Modo edición - actualizar levantamiento existente
        // Nota: Necesitarías agregar una función de actualización en tu API
        mostrarNotificacion("info", "Función de edición en desarrollo");

        if (onGuardar) {
          onGuardar(datos);
        }
      }
    } catch (err: unknown) {
      console.error("Error guardando levantamiento:", err);

      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          mostrarNotificacion("error", `Error: ${axiosError.response.data.message}`)
        }
      } else if (err instanceof Error) {
        mostrarNotificacion("error", `Error: ${err.message}`);
      } else {
        mostrarNotificacion("error", "Error al guardar el levantamiento");
      }
    } finally {
      setGuardando(false);
    }
  };
  const TrabajoCheckbox = ({
    titulo,
    datos,
    onChange,
  }: {
    titulo: string;
    datos: { aplica: boolean; certificado: boolean; notas: string };
    onChange: (campo: string, valor: number | boolean | string) => void;
  }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-center gap-4 mb-2">
        {/* Checkbox APLICA */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={datos.aplica}
            onChange={(e) => {
              const nuevoAplica = e.target.checked;
              onChange("aplica", nuevoAplica);
              // Si no aplica, resetear certificado
              if (!nuevoAplica) {
                onChange("certificado", false);
              }
            }}
            disabled={!modoEdicion}
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="font-medium text-gray-700">{titulo}</span>
        </label>

        {/* Checkbox CERTIFICADO - solo visible si APLICA es true */}
        {datos.aplica && (
          <label className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-600 mr-2">Certificado:</span>
            <input
              type="checkbox"
              checked={datos.certificado}
              onChange={(e) => onChange("certificado", e.target.checked)}
              disabled={!modoEdicion}
              className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
            />
            <span className="text-sm text-gray-600">
              {datos.certificado ? "Sí" : "No"}
            </span>
          </label>
        )}
      </div>

      {/* Campo NOTAS - solo visible si APLICA es true y hay notas */}
      {datos.aplica && datos.notas && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas:
          </label>
          <input
            type="text"
            value={datos.notas}
            onChange={(e) => onChange("notas", e.target.value)}
            disabled={!modoEdicion}
            placeholder="Notas adicionales..."
            className="w-full p-2 border border-gray-300 rounded text-sm disabled:bg-gray-100 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {notificacion && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-slideIn ${notificacion.tipo === "exito" ? "bg-green-500 text-white" : ""
            }${notificacion.tipo === "error" ? "bg-red-500 text-white" : ""}${notificacion.tipo === "info" ? "bg-blue-500 text-white" : ""
            }`}
        >
          {notificacion.mensaje}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {modo === "crear" ? "Nuevo Levantamiento" : "Levantamiento"}
          </h1>
          <p className="text-gray-500 mt-2">Sube tu excel de levantamiento</p>
        </div>

        {modoEdicion && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <label className="flex items-center justify-center gap-3 bg-green-50 text-green-700 px-6 py-4 rounded-lg hover:bg-green-100 cursor-pointer border-2 border-dashed border-green-300">
              <FileSpreadsheet size={32} />
              <span className="font-medium">
                {archivo ? archivo.name : "Cargar Excel de Carátula"}
              </span>
              {procesando && <Loader2 className="animate-spin" size={20} />}
              <input
                type="file"
                accept=".xlsx,.xls,.xlsm"
                onChange={handleCargarExcel}
                className="hidden"
                disabled={procesando}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2 text-center">
              💡 SI coloreado = Checkbox MARCADO | NO coloreado = Checkbox
              DESMARCADO
            </p>
          </div>
        )}

        {/* ... (resto del JSX se mantiene igual) */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Datos Generales</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Solicitante *
              </label>
              <input
                type="text"
                value={datos.solicitante}
                onChange={(e) =>
                  setDatos({ ...datos, solicitante: e.target.value })
                }
                disabled={!modoEdicion}
                className="w-full p-3 border rounded-lg disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Fecha de Solicitud
              </label>
              <input
                type="date"
                value={datos.fechaSolicitud}
                onChange={(e) =>
                  setDatos({ ...datos, fechaSolicitud: e.target.value })
                }
                disabled={!modoEdicion}
                className="w-full p-3 border rounded-lg disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Planta *</label>
              <input
                type="text"
                value={datos.planta}
                onChange={(e) => setDatos({ ...datos, planta: e.target.value })}
                disabled={!modoEdicion}
                className="w-full p-3 border rounded-lg disabled:bg-gray-100"
              />
            </div>

            <div className="hidden">
              <label className="block text-sm font-medium mb-2">
                Usuario Requiriente (Interno)
              </label>
              <input
                type="text"
                value={datos.usuarioRequiriente}
                disabled
                className="w-full p-3 border rounded-lg bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Correo (Del Excel)
              </label>
              <input
                type="email"
                value={datos.correoUsuario}
                onChange={(e) =>
                  setDatos({ ...datos, correoUsuario: e.target.value })
                }
                disabled={!modoEdicion}
                className="w-full p-3 border rounded-lg disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Área de Trabajo
              </label>
              <input
                type="text"
                value={datos.areaTrabajo}
                onChange={(e) =>
                  setDatos({ ...datos, areaTrabajo: e.target.value })
                }
                disabled={!modoEdicion}
                className="w-full p-3 border rounded-lg disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Título de Cotización
            </label>
            <textarea
              value={datos.tituloCotizacion}
              onChange={(e) =>
                setDatos({ ...datos, tituloCotizacion: e.target.value })
              }
              disabled={!modoEdicion}
              rows={2}
              className="w-full p-3 border rounded-lg disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Tipos de Trabajo</h2>
          <div className="space-y-4">
            <TrabajoCheckbox
              titulo="Trabajos en Alturas"
              datos={datos.trabajosAlturas}
              onChange={(campo, valor) =>
                setDatos({
                  ...datos,
                  trabajosAlturas: { ...datos.trabajosAlturas, [campo]: valor },
                })
              }
            />
            <TrabajoCheckbox
              titulo="Espacios Confinados"
              datos={datos.espaciosConfinados}
              onChange={(campo, valor) =>
                setDatos({
                  ...datos,
                  espaciosConfinados: {
                    ...datos.espaciosConfinados,
                    [campo]: valor,
                  },
                })
              }
            />
            <TrabajoCheckbox
              titulo="Corte y Soldadura"
              datos={datos.corteSoldadura}
              onChange={(campo, valor) =>
                setDatos({
                  ...datos,
                  corteSoldadura: { ...datos.corteSoldadura, [campo]: valor },
                })
              }
            />
            <TrabajoCheckbox
              titulo="Izaje"
              datos={datos.izaje}
              onChange={(campo, valor) =>
                setDatos({
                  ...datos,
                  izaje: { ...datos.izaje, [campo]: valor },
                })
              }
            />
            <TrabajoCheckbox
              titulo="Apertura de Líneas"
              datos={datos.aperturaLineas}
              onChange={(campo, valor) =>
                setDatos({
                  ...datos,
                  aperturaLineas: { ...datos.aperturaLineas, [campo]: valor },
                })
              }
            />
            <TrabajoCheckbox
              titulo="Excavación"
              datos={datos.excavacion}
              onChange={(campo, valor) =>
                setDatos({
                  ...datos,
                  excavacion: { ...datos.excavacion, [campo]: valor },
                })
              }
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Imágenes de Equipos</h2>

          {modoEdicion && (
            <label className="flex items-center justify-center gap-3 bg-blue-50 text-blue-600 px-6 py-4 rounded-lg hover:bg-blue-100 cursor-pointer border-2 border-dashed border-blue-300 mb-4">
              <ImageIcon size={32} />
              <span className="font-medium">Agregar imágenes</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagenesEquipos}
                className="hidden"
              />
            </label>
          )}

          {datos.imagenesEquipos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {datos.imagenesEquipos.map((img) => (
                <div key={img.id} className="relative group">
                  <Image
                    src={img.url}
                    alt={img.nombre}
                    width={128}
                    height={128}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  {modoEdicion && (
                    <button
                      onClick={() => eliminarImagen(img.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <textarea
            value={datos.notasMaquinaria}
            onChange={(e) =>
              setDatos({ ...datos, notasMaquinaria: e.target.value })
            }
            disabled={!modoEdicion}
            rows={3}
            placeholder="Notas sobre equipos..."
            className="w-full p-3 border rounded-lg disabled:bg-gray-100"
          />
        </div>

        <div className="flex gap-4 sticky bottom-6 bg-white p-4 rounded-xl shadow-lg">
          {modo === "crear" ? (
            <>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400"
              >
                {guardando ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Send size={20} />
                )}
                {guardando ? "Creando..." : "Crear Proyecto"}
              </button>
              <button
                onClick={() =>
                  onCancelar ? onCancelar() : window.history.back()
                }
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              {modoEdicion && (
                <button
                  onClick={handleGuardar}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <Save size={20} />
                  Guardar Borrador
                </button>
              )}
              <button
                onClick={() =>
                  onCancelar ? onCancelar() : window.history.back()
                }
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Volver
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// ... (DemoLevantamiento se mantiene igual)
