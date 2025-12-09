"use client";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { FaSearch } from "react-icons/fa";
import ControlInventario from "../components/ControlInventario";
import Requisicion from "../components/Requisicion";

interface AlmacenProps {
  setNotifications: Dispatch<SetStateAction<number>>;
}

export default function Almacen({ setNotifications }: AlmacenProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Control de Inventario");

  useEffect(() => {
    const savedTab = localStorage.getItem("almacen-tab");
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    localStorage.setItem("almacen-tab", activeTab);
  }, [activeTab]);

  return (
    <div className="p-6 flex flex-col">
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

      <div className="flex space-x-2 mb-6">
        {["Control de Inventario", "Requisición"].map((item) => (
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

      <div className="bg-gray-100 p-6 rounded-md shadow-md">
        {activeTab === "Control de Inventario" && (
          <ControlInventario search={search} />
        )}

        {activeTab === "Requisición" && (
          <Requisicion search={search} setNotifications={setNotifications} />
        )}

        {activeTab === "Bitácora" && <p>📖 Aquí va la sección de Bitácora.</p>}
      </div>
    </div>
  );
}
