"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PermissionsTable } from "@/components/PermissionsTable";
// import { PermissionsTable } from "@/components/PermissionsTable"
import { createRole, getAllPermissions } from "@/utils/api/roles";

export default function CreateRolePage() {
  const router = useRouter();
  const [roleName, setRoleName] = useState("");
  const [permissionsState, setPermissionsState] = useState<{
    [key: number]: number;
  }>({});
  const [loading, setLoading] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<PermisoCompleto[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const permissions = await getAllPermissions();
        const aaa = permissions.filter((i: PermisoBase) => i.id_permiso !== 0)
        setAvailablePermissions(aaa as PermisoCompleto[]);
      } catch (error) {
        console.error("Error loading permissions:", error);
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchPermissions();
  }, []);

  const handleSave = async () => {
    if (!roleName.trim()) {
      alert("Por favor ingresa un nombre para el rol");
      return;
    }

    setLoading(true);
    try {

      const permisos = Object.entries(permissionsState).map(
        ([id_permiso, valor]) => ({
          id_permiso: Number(id_permiso), // opcional, porque Object.entries da string
          permiso: valor,
        }),
      );

      console.log(permisos);

      await createRole({ nombre: roleName, permisos: permisos });

      alert("Rol creado exitosamente");
      router.back();
    } catch (error) {
      console.error("Error creando rol:", error);
      alert("Error al crear el rol");
    } finally {
      setLoading(false);
    }
  };

  if (loadingPermissions) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Crear Nuevo Rol</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label
            htmlFor="roleName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Nombre del Rol
          </label>
          <input
            id="roleName"
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ingresa el nombre del rol..."
          />
        </div>
      </div>

      <PermissionsTable
        permissionsState={permissionsState}
        setPermissionsState={setPermissionsState}
        permisos={availablePermissions}
      />

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear Rol"}
        </button>
        <button
          onClick={() => router.back()}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
