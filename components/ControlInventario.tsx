"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaFileExcel,
  FaFilePdf,
  FaChartBar,
  FaFilter,
  FaUpload,
  FaPlus,
  FaTimes,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { get, post } from "../utils/http";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import {
  registrarEventoBitacora,
  deleteItemInventario,
  obtenerInventario,
  actualizarCantidadDisponible,
  verificarRequisicionesDesdeInventario,
} from "../utils/api/inventario";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InventarioItem {
  id?: number;
  codigoSKU: string;
  material: string;
  categoria: string;
  estado: string;
  cantidadDisponible: string | number;
  unidadMedida: string;
  codigoBarras?: string;
  marca?: string;
  modelo?: string;
  numFactura?: string;
  areaGuardado?: string;
  stockMinimo?: string | number;
  stockMaximo?: string | number;
  fechaIngreso?: string;
  fechaVencimiento?: string;
  destino?: string;
  costoUnitario?: string;
  costoTotal?: string;
  moneda?: string;
  tipoMovimiento?: string;
  tipo?: string;
  observaciones?: string;
  usuarioRegistro?: string;
  usuarioModificacion?: string;
  error?: string;
}

type InventoryKey = keyof InventarioItem;

interface ControlInventarioProps {
  /** seguimos usando este filtro si arriba quieres buscar, pero aquí no mostramos input */
  search: string;
}

const excelDateToJSDate = (serial: number): string => {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().split("T")[0];
};

/* helpers visuales */
const getStatusColor = (estado?: string) => {
  const e = (estado || "").toLowerCase();
  if (e.includes("buen") || e.includes("disponible"))
    return "bg-green-100 text-green-800";
  if (e.includes("uso") || e.includes("usado"))
    return "bg-yellow-100 text-yellow-800";
  if (e.includes("baja") || e.includes("dañado"))
    return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
};

const getStockBadge = (cantidad: number, min: number, max: number) => {
  if (cantidad <= min) return "bg-red-100 text-red-800";
  if (cantidad >= max) return "bg-green-100 text-green-800";
  return "bg-yellow-100 text-yellow-800";
};

const normalizeString = (str: string): string =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

