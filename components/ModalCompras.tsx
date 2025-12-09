import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { Material } from "../types/material";
import {
  obtenerEstadosMaterial,
  actualizarMaterialesDesdeCompras,
} from "@/utils/api/material";

interface Requisicion {
  id: number;
  folio: string;
  proyecto: string;
  orden?: string;
  empleado: string;
  observaciones?: string;
  fechaSolicitud: string;
  materiales: Material[];
}

interface ModalComprasProps {
  requisicion: Requisicion;
  onClose: () => void;
  onGuardar: () => void;
}

// ---- Tipos locales para estado enriquecido
type WithFechaLlegada = { fechaLlegada?: string };
type EstadoMaterial = Material & {
  idEstatus: number;
  observacion: string;
  fechaLlegada?: string;
};

export default function ModalCompras({
  requisicion,
  onClose,
  onGuardar,
}: ModalComprasProps) {
  const { folio, proyecto, orden, empleado, fechaSolicitud, materiales } =
    requisicion;

  const [observacionesGenerales, setObservacionesGenerales] = useState(
    requisicion.observaciones ?? ""
  );

  const [catalogoEstatus, setCatalogoEstatus] = useState<
    { id: number; nombre: string }[]
  >([]);

  const [estadoMateriales, setEstadoMateriales] = useState<EstadoMaterial[]>(
    () =>
      (materiales || [])
        .filter((m) => m.enviadoACompras || m.estatus?.nombre === "Pendiente")
        .map(
          (mat): EstadoMaterial => ({
            ...mat,
            idEstatus:
              typeof mat.estatus?.id === "number"
                ? mat.estatus.id
                : typeof (mat as Partial<Material> & { idEstatus?: number })
                    .idEstatus === "number"
                ? (mat as Partial<Material> & { idEstatus?: number }).idEstatus!
                : 1,
            observacion: mat.observacion ?? "",
            // ✅ sin "any"
            fechaLlegada: (mat as WithFechaLlegada).fechaLlegada ?? "",
          })
        )
  );

  useEffect(() => {
    const fetchEstatus = async () => {
      try {
        const estados = await obtenerEstadosMaterial();
        setCatalogoEstatus(estados);
      } catch {
        toast.error("Error al obtener los estados");
      }
    };
    fetchEstatus();
  }, []);

  useEffect(() => {
    if (requisicion.observaciones) {
      setObservacionesGenerales(requisicion.observaciones);
    }
  }, [requisicion.observaciones]);

  const handleEstadoChange = (index: number, idEstatus: number) => {
    setEstadoMateriales((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], idEstatus };
      return copia;
    });
  };

  const handleFechaLlegadaChange = (index: number, fecha: string) => {
    setEstadoMateriales((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], fechaLlegada: fecha };
      return copia;
    });
  };

  const handleObservacionChange = (index: number, texto: string) => {
    setEstadoMateriales((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], observacion: texto };
      return copia;
    });
  };

  const guardarCambios = async () => {
    try {
      const payload = estadoMateriales.map((m) => ({
        id: m.id,
        idEstatus: m.idEstatus,
        observacion: m.observacion,
        fechaLlegada: m.fechaLlegada || undefined,
      }));

      await actualizarMaterialesDesdeCompras({
        requisicionId: requisicion.id,
        observaciones: observacionesGenerales,
        materiales: payload,
      });

      const materialesEnviados = payload.filter((m) => {
        const estado = catalogoEstatus.find(
          (e) => e.id === m.idEstatus
        )?.nombre;
        return estado === "Pendiente";
      });

      const materialesParcial = requisicion.materiales.filter(
        (mat) => (mat.cantidadEntregada ?? 0) < mat.cantidad
      );

      if (materialesEnviados.length > 0) {
        toast.info("Algunos materiales fueron enviados a compras");
      }

      if (materialesParcial.length > 0) {
        toast.info("Se notificó al área solicitante sobre la entrega parcial");
      }

      toast.success("Cambios guardados correctamente");
      onGuardar();
    } catch (error) {
      toast.error("Error al guardar cambios");
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-opacity-40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-[800px] max-h-[90vh] overflow-y-auto shadow-2xl transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Requisición - {folio}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <p>
            <strong>Proyecto:</strong> {proyecto}
          </p>
          <p>
            <strong>Orden:</strong> {orden || "-"}
          </p>
          <p>
            <strong>Empleado:</strong> {empleado}
          </p>
          <p>
            <strong>Fecha:</strong>{" "}
            {new Date(fechaSolicitud).toLocaleString("es-MX")}
          </p>
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">
            Observaciones generales
          </label>
          <textarea
            className="w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={observacionesGenerales}
            onChange={(e) => setObservacionesGenerales(e.target.value)}
          />
        </div>

        <h3 className="text-md font-semibold mb-3">Materiales</h3>
        <div className="space-y-4">
          {estadoMateriales.map((mat, i) => {
            const estadoNombre = catalogoEstatus.find(
              (e) => e.id === mat.idEstatus
            )?.nombre;

            return (
              <div
                key={i}
                className="border rounded-xl p-4 shadow-sm bg-gray-50"
              >
                <p className="font-semibold">
                  {mat.material} ({mat.cantidad} {mat.unidadMedida})
                </p>
                <p className="text-sm text-gray-500 mb-2">{mat.descripcion}</p>

                <label className="block text-sm font-medium mb-1">
                  Estado del material:
                </label>
                <select
                  value={mat.idEstatus}
                  onChange={(e) =>
                    handleEstadoChange(i, Number(e.target.value))
                  }
                  className="w-full border p-2 rounded mb-2 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {catalogoEstatus.map((estado) => (
                    <option key={estado.id} value={estado.id}>
                      {estado.nombre}
                    </option>
                  ))}
                </select>

                {estadoNombre === "En tránsito" && (
                  <input
                    type="date"
                    value={mat.fechaLlegada || ""}
                    onChange={(e) =>
                      handleFechaLlegadaChange(i, e.target.value)
                    }
                    className="border p-2 rounded w-full mb-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}

                {estadoNombre === "Compra entregada" && (
                  <p className="text-green-700 text-sm font-medium mb-2">
                    ✅ Ya se puede actualizar el almacén
                  </p>
                )}

                <textarea
                  placeholder="Observaciones del material"
                  value={mat.observacion || ""}
                  onChange={(e) => handleObservacionChange(i, e.target.value)}
                  className="w-full border p-2 rounded text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-6 gap-3">
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
          >
            Cancelar
          </button>
          <button
            onClick={guardarCambios}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
