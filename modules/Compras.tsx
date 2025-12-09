"use client";
import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import ControlRequisiciones from "../components/ControlRequisiciones";
import SolicitudesPago from "../components/SolicitudesPago";

interface ComprasProps {
  setNotifications: React.Dispatch<React.SetStateAction<number>>;
}

export default function Compras({ setNotifications }: ComprasProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Control de Requisiciones");

  return (
    <div className="p-6 flex flex-col">
      {/* Barra de búsqueda */}
      <div className="flex items-center bg-gray-200 rounded-lg px-4 py-3 mb-4 w-80">
        <FaSearch className="text-gray-600 mr-3" />
        <input
          type="text"
          placeholder="Buscar"
          className="bg-transparent flex-1 focus:outline-none text-gray-900 placeholder-gray-600"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        {["Control de Requisiciones", "Solicitudes de Pago"].map((item) => (
          <button
            key={item}
            className={`px-4 py-2 rounded-md text-white transition ${
              activeTab === item
                ? "bg-black font-bold"
                : "bg-[#940C25] hover:bg-[#7a0a1e]"
            }`}
            onClick={() => setActiveTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Contenido dinámico */}
      <div className="bg-gray-100 p-6 rounded-md shadow-md">
        {activeTab === "Control de Requisiciones" && (
          <ControlRequisiciones
            search={search}
            setNotifications={setNotifications}
          />
        )}

        {activeTab === "Solicitudes de Pago" && (
          <SolicitudesPago search={search} />
        )}
      </div>
    </div>
  );
}
