"use client";
import { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";

interface SolicitudPago {
  id: number;
  folio: string;
  monto: number;
  proveedor: string;
  estado: string;
}

export default function SolicitudesPago({ search }: { search: string }) {
  const [solicitudes, setSolicitudes] = useState<SolicitudPago[]>([]);

  const fetchSolicitudes = async () => {
    try {
      // Simulación de datos hasta tener backend
      const mock = [
        {
          id: 1,
          folio: "SP-001",
          monto: 12500,
          proveedor: "Ferretería La Tuerca",
          estado: "Pendiente",
        },
        {
          id: 2,
          folio: "SP-002",
          monto: 8420,
          proveedor: "Acero S.A.",
          estado: "Pendiente",
        },
      ];
      setSolicitudes(mock);
    } catch (error) {
      console.error(error);
    }
  };

  const aprobarSolicitud = (id: number) => {
    toast.success(`✅ Solicitud de pago ${id} aprobada`);
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, estado: "Aprobada" } : s))
    );
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const filtradas = solicitudes.filter((s) =>
    s.proveedor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">💰 Solicitudes de Pago</h2>
      <table className="w-full bg-white shadow rounded">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">Folio</th>
            <th className="p-2">Proveedor</th>
            <th className="p-2">Monto</th>
            <th className="p-2">Estado</th>
            <th className="p-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {filtradas.map((s, idx) => (
            <tr key={s.id}>
              <td className="p-2">{idx + 1}</td>
              <td className="p-2">{s.folio}</td>
              <td className="p-2">{s.proveedor}</td>
              <td className="p-2">${s.monto.toLocaleString()}</td>
              <td className="p-2">{s.estado}</td>
              <td className="p-2">
                <button
                  onClick={() => aprobarSolicitud(s.id)}
                  className="text-green-600 hover:text-green-800"
                >
                  <FaCheck />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
