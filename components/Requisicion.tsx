"use client"
import { useState, useEffect, useMemo } from "react"
import type React from "react"

import {
  FaFileExcel,
  FaFilePdf,
  FaPlus,
  FaSpinner,
  FaUser,
  FaCalendarAlt,
  FaDownload,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa"
import ModalRequisicion from "./ModalRequisicion"
import { descargarArchivoExcel, obtenerRequisiciones } from "../utils/api/requisicion"
import type { Material } from "../types/material"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { getCookie } from "cookies-next"

interface Props {
  search: string
  setNotifications: React.Dispatch<React.SetStateAction<number>>
}

interface Requisicion {
  id: number
  folio: string
  proyecto: string
  orden?: string
  origen: string
  empleado: string
  idEstado: number
  estado: { id: number; nombre: string }
  fechaSolicitud: string
  observaciones?: string
  materiales: Material[]
  archivoExcelNombre?: string
  archivoExcelRuta?: string
}


// normaliza texto para búsqueda (remove diacritics)
const normalize = (str: string) =>
  (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

const extraerPermisosUsuario = (usuarioData: User) => {
  const permisos = {
    rol: usuarioData?.usuario?.rol?.nombre?.toLowerCase().trim() || "",
    modulos: new Set<string>(),
    submodulos: new Set<string>(),
    puedeAccederRequisiciones: false
  }

  if (!usuarioData?.permisos) return permisos

  // Recorrer todos los permisos
  Object.values(usuarioData.permisos).forEach(permiso => {
    // Agregar módulo principal
    if (permiso.endpoint) {
      permisos.modulos.add(permiso.endpoint.toLowerCase())
    }

    // Verificar si tiene acceso al módulo de requisiciones
    if (permiso.endpoint === "requisiciones") {
      permisos.puedeAccederRequisiciones = true
    }

    // Agregar sub-permisos
    if (permiso.sub_permisos) {
      Object.values(permiso.sub_permisos).forEach(subPermiso => {
        if (subPermiso.endpoint) {
          permisos.submodulos.add(subPermiso.endpoint.toLowerCase())
        }
      })
    }
  })

  return permisos
}

export default function Requisicion({ search, setNotifications }: Props) {
  const [areasUsuario, setAreasUsuario] = useState<string[]>([])
  const [rolUsuario, setRolUsuario] = useState<string>("")

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = getCookie("usuario")
      const usuarioData: User = raw ? JSON.parse(raw.toString()) : null

      if (!usuarioData) {
        setAreasUsuario([])
        setRolUsuario("")
        return
      }

      const permisos = extraerPermisosUsuario(usuarioData)

      setRolUsuario(permisos.rol)

      // Convertir Sets a arrays para el state
      const areas = [
        ...Array.from(permisos.modulos),
        ...Array.from(permisos.submodulos)
      ]
      setAreasUsuario(areas)

    } catch (err) {
      console.error("Error al procesar permisos:", err)
      setAreasUsuario([])
      setRolUsuario("")
    }
  }, [])

  const [requisiciones, setRequisiciones] = useState<Requisicion[]>([])
  const [isModalNuevaOpen, setIsModalNuevaOpen] = useState(false)

  const [loading, setLoading] = useState(true)

  // filtros UI
  const [filtroEstado, setFiltroEstado] = useState<string>("")
  const [filtroOrigen, setFiltroOrigen] = useState<string>("")

  // expansión y animación
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [animatingRows, setAnimatingRows] = useState<Set<number>>(new Set())

  // export state
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null)

  // paginación
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const formatFecha = (f: string | Date | null | undefined) => {
    if (!f) return "-"
    const d = typeof f === "string" ? new Date(f) : f
    if (Number.isNaN(d.getTime?.())) return String(f)
    return d.toLocaleDateString("es-MX")
  }

  const fetchRequisiciones = async () => {
    try {
      setLoading(true)
      const res = await obtenerRequisiciones()
      setRequisiciones(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequisiciones()
  }, [])

  // únicos para selects
  const estadosUnicos = useMemo(
    () => Array.from(new Set(requisiciones.map((r) => r.estado?.nombre).filter(Boolean))),
    [requisiciones],
  )

  const origenesUnicos = useMemo(
    () => Array.from(new Set(requisiciones.map((r) => r.origen).filter(Boolean))),
    [requisiciones],
  )


  const puedeVerRequisicion = (requisicion: Requisicion, rol: string, areas: string[]) => {
    // Si no hay permisos cargados, no mostrar nada (más seguro)
    if (areas.length === 0 && !rol) return false

    const rolLower = rol.toLowerCase()

    // ADMINISTRADOR: Ve todo
    if (rolLower === "administrador") return true

    // ALMACÉN: Ve todo (gestiona inventario)
    if (rolLower === "almacén" || rolLower === "almacen") return true

    // COMPRAS: Solo ve requisiciones con materiales en ciertos estados
    if (rolLower === "compras") {
      return requisicion.materiales.some(m => {
        const estatus = m.estatus?.nombre?.toLowerCase() || ""
        return estatus === "pendiente" ||
          estatus === "compra realizada" ||
          estatus === "en proceso de compra"
      })
    }

    // USUARIOS CON MÓDULO DE REQUISICIONES: Ven requisiciones de sus áreas
    const tieneAccesoRequisiciones = areas.includes("requisiciones")

    if (tieneAccesoRequisiciones) {
      // Verificar si el origen de la requisición coincide con algún permiso del usuario
      const origenNormalizado = requisicion.origen?.toLowerCase()
        .replace(/\s+/g, '_')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")

      // Buscar coincidencia con áreas del usuario
      return areas.some(area => {
        const areaNormalizada = area.toLowerCase()
          .replace(/\s+/g, '_')
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")

        return origenNormalizado.includes(areaNormalizada) ||
          areaNormalizada.includes(origenNormalizado)
      })
    }

    // Si no cumple ninguna condición, no tiene acceso
    return false
  }

  // permisos por áreas + filtros + búsqueda
  const requisicionesFiltradas = useMemo(() => {
    const s = normalize(search)

    // Filtrar por permisos
    const visiblePorPermisos = requisiciones.filter(r =>
      puedeVerRequisicion(r, rolUsuario, areasUsuario)
    )

    // Filtrar por estado
    const porEstado = filtroEstado === ""
      ? visiblePorPermisos
      : visiblePorPermisos.filter(r => r.estado?.nombre === filtroEstado)

    // Filtrar por origen
    const porOrigen = filtroOrigen === ""
      ? porEstado
      : porEstado.filter(r => r.origen === filtroOrigen)

    // Filtrar por búsqueda
    return porOrigen.filter(r =>
      normalize(
        [
          r.folio,
          r.proyecto,
          r.orden,
          r.origen,
          r.empleado,
          r.estado?.nombre,
          r.observaciones ?? "",
          ...r.materiales.map(m =>
            [m.material, m.descripcion, m.observacion, m.urgencia?.descripcion]
              .filter(Boolean)
              .join(" ")
          ),
        ]
          .filter(Boolean)
          .join(" ")
      ).includes(s)
    )
  }, [requisiciones, search, areasUsuario, rolUsuario, filtroEstado, filtroOrigen])

  // métricas
  const total = requisicionesFiltradas.length
  const pendientes = requisicionesFiltradas.filter((r) => r.estado?.nombre === "Pendiente").length
  const seguimiento = requisicionesFiltradas.filter((r) => r.estado?.nombre === "En seguimiento").length
  const finalizadas = requisicionesFiltradas.filter((r) => r.estado?.nombre === "Finalizado").length

  // paginación derivada
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = requisicionesFiltradas.slice(startIndex, startIndex + itemsPerPage)

  // helpers UI (clases tailwind)
  const getStatusColor = (estado: string) => {
    switch ((estado || "").toLowerCase()) {
      case "pendiente":
        return "bg-red-50 text-red-700 border border-red-200"
      case "en seguimiento":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200"
      case "finalizado":
        return "bg-green-50 text-green-700 border border-green-200"
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200"
    }
  }

  const getUrgencyDot = (urg?: string) => {
    switch ((urg || "").toLowerCase()) {
      case "alta":
        return "bg-red-500"
      case "media":
        return "bg-yellow-500"
      default:
        return "bg-green-500"
    }
  }

  const toggleExpand = (id: number) => {
    setAnimatingRows((prev) => new Set(prev).add(id))
    setExpandedRows((prev) => {
      const copy = new Set(prev)
      if (copy.has(id)) {
        copy.delete(id)
      } else {
        copy.add(id)
      }
      return copy
    })
    setTimeout(() => {
      setAnimatingRows((prev) => {
        const copy = new Set(prev)
        copy.delete(id)
        return copy
      })
    }, 350)
  }

  // Determinar si el usuario puede crear nuevas requisiciones
  const puedeCrearRequisiciones = useMemo(() => {
    if (rolUsuario === "administrador") return true
    if (rolUsuario === "compras") return false // Compras no puede crear requisiciones
    return areasUsuario.length > 0 // Otros roles pueden crear si tienen al menos un área
  }, [rolUsuario, areasUsuario])

  // export
  const handleExport = async (type: "excel" | "pdf") => {
    try {
      setIsExporting(type)
      if (type === "excel") {
        const worksheet = XLSX.utils.json_to_sheet(
          requisicionesFiltradas.map((r) => ({
            id: r.id,
            folio: r.folio,
            proyecto: r.proyecto,
            orden: r.orden || "-",
            empleado: r.empleado,
            origen: r.origen,
            estado: r.estado?.nombre,
            fechaSolicitud: new Date(r.fechaSolicitud).toLocaleDateString("es-MX"),
            materiales: r.materiales.map((m) => `${m.material} (${m.cantidad} ${m.unidadMedida})`).join(" | "),
            observaciones: r.observaciones || "-",
          })),
        )
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Requisiciones")
        const excelBuffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        })
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
        saveAs(blob, `Requisiciones_${new Date().toISOString().slice(0, 10)}.xlsx`)
      } else {
        const doc = new jsPDF()
        const img = new Image()
        img.src = "/Logo.png"
        img.onload = () => {
          doc.addImage(img, "PNG", 10, 10, 25, 25)
          doc.setFontSize(16)
          doc.text("Listado de Requisiciones", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" })
          const fecha = new Date().toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
          doc.setFontSize(10)
          doc.text(`Fecha de descarga: ${fecha}`, doc.internal.pageSize.getWidth() / 2, 28, { align: "center" })

          const headers = ["ID", "Empleado", "Material", "Cantidad", "Unidad", "Origen", "Fecha"]
          const rows = requisicionesFiltradas.flatMap((r) =>
            r.materiales.map((m) => [
              r.id,
              r.empleado,
              m.material,
              m.cantidad,
              m.unidadMedida,
              r.origen,
              new Date(r.fechaSolicitud).toLocaleDateString("es-MX"),
            ]),
          )

          autoTable(doc, {
            startY: 40,
            head: [headers],
            body: rows,
            styles: {
              fontSize: 7,
              cellWidth: "wrap",
              overflow: "linebreak",
              valign: "middle",
            },
            headStyles: {
              fillColor: [148, 12, 37],
              halign: "center",
              fontSize: 8,
              textColor: [255, 255, 255],
            },
            bodyStyles: { halign: "left" },
          })

          doc.save(`Listado_Requisiciones_${new Date().toISOString().slice(0, 10)}.pdf`)
        }
      }
    } finally {
      setTimeout(() => setIsExporting(null), 400)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Requisiciones</h1>
          <p className="text-gray-600">Administra y supervisa todas las requisiciones del sistema</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", value: total, bg: "bg-blue-500", icon: "📋" },
            {
              label: "Pendientes",
              value: pendientes,
              bg: "bg-red-500",
              icon: "⏳",
            },
            {
              label: "En Seguimiento",
              value: seguimiento,
              bg: "bg-yellow-500",
              icon: "👁️",
            },
            {
              label: "Finalizadas",
              value: finalizadas,
              bg: "bg-green-500",
              icon: "✅",
            },
          ].map((s, idx) => (
            <div
              key={s.label}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transform hover:scale-[1.02] transition-all duration-200"
              style={{
                animationName: "slideInUp",
                animationDuration: "500ms",
                animationTimingFunction: "ease-out",
                animationFillMode: "forwards",
                animationDelay: `${idx * 90}ms`,
                opacity: 0,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
                <div
                  className={`w-12 h-12 ${s.bg} rounded-lg flex items-center justify-center text-white text-xl shadow-lg`}
                >
                  {s.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Todos los estados</option>
                {estadosUnicos.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>

              <select
                value={filtroOrigen}
                onChange={(e) => {
                  setFiltroOrigen(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Todos los orígenes</option>
                {origenesUnicos.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-2">
              {puedeCrearRequisiciones && (
                <button
                  onClick={() => setIsModalNuevaOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  <FaPlus />
                  Nueva Requisición
                </button>
              )}

              <button
                onClick={() => handleExport("excel")}
                disabled={isExporting === "excel"}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                {isExporting === "excel" ? <FaSpinner className="animate-spin" /> : <FaFileExcel />}
                Excel
              </button>

              <button
                onClick={() => handleExport("pdf")}
                disabled={isExporting === "pdf"}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                {isExporting === "pdf" ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-600">
                <FaSpinner className="animate-spin text-xl" />
                <span>Cargando requisiciones...</span>
              </div>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay requisiciones</h3>
              <p className="text-gray-600">No se encontraron requisiciones que coincidan con los filtros aplicados.</p>
            </div>
          ) : (
            paginatedData.map((r, idx) => {
              const isExpanded = expandedRows.has(r.id)
              const isAnimating = animatingRows.has(r.id)
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
                  style={{
                    animationName: "slideInUp",
                    animationDuration: "500ms",
                    animationTimingFunction: "ease-out",
                    animationFillMode: "forwards",
                    animationDelay: `${idx * 90}ms`,
                    opacity: 0,
                  }}
                >
                  {/* main row */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      window.location.href = `requisiciones/${r.id}`
                    }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* left info */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 font-bold">#{r.id}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{r.folio}</p>
                            <p className="text-sm text-gray-600">{r.proyecto}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FaUser className="text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{r.empleado}</p>
                            <p className="text-sm text-gray-600">{r.origen}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FaCalendarAlt className="text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(r.fechaSolicitud).toLocaleDateString("es-MX")}
                            </p>
                            <p className="text-sm text-gray-600">Fecha solicitud</p>
                          </div>
                        </div>
                      </div>

                      {/* right info */}
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(r.estado?.nombre)}`}
                        >
                          {r.estado?.nombre}
                        </span>

                        {r.archivoExcelNombre && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              descargarArchivoExcel(r.id)
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Descargar Excel"
                          >
                            <FaDownload className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(r.id)
                          }}
                          className={`p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 ${isAnimating ? "animate-pulse" : ""
                            }`}
                          title={isExpanded ? "Contraer" : "Expandir"}
                        >
                          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      </div>
                    </div>

                    {/* preview materials */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {r.materiales.slice(0, 3).map((m, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                          <div className={`w-2 h-2 rounded-full ${getUrgencyDot(m.urgencia?.descripcion)}`} />
                          <span className="text-sm text-gray-700">
                            {m.material} ({m.cantidad} {m.unidadMedida})
                          </span>
                        </div>
                      ))}
                      {r.materiales.length > 3 && (
                        <div className="bg-blue-50 text-blue-700 rounded-lg px-3 py-1.5 text-sm font-medium">
                          +{r.materiales.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>

                  {/* expanded */}
                  <div
                    className={`transition-all duration-300 ease-in-out border-t border-gray-200 ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                  >
                    <div className="bg-gray-50 p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Detalle de Materiales</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {r.materiales.map((m, i) => (
                          <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-3 h-3 rounded-full mt-1.5 ${getUrgencyDot(m.urgencia?.descripcion)}`}
                              />
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 mb-1">{m.material}</h5>
                                <p className="text-sm text-gray-600 mb-2">{m.descripcion}</p>
                                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                  <span>
                                    Cantidad: {m.cantidad} {m.unidadMedida}
                                  </span>
                                  <span>Llegada: {formatFecha(m.fechaLlegada)}</span>
                                  <span>Urgencia: {m.urgencia?.descripcion || "Sin definir"}</span>
                                </div>
                                {m.observacion && (
                                  <p className="text-xs text-gray-600 mt-2 italic">Obs: {m.observacion}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {r.observaciones && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <h5 className="font-medium text-yellow-800 mb-2">Observaciones Generales</h5>
                          <p className="text-sm text-yellow-700">{r.observaciones}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-700">
                Mostrando {total === 0 ? 0 : startIndex + 1} a {Math.min(startIndex + itemsPerPage, total)} de {total}{" "}
                requisiciones
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + Math.max(1, currentPage - 2)
                    if (pageNumber > totalPages) return null
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${currentPage === pageNumber
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-100"
                          }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronRight className="w-4 h-4" />
                </button>

                <div className="ml-3 flex items-center gap-2">
                  <span className="text-sm text-gray-700">Mostrar</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {isModalNuevaOpen && (
          <ModalRequisicion
            onClose={() => setIsModalNuevaOpen(false)}
            setNotifications={setNotifications}
            actualizarListaRequisiciones={fetchRequisiciones}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
