"use client";

import { useState, useEffect } from "react";
import {
  FaSearch,
  FaSave,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTools,
  FaFileExcel,
  FaSync,
  FaExclamationCircle,
} from "react-icons/fa";
import { format } from "date-fns";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { obtenerInventario } from "../utils/api/inventario";
import { usersAll } from "@/utils/api/users";
import {
  actualizarAsignacion,
  borrarAsignacion,
  crearAsignacionHerr,
  getAllAsignacion,
} from "../utils/api/asignacionHerramientas";
import { obtenerRequisiciones } from "@/utils/api/requisicion";

// Interfaces
interface FormData {
  empleadoId: string;
  inventarioId: string;
  requisicionId: string;
  requisicionMaterialId: string;
  cantidad: string;
  condicionId: string;
  estadoAsignacionId: string;
  descripcion?: string;
  ubicacion: string;
  observaciones?: string;
  fechaEntrega: string;
  fechaDevolucion?: string;
  ultimaActualizacion: string;
}

interface FormField {
  name: keyof FormData;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  readOnly?: boolean;
  showOnEdit?: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function HerramientasOperacion() {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [assignedTools, setAssignedTools] = useState<any[]>([]);
  const [inventario, setInventario] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requisiciones, setRequisiciones] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  const initialForm: FormData = {
    empleadoId: "",
    inventarioId: "",
    requisicionId: "",
    requisicionMaterialId: "",
    cantidad: "1",
    condicionId: "",
    estadoAsignacionId: "",
    descripcion: "",
    ubicacion: "",
    observaciones: "",
    fechaEntrega: format(new Date(), "yyyy-MM-dd"),
    fechaDevolucion: "",
    ultimaActualizacion: format(new Date(), "yyyy-MM-dd"),
  };

  const [form, setForm] = useState<FormData>(initialForm);