export default function ControlInventario({ search }: ControlInventarioProps) {
  // estado de datos
  const [originalData, setOriginalData] = useState<InventarioItem[]>([]);
  const [inventoryData, setInventoryData] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ordenado
  const [sortColumn, setSortColumn] = useState<InventoryKey | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // selección y acciones
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [animatingRows] = useState<Set<number>>(new Set());

  // export/upload/modales
  const [isExporting, setIsExporting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState<number | null>(null);

  // agregar/editar
  const [mostrarModalManual, setMostrarModalManual] = useState(false);
  const [nuevoRegistro, setNuevoRegistro] = useState<Partial<InventarioItem>>(
    {}
  );
  const [itemEdit, setItemEdit] = useState<InventarioItem | null>(null);
  const [cantidadEdit, setCantidadEdit] = useState<number>(0);

  // upload excel
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("Seleccionar archivo");
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // paginación
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // columnas de edición manual
  const campos: (keyof InventarioItem)[] = [
    "codigoSKU",
    "codigoBarras",
    "material",
    "categoria",
    "marca",
    "modelo",
    "numFactura",
    "areaGuardado",
    "cantidadDisponible",
    "unidadMedida",
    "stockMinimo",
    "stockMaximo",
    "estado",
    "fechaIngreso",
    "destino",
    "costoUnitario",
    "costoTotal",
    "moneda",
    "tipoMovimiento",
    "observaciones",
  ];

  /* ===== Carga inicial ===== */
  useEffect(() => {
    (async () => {
      try {
        const data = await get("inventario");
        setInventoryData(data);
        setOriginalData(data);
      } catch (e) {
        console.error("Error al cargar inventario:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ===== Ordenado y filtro (por prop search) ===== */
  const handleSort = (column: InventoryKey) => {
    const isSame = sortColumn === column;
    const dir: "asc" | "desc" =
      isSame && sortDirection === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortDirection(dir);
  };

  const filteredAndSortedData = useMemo(() => {
    const normalizedSearch = normalizeString(search || "");
    const base = [...originalData];

    // ordenar
    if (sortColumn) {
      const key = sortColumn;
      base.sort((a, b) => {
        const va = a[key];
        const vb = b[key];

        const na =
          typeof va === "number"
            ? va
            : Number(va === undefined || va === null ? NaN : String(va));
        const nb =
          typeof vb === "number"
            ? vb
            : Number(vb === undefined || vb === null ? NaN : String(vb));

        if (!Number.isNaN(na) && !Number.isNaN(nb)) {
          return sortDirection === "asc" ? na - nb : nb - na;
        }
        const sa = va === undefined || va === null ? "" : String(va);
        const sb = vb === undefined || vb === null ? "" : String(vb);
        return sortDirection === "asc"
          ? sa.localeCompare(sb)
          : sb.localeCompare(sa);
      });
    }

    // filtrar por prop search (no mostramos input aquí)
    if (!normalizedSearch) return base;
    return base.filter((item) =>
      Object.values(item).some((v) =>
        normalizeString(String(v ?? "")).includes(normalizedSearch)
      )
    );
  }, [originalData, sortColumn, sortDirection, search]);

  // paginación
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedData.length / itemsPerPage)
  );
  const start = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(
    start,
    start + itemsPerPage
  );

  useEffect(() => {
    // si cambian filtros/orden, vuelve a la primera página
    setCurrentPage(1);
  }, [search, sortColumn, sortDirection, itemsPerPage]);

  /* ===== Selección ===== */
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedData.map((i) => i.id!).filter(Boolean));
    } else {
      setSelectedIds([]);
    }
  };
  const handleSelectItem = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ===== Export ===== */
  const handleExport = async (type: "excel" | "pdf") => {
    try {
      setIsExporting(true);
      if (type === "excel") exportarAExcel();
      else exportarAPDF();
    } finally {
      setIsExporting(false);
    }
  };

  const exportarAExcel = () => {
    if (inventoryData.length === 0) return alert("No hay datos para exportar.");
    const dataLimpia = inventoryData.map((item) => ({
      ID: item.id ?? "-",
      SKU: item.codigoSKU,
      Barras: item.codigoBarras ?? "-",
      Material: item.material,
      Categoría: item.categoria,
      Marca: item.marca ?? "-",
      Modelo: item.modelo ?? "-",
      Factura: item.numFactura ?? "-",
      Guardado: item.areaGuardado ?? "-",
      Cantidad: item.cantidadDisponible,
      Unidad: item.unidadMedida,
      MinStock: item.stockMinimo ?? "-",
      MaxStock: item.stockMaximo ?? "-",
      Estado: item.estado ?? "-",
      Ingreso: item.fechaIngreso ?? "-",
      Destino: item.destino ?? "-",
      CostoUnitario: item.costoUnitario ?? "-",
      CostoTotal: item.costoTotal ?? "-",
      Moneda: item.moneda ?? "-",
      Movimiento: item.tipoMovimiento ?? "-",
      Observaciones: item.observaciones ?? "-",
    }));
    const ws = XLSX.utils.json_to_sheet(dataLimpia);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Inventario_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportarAPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const img = new Image();
    img.src = "/Logo.png";
    img.onload = () => {
      const fecha = new Date().toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const headers = [
        "ID",
        "Código SKU",
        "Código Barras",
        "Material",
        "Categoría",
        "Marca",
        "Modelo",
        "Num. Factura",
        "Área Guardado",
        "Cantidad",
        "Unidad",
        "Stock Mínimo",
        "Stock Máximo",
        "Estado",
        "Fecha Ingreso",
        "Destino",
        "Costo Unitario",
        "Costo Total",
        "Moneda",
        "Tipo Movimiento",
        "Observaciones",
      ];
      const rows = inventoryData.map((item) => [
        item.id ?? "-",
        item.codigoSKU,
        item.codigoBarras ?? "-",
        item.material,
        item.categoria,
        item.marca ?? "-",
        item.modelo ?? "-",
        item.numFactura ?? "-",
        item.areaGuardado ?? "-",
        item.cantidadDisponible,
        item.unidadMedida,
        item.stockMinimo ?? "-",
        item.stockMaximo ?? "-",
        item.estado ?? "-",
        item.fechaIngreso ?? "-",
        item.destino ?? "-",
        item.costoUnitario ?? "-",
        item.costoTotal ?? "-",
        item.moneda ?? "-",
        item.tipoMovimiento ?? "-",
        item.observaciones ?? "-",
      ]);
      autoTable(doc, {
        startY: 40,
        head: [headers],
        body: rows,
        theme: "striped",
        styles: {
          fontSize: 6,
          cellPadding: 1.2,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: {
          fillColor: [148, 12, 37],
          halign: "center",
          fontSize: 7,
          textColor: [255, 255, 255],
        },
        margin: { top: 40, bottom: 20 },
        didDrawPage: () => {
          doc.addImage(img, "PNG", 10, 10, 25, 25);
          doc.setFontSize(16);
          doc.text(
            "Control de Inventario",
            doc.internal.pageSize.getWidth() / 2,
            20,
            { align: "center" }
          );
          doc.setFontSize(10);
          doc.text(
            `Fecha de descarga: ${fecha}`,
            doc.internal.pageSize.getWidth() / 2,
            28,
            { align: "center" }
          );
          doc.setFontSize(8);
          doc.text(
            `Página ${doc.getNumberOfPages()}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
          );
        },
      });
      doc.save(
        `Control_Inventario_${new Date().toISOString().slice(0, 10)}.pdf`
      );
    };
  };

  /* ===== Subida Excel ===== */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    if (
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel"
    ) {
      setSelectedFile(file);
      setFileName(file.name);
    } else {
      alert("Solo se permiten archivos de Excel (.xls, .xlsx)");
      setSelectedFile(null);
      setFileName("Seleccionar archivo");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Selecciona un archivo");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json<
        Record<string, string | number | boolean | null>
      >(sheet, { defval: "" });

      const fieldMap: Record<string, keyof InventarioItem> = {
        "codigo sku": "codigoSKU",
        material: "material",
        categoria: "categoria",
        estado: "estado",
        "cantidad disponible": "cantidadDisponible",
        "unidad medida": "unidadMedida",
        "codigo barras": "codigoBarras",
        marca: "marca",
        modelo: "modelo",
        "num factura": "numFactura",
        numfactura: "numFactura",
        "area de guardado": "areaGuardado",
        "stock minimo": "stockMinimo",
        "stock maximo": "stockMaximo",
        "fecha ingreso": "fechaIngreso",
        destino: "destino",
        "costo unitario": "costoUnitario",
        "costo total": "costoTotal",
        moneda: "moneda",
        "tipo movimiento": "tipoMovimiento",
        tipo: "tipo",
        observaciones: "observaciones",
      };

      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

      const normalizedData: Partial<InventarioItem>[] = rawData.map((row) => {
        const nuevo: Partial<InventarioItem> = {};
        Object.entries(row).forEach(([key, value]) => {
          const cleanedKey = key
            .toLowerCase()
            .trim()
            .replace(/^'/, "")
            .replace(/\./g, "")
            .replace(/\t/g, "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          const mapped = fieldMap[cleanedKey as keyof typeof fieldMap];
          if (!mapped) return;

          let valor: string | number = "";
          if (
            (mapped === "fechaIngreso" || mapped === "fechaVencimiento") &&
            typeof value === "number"
          ) {
            valor = excelDateToJSDate(value);
          } else if (value !== null && value !== undefined) {
            valor = value.toString().replace(/\t/g, "").trim();
          }

          (nuevo as Record<InventoryKey, unknown>)[mapped] = valor;
        });
        return { ...nuevo, usuarioRegistro: usuario.nombre };
      });

      const required: (keyof InventarioItem)[] = [
        "codigoSKU",
        "material",
        "categoria",
        "estado",
        "cantidadDisponible",
        "unidadMedida",
      ];
      const errors = normalizedData
        .map((item, i) => {
          const missing = required.filter((f) => {
            const val = (item as Partial<InventarioItem>)[f];
            return (
              val === undefined ||
              val === null ||
              (typeof val === "string" && val.trim() === "")
            );
          });
          return missing.length
            ? `Fila ${i + 2}: faltan ${missing.join(", ")}`
            : null;
        })
        .filter(Boolean) as string[];
      if (errors.length) {
        setErrorMessages(errors);
        return;
      }

      try {
        const resp = await post("inventario/cargar-excel", normalizedData);
        await registrarEventoBitacora({
          usuario: usuario.correo,
          accion: "Carga de Excel",
          descripcion: `Archivo "${fileName}" con ${normalizedData.length} registros. Insertados: ${resp.insertados}, Actualizados: ${resp.actualizados}`,
          modulo: "Inventario",
        });

        if (resp.insertados > 0 || resp.actualizados > 0) {
          toast.success(
            `✅ Inventario actualizado. Insertados: ${resp.insertados}, Actualizados: ${resp.actualizados}`
          );
          // verificar requisiciones por material
          await Promise.all(
            normalizedData.map(async (item) => {
              if (item.material && item.cantidadDisponible) {
                try {
                  await verificarRequisicionesDesdeInventario(
                    encodeURIComponent(item.material),
                    parseInt(String(item.cantidadDisponible), 10)
                  );
                } catch {}
              }
            })
          );
        } else {
          toast.info("📄 No se detectaron cambios en el inventario.");
        }

        const dataRef = await get("inventario");
        setInventoryData(dataRef);
        setOriginalData(dataRef);
        setShowUploadModal(false);
        setSelectedFile(null);
        setFileName("Seleccionar archivo");
        setErrorMessages([]);
      } catch (err) {
        console.error("Error al subir:", err);
        alert("Error al procesar el archivo");
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  /* ===== Eliminar / Editar ===== */
  const handleDelete = (id: number) => {
    setItemAEliminar(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemAEliminar) return;
    try {
      await deleteItemInventario(itemAEliminar);
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      await registrarEventoBitacora({
        usuario: usuario.correo,
        accion: "Eliminación",
        descripcion: `Eliminó el registro del inventario con ID ${itemAEliminar}`,
        modulo: "Inventario",
      });
      toast.success("🗑️ Registro eliminado");
      const data = await obtenerInventario();
      setInventoryData(data);
      setOriginalData(data);
      setSelectedIds((prev) => prev.filter((x) => x !== itemAEliminar));
    } catch {
      toast.error("No se pudo eliminar el registro.");
    } finally {
      setShowDeleteModal(false);
      setItemAEliminar(null);
    }
  };

  const handleEdit = (item: InventarioItem) => {
    setCantidadEdit(Number(item.cantidadDisponible || 0));
    setItemEdit(item);
  };

  const handleSaveEdit = async () => {
    try {
      if (itemEdit?.id === undefined) return;
      await actualizarCantidadDisponible(itemEdit.id, cantidadEdit);
      await verificarRequisicionesDesdeInventario(
        encodeURIComponent(itemEdit.material),
        cantidadEdit
      );
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      await registrarEventoBitacora({
        usuario: usuario.correo,
        accion: "Edición de cantidad",
        descripcion: `Actualizó "${itemEdit.material}" a ${cantidadEdit}`,
        modulo: "Inventario",
      });
      toast.success("✅ Cantidad actualizada");
      const data = await obtenerInventario();
      setInventoryData(data);
      setOriginalData(data);
      setItemEdit(null);
    } catch {
      toast.error("❌ Ocurrió un error al actualizar la cantidad");
    }
  };

  /* ===== Render ===== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Control de Inventario
          </h1>
          <p className="text-gray-600">
            Gestiona tu inventario de manera eficiente
          </p>
        </div>

        {/* Action Bar (sin buscador aquí) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1" />
            {/* espacio para que se vea igual que el diseño */}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExport("excel")}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                {isExporting ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaFileExcel />
                )}
                Excel
              </button>

              <button
                onClick={() => handleExport("pdf")}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                {isExporting ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaFilePdf />
                )}
                PDF
              </button>

              <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105">
                <FaChartBar />
                Gráficos
              </button>

              <button
                onClick={() => setMostrarModalManual(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 transform hover:scale-105"
              >
                <FaPlus />
                Agregar
              </button>

              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                <FaUpload />
                Subir
              </button>

              {selectedIds.length > 0 && (
                <button
                  onClick={() =>
                    toast.info(
                      "Usa el botón rojo al final para confirmar eliminación múltiple"
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 animate-pulse"
                >
                  <FaTrash />
                  Eliminar ({selectedIds.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Items",
              value: inventoryData.length,
              icon: "📦",
            },
            {
              label: "Buen Estado",
              value: inventoryData.filter((i) => {
                const e = (i.estado || "").toLowerCase();
                return e.includes("buen") || e.includes("disponible");
              }).length,
              icon: "✅",
            },
            {
              label: "Stock Bajo",
              value: inventoryData.filter((i) => {
                const cant = Number(i.cantidadDisponible || 0);
                const min = Number(i.stockMinimo || 0);
                return cant <= min;
              }).length,
              icon: "⚠️",
            },
            {
              label: "Mal estado",
              value: inventoryData.filter((i) =>
                (i.estado || "").toLowerCase().includes("uso")
              ).length,
              icon: "🔧",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transform hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-600">
                <FaSpinner className="animate-spin text-xl" />
                <span>Cargando inventario...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedIds.length === paginatedData.length &&
                            paginatedData.length > 0
                          }
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </th>
                      {[
                        { key: "codigoSKU", label: "SKU" },
                        { key: "material", label: "Material" },
                        { key: "categoria", label: "Categoría" },
                        { key: "cantidadDisponible", label: "Cantidad" },
                        { key: "unidadMedida", label: "Unidad" },
                        { key: "estado", label: "Estado" },
                        { key: "marca", label: "Marca" },
                        { key: "fechaIngreso", label: "Fecha Ingreso" },
                      ].map((col) => (
                        <th
                          key={col.key}
                          className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort(col.key as InventoryKey)}
                        >
                          <div className="flex items-center gap-2">
                            {col.label}
                            <FaFilter className="w-3 h-3 opacity-50" />
                            {sortColumn === col.key && (
                              <span className="text-blue-600">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((item, index) => {
                      const cantidad = Number(item.cantidadDisponible || 0);
                      const min = Number(item.stockMinimo || 0);
                      const max = Number(item.stockMaximo || 100);
                      return (
                        <tr
                          key={item.id ?? `row-${index}`}
                          className={`hover:bg-gray-50 transition-all duration-200 ${
                            animatingRows.has(item.id!)
                              ? "animate-pulse bg-red-50"
                              : ""
                          } ${
                            selectedIds.includes(item.id!) ? "bg-blue-50" : ""
                          }`}
                          style={{
                            animationName: "fadeIn",
                            animationDuration: "0.5s",
                            animationTimingFunction: "ease-in-out",
                            animationFillMode: "forwards",
                            animationDelay: `${index * 50}ms`,
                          }}
                        >
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item.id!)}
                              onChange={() => handleSelectItem(item.id!)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {item.codigoSKU}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-medium text-gray-900">
                            {item.material}
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {item.categoria}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStockBadge(
                                cantidad,
                                min,
                                max
                              )}`}
                            >
                              {cantidad}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {item.unidadMedida}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                item.estado
                              )}`}
                            >
                              {item.estado}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {item.marca}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {item.fechaIngreso}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                                title="Editar"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id!)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200"
                                title="Eliminar"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedData.length === 0 && (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-4 py-8 text-center text-gray-500 italic"
                        >
                          No se encontraron resultados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Mostrar</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-700">
                      de {filteredAndSortedData.length} registros
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FaChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const pageNumber = i + Math.max(1, currentPage - 2);
                          if (pageNumber > totalPages) return null;
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                currentPage === pageNumber
                                  ? "bg-blue-600 text-white"
                                  : "border border-gray-300 hover:bg-gray-100"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FaChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 transform animate-modal-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Subir Archivo Excel
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  {selectedFile
                    ? fileName
                    : "Arrastra y suelta tu archivo aquí"}
                </p>
                <p className="text-xs text-gray-500">
                  o haz clic para seleccionar
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {errorMessages.length > 0 && (
                <div className="mt-4 text-left text-red-600 text-sm">
                  <p className="font-semibold">Errores detectados:</p>
                  <ul className="list-disc ml-5">
                    {errorMessages.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Subir Archivo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-transparent supports-[backdrop-filter]:backdrop-blur-sm">
            <div className="w-full max-w-md mx-4 rounded-2xl border border-gray-200/60 bg-white/90 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,.45)] animate-modal-in">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <FaTrash className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Confirmar eliminación
                    </h3>
                    <p className="text-sm text-gray-600">
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="text-gray-400 hover:text-gray-600 rounded-lg p-2"
                    aria-label="Cerrar"
                  >
                    ✖
                  </button>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {itemEdit && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-transparent supports-[backdrop-filter]:backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-4 rounded-2xl border border-gray-200/60 bg-white/90 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,.45)] animate-modal-in">
              <button
                onClick={() => setItemEdit(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 rounded-lg p-2"
                aria-label="Cerrar"
              >
                ✖
              </button>

              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <span className="text-blue-600 text-lg">✏️</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Editar cantidad disponible
                  </h2>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min={0}
                  value={cantidadEdit}
                  onChange={(e) => setCantidadEdit(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setItemEdit(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-4 py-2.5 rounded-lg bg-[#940C25] text-white hover:bg-[#7a0a1e]"
                    onClick={handleSaveEdit}
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal agregar manual */}
        {mostrarModalManual && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-[700px] max-h-[90vh] overflow-y-auto relative animate-modal-in">
              <button
                onClick={() => setMostrarModalManual(false)}
                className="absolute top-3 right-3 text-gray-400 hover:bg-gray-200 rounded-lg p-2"
              >
                <FaTimes />
              </button>
              <h2 className="text-lg font-bold text-center mb-4">
                Nuevo Registro Manual
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {campos.map((campo) => {
                  const key = campo;
                  const currentVal = nuevoRegistro[key];
                  const valor =
                    (currentVal as string | number | undefined) ?? "";
                  const actualizar = (val: string | number) =>
                    setNuevoRegistro({ ...nuevoRegistro, [key]: val });

                  switch (key) {
                    case "fechaIngreso":
                      return (
                        <input
                          key={key}
                          type="date"
                          className="border p-2 rounded w-full"
                          value={valor as string}
                          onChange={(e) => actualizar(e.target.value)}
                        />
                      );
                    case "unidadMedida":
                      return (
                        <select
                          key={key}
                          className="border p-2 rounded w-full"
                          value={valor as string}
                          onChange={(e) => actualizar(e.target.value)}
                        >
                          <option value="">Selecciona unidad</option>
                          <option>Metro (m)</option>
                          <option>Kilómetro (km)</option>
                          <option>Metro cuadrado (m2)</option>
                          <option>Metro cúbico (m3)</option>
                          <option>Gramo (gr)</option>
                          <option>Kilogramo (kg)</option>
                          <option>Tonelada (t)</option>
                          <option>Pieza</option>
                          <option>Unidad</option>
                          <option>Servicio</option>
                          <option>Rollo</option>
                          <option>Paquete</option>
                          <option>Caja</option>
                          <option>Pliego</option>
                          <option>Cubeta</option>
                          <option>Litro (Lt)</option>
                          <option>Galón (gl)</option>
                        </select>
                      );
                    case "moneda":
                      return (
                        <select
                          key={key}
                          className="border p-2 rounded w-full"
                          value={valor as string}
                          onChange={(e) => actualizar(e.target.value)}
                        >
                          <option value="">Selecciona moneda</option>
                          <option value="MXN">MXN</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      );
                    case "cantidadDisponible":
                    case "stockMinimo":
                    case "stockMaximo":
                      return (
                        <input
                          key={key}
                          type="number"
                          min={0}
                          className="border p-2 rounded w-full"
                          placeholder={String(key)
                            .replace(/([A-Z])/g, " $1")
                            .toUpperCase()}
                          value={valor as number}
                          onChange={(e) => actualizar(Number(e.target.value))}
                        />
                      );
                    case "costoUnitario":
                    case "costoTotal":
                      return (
                        <input
                          key={key}
                          type="text"
                          inputMode="decimal"
                          className="border p-2 rounded w-full text-right"
                          placeholder="$ 0.00"
                          value={valor === "" ? "" : valor.toString()}
                          onChange={(e) => {
                            const soloNumeros = e.target.value.replace(
                              /[^0-9.]/g,
                              ""
                            );
                            actualizar(soloNumeros);
                          }}
                          onBlur={(e) => {
                            const numero = parseFloat(e.target.value);
                            if (!isNaN(numero)) actualizar(numero.toFixed(2));
                          }}
                          onFocus={() => {
                            const numero = parseFloat(valor as string);
                            if (!isNaN(numero)) actualizar(numero.toString());
                          }}
                        />
                      );
                    default:
                      return (
                        <input
                          key={key}
                          type="text"
                          placeholder={String(key)
                            .replace(/([A-Z])/g, " $1")
                            .toUpperCase()}
                          className="border p-2 rounded w-full"
                          value={valor as string}
                          onChange={(e) => actualizar(e.target.value)}
                        />
                      );
                  }
                })}
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  onClick={async () => {
                    try {
                      const usuario = JSON.parse(
                        localStorage.getItem("usuario") || "{}"
                      );
                      await post("inventario/cargar-excel", [
                        { ...nuevoRegistro, usuarioRegistro: usuario.nombre },
                      ]);
                      toast.success("✅ Registro guardado correctamente");
                      const data = await get("inventario");
                      setInventoryData(data);
                      setOriginalData(data);
                      setMostrarModalManual(false);
                      setNuevoRegistro({});
                    } catch {
                      toast.error("Error al agregar registro");
                    }
                  }}
                >
                  Guardar
                </button>
                <button
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                  onClick={() => setMostrarModalManual(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-in {
          animation: modal-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
