"use client";

import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import ControlInventario from "@/components/ControlInventario";

export default function InventarioPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center bg-gray-200 rounded-lg px-4 py-3 w-full max-w-md">
        <FaSearch className="text-gray-600 mr-3" />
        <input
          type="text"
          placeholder="Buscar en inventario…"
          className="bg-transparent flex-1 focus:outline-none text-gray-900 placeholder-gray-600"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <ControlInventario search={search} />
    </div>
  );
}
