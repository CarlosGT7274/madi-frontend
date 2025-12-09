"use client";

import { getroles } from "@/utils/api/roles";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function RolesPage() {
  const [roles, setRoles] = useState<Roles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchroles = async () => {
      try {
        const data = await getroles();
        console.log(data);

        setRoles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchroles();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-x-6">
      <div className="min-h-screen p-6 grid items-end grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((e) => (
          <div
            key={e.id}
            className="border-b-2 border-ldark hover:border-primary w-full text-center font-semibold cursor-pointer select-none h-16 hover:text-primary flex items-center justify-center"
            onClick={() => {
              window.location.href = `roles/${e.id}`;
            }}
          >
            {e.nombre}
          </div>
        ))}

        <Link href="roles/create">
          <div className="border-2 border-dashed border-gray-300 hover:border-primary w-full text-center font-semibold cursor-pointer select-none h-16 hover:text-primary flex items-center justify-center transition-colors bg-gray-50 hover:bg-gray-100">
            + Crear Nuevo Rol
          </div>
        </Link>
      </div>
    </div>
  );
}
