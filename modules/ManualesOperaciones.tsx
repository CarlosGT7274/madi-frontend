"use client";
import { useState } from "react";
import {
  FaSearch,
  FaDownload,
  FaEye,
  FaPlus,
  FaFileAlt,
  FaTimes,
  FaFilePdf,
} from "react-icons/fa";

interface Manual {
  id: number;
  nombre: string;
  categoria: string;
  fecha: string;
  url: string;
  descripcion?: string;
}

const manualesData: Manual[] = [
  {
    id: 1,
    nombre: "Procedimientos de Seguridad",
    categoria: "Seguridad",
    fecha: "2025-03-10",
    url: "/manuales/seguridad.pdf",
    descripcion: "Manual completo de procedimientos de seguridad industrial",
  },
  {
    id: 2,
    nombre: "Mantenimiento de Equipos",
    categoria: "Mantenimiento",
    fecha: "2025-02-02",
    url: "/manuales/mantenimiento.pdf",
    descripcion: "Guía de mantenimiento preventivo y correctivo",
  },
  {
    id: 3,
    nombre: "Normas ISO 9001",
    categoria: "Calidad",
    fecha: "2025-01-15",
    url: "/manuales/iso9001.pdf",
    descripcion: "Estándares de calidad ISO 9001:2015",
  },
  {
    id: 4,
    nombre: "Protocolo de Emergencias",
    categoria: "Seguridad",
    fecha: "2025-02-28",
    url: "/manuales/emergencias.pdf",
    descripcion: "Plan de respuesta ante emergencias",
  },
];

const categorias = ["Todas", "Seguridad", "Mantenimiento", "Calidad"];

export default function ManualesOperaciones() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null);

  const getCategoryColor = (categoria: string): string => {
    const colors: Record<string, string> = {
      Seguridad: "bg-red-100 text-red-800",
      Mantenimiento: "bg-blue-100 text-blue-800",
      Calidad: "bg-green-100 text-green-800",
    };
    return colors[categoria] || "bg-gray-100 text-gray-800";
  };

  const filteredManuales = manualesData.filter((manual) => {
    const matchesSearch = manual.nombre
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todas" || manual.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openPreview = (manual: Manual) => {
    setSelectedManual(manual);
    setPreviewUrl(manual.url);
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setSelectedManual(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl">
                <FaFileAlt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Manuales de Operaciones
                </h1>
                <p className="text-gray-600 text-sm">
                  Gestiona y consulta la documentación técnica
                </p>
              </div>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm">
              <FaPlus className="w-4 h-4" />
              Subir Manual
            </button>
          </div>
        </div>

        {/* Búsqueda y filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar manuales..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Categorías */}
          <div className="flex flex-wrap gap-2">
            {categorias.map((categoria) => (
              <button
                key={categoria}
                onClick={() => setSelectedCategory(categoria)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === categoria
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {categoria}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Manuales Disponibles ({filteredManuales.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            {filteredManuales.length === 0 ? (
              <div className="text-center py-12">
                <FaFileAlt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {search
                    ? "No se encontraron manuales"
                    : "No hay manuales disponibles"}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Documento
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Categoría
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Fecha
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredManuales.map((manual) => (
                    <tr
                      key={manual.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <FaFilePdf className="text-red-500 text-xl" />
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {manual.nombre}
                            </h4>
                            {manual.descripcion && (
                              <p className="text-sm text-gray-600 max-w-xs truncate">
                                {manual.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                            manual.categoria
                          )}`}
                        >
                          {manual.categoria}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {new Date(manual.fecha).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openPreview(manual)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Vista previa"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <a
                            href={manual.url}
                            download
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Descargar"
                          >
                            <FaDownload className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modal de vista previa */}
        {previewUrl && selectedManual && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaFilePdf className="text-red-500 text-2xl" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedManual.nombre}
                      </h3>
                      {selectedManual.descripcion && (
                        <p className="text-gray-600 text-sm">
                          {selectedManual.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={closePreview}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 h-96">
                <iframe
                  src={previewUrl}
                  className="w-full h-full border border-gray-200 rounded-lg"
                  title={`Vista previa de ${selectedManual.nombre}`}
                />
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={closePreview}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cerrar
                  </button>
                  <a
                    href={selectedManual.url}
                    download
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FaDownload className="w-4 h-4" />
                    Descargar
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
