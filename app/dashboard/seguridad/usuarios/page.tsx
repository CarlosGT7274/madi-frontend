"use client";

import { usersAll } from "@/utils/api/users";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Allusers[] | []>([]);

  useEffect(() => {
    const fetchUsuarios = async () => {
      setUsuarios(await usersAll());
    };

    fetchUsuarios();
  }, []);

  return (
    <div className="space-x-6">
      <div className="min-h-screen p-6 grid items-end grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usuarios.map((e) => (
          <div
            key={e.id}
            className="border-b-2 border-ldark hover:border-primary w-full text-center font-semibold cursor-pointer select-none h-16 hover:text-primary flex items-center justify-center"
            onClick={() => {
              window.location.href = `usuarios/${e.id}`;
            }}
          >
            {e.nombre}
          </div>
        ))}

        <Link href="usuarios/create">
          <div className="border-2 border-dashed border-gray-300 hover:border-primary w-full text-center font-semibold cursor-pointer select-none h-16 hover:text-primary flex items-center justify-center transition-colors bg-gray-50 hover:bg-gray-100">
            + Crear Nuevo Usuario
          </div>
        </Link>
      </div>
    </div>
  );
}