  // Función para validar formulario
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Validar campos requeridos
    if (!form.empleadoId) errors.empleadoId = "Seleccione un empleado";
    if (!form.inventarioId) errors.inventarioId = "Seleccione una herramienta";
    if (!form.requisicionId)
      errors.requisicionId = "Seleccione una requisición";
    // if (!form.cantidad || Number.parseInt(form.cantidad) <= 0)
    //   errors.cantidad = "Ingrese una cantidad válida";
    if (!form.condicionId) errors.condicionId = "Seleccione una condición";
    if (!form.estadoAsignacionId)
      errors.estadoAsignacionId = "Seleccione un estado";
    if (!form.ubicacion.trim()) errors.ubicacion = "Ingrese una ubicación";
    if (!form.fechaEntrega)
      errors.fechaEntrega = "Ingrese una fecha de entrega";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Función para cargar datos desde la API
  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [empleadosData, inventarioData, asignaciones, requisicionesData] =
        await Promise.all([
          usersAll(),
          obtenerInventario(),
          getAllAsignacion(),
          obtenerRequisiciones(),
        ]);
      setRequisiciones(requisicionesData);
      setEmpleados(empleadosData);
      setInventario(inventarioData);
      setAssignedTools(asignaciones);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar los datos. Por favor, intente nuevamente.");
    } finally {
      setRefreshing(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchData();
  }, []);

  // Configuración de campos del formulario
  const formFields: FormField[] = [
    {
      name: "requisicionId",
      label: "Requisicion (folio)",
      type: "select",
      required: true,
      options: requisiciones.map((req) => ({
        value: req.id.toString(),
        label: req.proyecto,
      })),
    },
    {
      name: "empleadoId",
      label: "Empleado",
      type: "select",
      required: true,
      options: empleados.map((emp) => ({
        value: emp.id.toString(),
        label: emp.nombre,
      })),
    },
    {
      name: "inventarioId",
      label: "Herramienta",
      type: "select",
      required: true,
      options: inventario.map((item) => ({
        value: item.id.toString(),
        label: item.material,
      })),
    },
    {
      name: "cantidad",
      label: "Cantidad",
      type: "number",
      required: true,
      placeholder: "1",
    },
    {
      name: "condicionId",
      label: "Condición",
      type: "select",
      required: true,
      options: [
        { value: "1", label: "Excelente" },
        { value: "2", label: "Buena" },
        { value: "3", label: "Regular" },
        { value: "4", label: "Mala" },
      ],
    },
    {
      name: "estadoAsignacionId",
      label: "Estado de Asignación",
      type: "select",
      required: true,
      options: [
        { value: "1", label: "Asignada" },
        { value: "2", label: "En Uso" },
        { value: "3", label: "Devuelta" },
        { value: "4", label: "Perdida" },
      ],
    },
    {
      name: "ubicacion",
      label: "Ubicación (Municipio)",
      type: "text",
      required: true,
      placeholder: "Ingrese la ubicación",
    },
    {
      name: "descripcion",
      label: "Descripción",
      type: "textarea",
      placeholder: "Descripción adicional",
    },
    {
      name: "observaciones",
      label: "Observaciones",
      type: "textarea",
      placeholder: "Observaciones sobre la asignación",
    },
    {
      name: "fechaEntrega",
      label: "Fecha de Entrega",
      type: "date",
      required: true,
      readOnly: false,
    },
    {
      name: "fechaDevolucion",
      label: "Fecha de Devolución",
      type: "date",
      showOnEdit: true,
      readOnly: false,
    },
    {
      name: "ultimaActualizacion",
      label: "Última Actualización",
      type: "date",
      readOnly: true,
      showOnEdit: true,
    },
  ];

  // Manejar cambios en el formulario
  const handleInputChange = (name: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "fechaEntrega" || name === "fechaDevolucion") {
      setForm((prev) => ({
        ...prev,
        [name]: value,
        ultimaActualizacion: format(new Date(), "yyyy-MM-dd"),
      }));
    }

    // Limpiar error de validación cuando el usuario empiece a escribir
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Renderizar campo del formulario con mensaje de error
  const renderFormField = (field: FormField) => {
    // Mostrar solo si no es un campo de edición o si estamos editando
    if (field.showOnEdit && editingId === null) return null;

    const value = form[field.name] || "";
    const error = validationErrors[field.name];
    const commonClasses = `w-full border rounded-xl px-4 py-3 transition-all duration-200 bg-white  hover:border-gray-300 border-gray-200 ${field.readOnly
        ? "w-full border rounded-xl px-4 py-3 bg-gray-50 text-gray-600 cursor-not-allowed border-gray-200"
        : "focus:outline-none focus:ring-2 focus:ring-[#940C25] focus:border-transparent"
      } ${error ? "border-red-500" : "border-gray-300"}`;

    return (
      <div key={field.name} className="mb-2">
        {field.type === "select" ? (
          <select
            className={commonClasses}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            disabled={field.readOnly}
            required={field.required}
          >
            <option value="">-- Selecciona {field.label} --</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === "textarea" ? (
          <textarea
            className={`${commonClasses} h-20 resize-none`}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            readOnly={field.readOnly}
            required={field.required}
          />
        ) : (
          <input
            type={field.type}
            className={commonClasses}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            readOnly={field.readOnly}
            required={field.required}
          />
        )}
        <label className="text-sm text-gray-600 mt-1 block">
          {field.label}{" "}
          {field.required && <span className="text-red-500">*</span>}
        </label>

        {error && (
          <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <FaExclamationCircle className="inline" />
            {error}
          </div>
        )}
      </div>
    );
  };

  // Asignar herramienta
  const handleAssign = async () => {
    if (!validateForm()) {
      toast.error(
        "Por favor, complete todos los campos requeridos correctamente.",
      );
      return;
    }

    setLoading(true);
    try {
      const formatDateForMySQL = (date: Date): string => {
        return date.toISOString().slice(0, 19).replace("T", " ");
      };
      const dataToSend = {
        empleadoId: Number.parseInt(form.empleadoId),
        inventarioId: Number.parseInt(form.inventarioId),
        requisicionId: form.requisicionId
          ? Number.parseInt(form.requisicionId)
          : 0,
        requisicionMaterialId: Number.parseInt(
          form.requisicionMaterialId || "131",
        ),
        cantidad: Number.parseInt(form.cantidad),
        condicionId: Number.parseInt(form.condicionId),
        estadoAsignacionId: Number.parseInt(form.estadoAsignacionId),
        descripcion: form.descripcion || undefined,
        ubicacion: form.ubicacion,
        observaciones: form.observaciones || undefined,
        fechaEntrega: formatDateForMySQL(new Date(form.fechaEntrega)),
        fechaDevolucion: form.fechaDevolucion
          ? formatDateForMySQL(new Date(form.fechaDevolucion))
          : null,
        ultimaActualizacion: formatDateForMySQL(new Date()),
      };

      await crearAsignacionHerr(dataToSend);

      // Recargar datos desde la API después de crear
      await fetchData();

      // Resetear formulario
      setForm({
        ...initialForm,
        ultimaActualizacion: format(new Date(), "yyyy-MM-dd"),
      });

      toast.success("Herramienta asignada correctamente");
    } catch (error) {
      console.error("Error al asignar herramienta:", error);
      toast.error(
        "Error al asignar herramienta. Por favor, intente nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatMySQLDate = (dateString: string | null): string => {
    if (!dateString) return "-";

    try {
      // Create date object without timezone issues by adding T00:00:00
      const date = new Date(dateString + "T00:00:00");
      return format(date, "dd/MM/yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return original string if formatting fails
    }
  };

  // Editar registro
  const handleEdit = (id: number) => {
    const toolToEdit = assignedTools.find((tool) => tool.id === id);
    if (toolToEdit) {
      setEditingId(id);

      const formatDateForInput = (dateString: string | null): string => {
        if (!dateString) return "";
        try {
          // Crear fecha directamente desde el string sin conversión de zona horaria
          const date = new Date(dateString + "T00:00:00");
          return format(date, "yyyy-MM-dd");
        } catch (error) {
          console.error("Error formatting date:", error);
          return "";
        }
      };

      setForm({
        ...toolToEdit,
        // Asegurar que los valores sean strings
        empleadoId: toolToEdit.empleadoId.toString(),
        inventarioId: toolToEdit.inventarioId.toString(),
        requisicionId: toolToEdit.requisicionId.toString(),
        condicionId: toolToEdit.condicionId.toString(),
        estadoAsignacionId: toolToEdit.estadoAsignacionId.toString(),
        cantidad: toolToEdit.cantidad.toString(),
        fechaEntrega: formatDateForInput(toolToEdit.fechaEntrega),
        fechaDevolucion: formatDateForInput(toolToEdit.fechaDevolucion),
        ultimaActualizacion: format(new Date(), "yyyy-MM-dd"),
      });
    }
  };

  // Guardar cambios
  const handleSaveEdit = async () => {
    if (!editingId) return;

    if (!validateForm()) {
      toast.error(
        "Por favor, complete todos los campos requeridos correctamente.",
      );
      return;
    }

    setLoading(true);
    try {
      const formatDateForMySQL = (date: Date): string => {
        return date.toISOString().slice(0, 19).replace("T", " ");
      };

      const dataToSend = {
        id: editingId,
        empleadoId: Number.parseInt(form.empleadoId),
        inventarioId: Number.parseInt(form.inventarioId),
        requisicionId: form.requisicionId
          ? Number.parseInt(form.requisicionId)
          : 0,
        requisicionMaterialId: Number.parseInt(
          form.requisicionMaterialId || "131",
        ),
        cantidad: Number.parseInt(form.cantidad),
        condicionId: Number.parseInt(form.condicionId),
        estadoAsignacionId: Number.parseInt(form.estadoAsignacionId),
        descripcion: form.descripcion || undefined,
        ubicacion: form.ubicacion,
        observaciones: form.observaciones || undefined,
        fechaEntrega: formatDateForMySQL(new Date(form.fechaEntrega)),
        fechaDevolucion: form.fechaDevolucion
          ? formatDateForMySQL(new Date(form.fechaDevolucion))
          : null,
        ultimaActualizacion: formatDateForMySQL(new Date()),
      };

      await actualizarAsignacion(dataToSend);

      // Recargar datos desde la API después de actualizar
      await fetchData();

      // Resetear estado de edición
      setEditingId(null);
      setForm({
        ...initialForm,
        ultimaActualizacion: format(new Date(), "yyyy-MM-dd"),
      });

      toast.success("Asignación actualizada correctamente");
    } catch (error) {
      console.error("Error al actualizar asignación:", error);
      toast.error(
        "Error al actualizar la asignación. Por favor, intente nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Eliminar registro
  const handleDelete = async (id: number) => {
    if (
      window.confirm("¿Estás seguro de que deseas eliminar esta asignación?")
    ) {
      try {
        await borrarAsignacion([id]);

        // Recargar datos desde la API después de eliminar
        await fetchData();

        toast.success("Asignación eliminada correctamente");
      } catch (error) {
        console.error("Error al eliminar asignación:", error);
        toast.error(
          "Error al eliminar la asignación. Por favor, intente nuevamente.",
        );
      }
    }
  };

  // Filtrar herramientas asignadas
  const filteredTools = assignedTools.filter((tool) =>
    Object.values(tool).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase()),
    ),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        {/* Título y botón de recarga */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-[#940C25] to-rose-700 rounded-xl">
                <FaTools className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Asignación de Herramientas
                </h1>
                <p className="text-gray-600 text-sm">
                  Conservando exactamente tus campos, con un diseño más limpio
                </p>
              </div>
            </div>

            <button
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm"
              onClick={() => toast.info("Exportar a Excel: pendiente")}
            >
              <FaFileExcel className="w-4 h-4" />
              Descargar Excel
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="relative w-full sm:w-96">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar asignación..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#940C25] focus:border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#fde7eb] rounded-lg">
              {editingId !== null ? (
                <FaEdit className="w-5 h-5 text-[#940C25]" />
              ) : (
                <FaPlus className="w-5 h-5 text-[#940C25]" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId !== null ? "Editar Asignación" : "Nueva Asignación"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {formFields.map(renderFormField)}
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${loading
                  ? "bg-gray-300 cursor-not-allowed text-gray-500"
                  : "bg-[#940C25] hover:bg-rose-800 text-white shadow-sm hover:shadow-md"
                }`}
              onClick={editingId !== null ? handleSaveEdit : handleAssign}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Procesando...
                </>
              ) : editingId !== null ? (
                <>
                  <FaSave />
                  Guardar Cambios
                </>
              ) : (
                <>
                  <FaPlus />
                  Asignar Herramienta
                </>
              )}
            </button>

            {editingId !== null && (
              <button
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    ...initialForm,
                    ultimaActualizacion: format(new Date(), "yyyy-MM-dd"),
                  });
                  setValidationErrors({});
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Herramientas Asignadas ({filteredTools.length})
              </h3>
            </div>
          </div>

          {filteredTools.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {search
                ? "No se encontraron resultados"
                : "No hay herramientas asignadas"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Empleado
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Requisicion(folio)
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Herramienta
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Cantidad
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Condición
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Estado
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Ubicación
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Descripción
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Fecha de Alta
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Fecha de Devolución
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Última Actualización
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTools.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{item.empleado?.nombre || "N/A"}</td>
                      <td className="p-3">
                        {item.requisicion?.folio || "N/A"}
                      </td>
                      <td className="p-3">
                        {item.inventario?.material || "N/A"}
                      </td>
                      <td className="p-3">{item.cantidad}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${item.condicionId === "1"
                              ? "bg-green-100 text-green-800"
                              : item.condicionId === "2"
                                ? "bg-blue-100 text-blue-800"
                                : item.condicionId === "3"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                        >
                          {["", "Excelente", "Buena", "Regular", "Mala"][
                            Number.parseInt(item.condicionId)
                          ] || item.condicionId}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${item.estadoAsignacionId === "1"
                              ? "bg-blue-100 text-blue-800"
                              : item.estadoAsignacionId === "2"
                                ? "bg-green-100 text-green-800"
                                : item.estadoAsignacionId === "3"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                        >
                          {["", "Asignada", "En Uso", "Devuelta", "Perdida"][
                            Number.parseInt(item.estadoAsignacionId)
                          ] || item.estadoAsignacionId}
                        </span>
                      </td>
                      <td className="p-3">{item.ubicacion}</td>
                      <td className="p-3">{item.descripcion}</td>

                      <td className="p-3">
                        {item.fechaEntrega
                          ? formatMySQLDate(item.fechaEntrega)
                          : "-"}
                      </td>
                      <td className="p-3">
                        {item.fechaDevolucion
                          ? formatMySQLDate(item.fechaDevolucion)
                          : "-"}
                      </td>
                      <td className="p-3">{item.ultimaActualizacion}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <FaEdit
                            className="text-blue-500 cursor-pointer hover:text-blue-700 transition-colors"
                            onClick={() => handleEdit(item.id)}
                            title="Editar"
                          />
                          <FaTrash
                            className="text-red-500 cursor-pointer hover:text-red-700 transition-colors"
                            onClick={() => handleDelete(item.id)}
                            title="Eliminar"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
