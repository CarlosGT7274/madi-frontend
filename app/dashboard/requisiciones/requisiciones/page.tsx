"use client";
import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import Requisicion from "@/components/Requisicion"; // usa alias absoluto

export default function RequisicionesPage() {
  const [search, setSearch] = useState("");
  const [, setNotifications] = useState(0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center bg-gray-200 rounded-lg px-4 py-3 w-full max-w-md">
        <FaSearch className="text-gray-600 mr-3" />
        <input
          type="text"
          placeholder="Buscar requisición…"
          className="bg-transparent flex-1 focus:outline-none text-gray-900 placeholder-gray-600"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Requisicion search={search} setNotifications={setNotifications} />
    </div>
  );
}
