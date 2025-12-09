import { useState, useEffect } from "react";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ModalCompras from "./ModalCompras";
import { Material } from "../types/material";
import { obtenerRequisicionesCompras } from "../utils/api/requisicion";

export interface Requisicion {
  id: number;
  folio: string;
  proyecto: string;
  orden?: string;
  empleado: string;
  estado: {
    id: number;
    nombre: string;
  };
  fechaSolicitud: string;
  observaciones?: string;
  origen: string;
  materiales: Material[];
}

export default function ControlRequisiciones({}: {
  search: string;
  setNotifications: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [requisiciones, setRequisiciones] = useState<Requisicion[]>([]);
  const [selected, setSelected] = useState<Requisicion | null>(null);
  const searchParams = useSearchParams();
  const requisicionIdFromURL = searchParams.get("requisicionId");

  const fetchRequisiciones = async () => {
    try {
      const res = await obtenerRequisicionesCompras();
      setRequisiciones(res);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await obtenerRequisicionesCompras();
      setRequisiciones(res);

      if (requisicionIdFromURL) {
        const match = res.find(
          (r: Requisicion) => r.id === Number(requisicionIdFromURL)
        );
        if (match) setSelected(match);
      }
    };

    fetchData();
  }, [requisicionIdFromURL]);

  const exportarAExcel = () => {
    if (requisiciones.length === 0) {
      toast.warning("No hay requisiciones para exportar.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(requisiciones);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Requisiciones");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `Requisiciones_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportarAPDF = () => {
    if (requisiciones.length === 0) {
      toast.warning("No hay requisiciones para exportar.");
      return;
    }

    const doc = new jsPDF();
    const img = new Image();
    img.src = "/Logo.png";

    img.onload = () => {
      doc.addImage(img, "PNG", 10, 10, 25, 25);
      doc.setFontSize(16);
      doc.text(
        "Control de Requisiciones",
        doc.internal.pageSize.getWidth() / 2,
        20,
        { align: "center" }
      );

      const fecha = new Date().toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      doc.setFontSize(10);
      doc.text(
        `Fecha de descarga: ${fecha}`,
        doc.internal.pageSize.getWidth() / 2,
        28,
        { align: "center" }
      );

      const headers = [
        "ID",
        "Empleado",
        "Material",
        "Cantidad",
        "Unidad",
        "Origen",
        "Fecha",
      ];

      const rows = requisiciones.flatMap((r) =>
        r.materiales.map((m) => [
          r.id,
          r.empleado,
          m.material,
          m.cantidad,
          m.unidadMedida,
          r.origen,
          new Date(r.fechaSolicitud).toLocaleDateString("es-MX"),
        ])
      );

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
        },
        bodyStyles: {
          halign: "left",
        },
      });

      doc.save(`Requisiciones_${new Date().toISOString().slice(0, 10)}.pdf`);
    };
  };

  return (
    <div className="mt-4 bg-white shadow-lg rounded-lg overflow-x-auto">
      <div className="flex gap-4 mb-4">
        <button
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition"
          onClick={exportarAExcel}
        >
          <FaFileExcel /> Exportar Excel
        </button>
        <button
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition"
          onClick={exportarAPDF}
        >
          <FaFilePdf /> Exportar PDF
        </button>
      </div>

      <table className="min-w-full text-sm text-left">
        <thead className="bg-[#940C25] text-white">
          <tr>
            <th className="p-3">ID</th>
            <th className="p-3">Folio</th>
            <th className="p-3">Proyecto</th>
            <th className="p-3">Orden</th>
            <th className="p-3">Área</th>
            <th className="p-3">Empleado</th>
            <th className="p-3">Estado</th>
            <th className="p-3">Fecha Solicitud</th>
            <th className="p-3">Materiales</th>
          </tr>
        </thead>
        <tbody>
          {requisiciones.map((r) => (
            <tr
              key={r.id}
              className="border-b align-top cursor-pointer hover:bg-gray-100"
              onClick={() => setSelected(r)}
            >
              <td className="p-3">{r.id}</td>
              <td className="p-3">{r.folio}</td>
              <td className="p-3">{r.proyecto}</td>
              <td className="p-3">{r.orden || "-"}</td>
              <td className="p-3">{r.origen}</td>
              <td className="p-3">{r.empleado}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold
                  ${
                    r.estado?.nombre === "Pendiente"
                      ? "bg-red-100 text-red-800"
                      : r.estado?.nombre === "En seguimiento"
                      ? "bg-yellow-100 text-yellow-800"
                      : r.estado?.nombre === "Finalizado"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-200 text-gray-800"
                  }
                `}
                >
                  {r.estado?.nombre}
                </span>
              </td>
              <td className="p-3">
                {new Date(r.fechaSolicitud).toLocaleString("es-MX")}
              </td>
              <td className="p-3 align-top" colSpan={2}>
                <div className="flex flex-col gap-2">
                  {r.materiales.map((m, i) => {
                    const color =
                      m.urgencia?.descripcion === "Alta"
                        ? "bg-red-600"
                        : m.urgencia?.descripcion === "Media"
                        ? "bg-yellow-400"
                        : "bg-green-600";

                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className="relative group mt-1">
                          <div className={`w-3 h-3 rounded-full ${color}`} />
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10 hidden group-hover:flex bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">
                            {m.urgencia?.descripcion ?? "Sin urgencia"}
                          </div>
                        </div>
                        <div className="text-xs">
                          <p>
                            <strong>{m.material}</strong> ({m.cantidad}{" "}
                            {m.unidadMedida})
                          </p>
                          <p className="text-gray-500">{m.descripcion}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <ModalCompras
          requisicion={selected}
          onClose={() => setSelected(null)}
          onGuardar={() => {
            fetchRequisiciones();
          }}
        />
      )}
    </div>
  );
}
