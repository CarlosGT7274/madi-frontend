"use client";
import { getAllPermissions, readOneRol, updateRolePermissions } from "@/utils/api/roles";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PermissionsTable } from "@/components/PermissionsTable";

export default function OnerolPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number.parseInt(params.id as string);

  const [rol, setRol] = useState<Roles | null>(null);
  const [error] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [permissionsState, setPermissionsState] = useState<{
    [key: number]: number;
  }>({});
  const [availablePermissions, setAvailablePermissions] = useState<PermisoCompleto[]>([]);


  const loadPermissionsFromRoleData = (roleData: Roles): { [key: number]: number } => {
    const initialPermissions: { [key: number]: number } = {};

    if (roleData?.permisos && Array.isArray(roleData.permisos)) {
      roleData.permisos.forEach((permiso: PermisoRol) => {
        if (permiso.id_permiso && permiso.valor !== undefined) {
          initialPermissions[permiso.id_permiso] = permiso.valor;
        }
      });
    }

    return initialPermissions;
  };

  useEffect(() => {
    const fetchOneRol = async () => {
      try {
        // Cargar el rol específico
        const roleData = await readOneRol(id);
        setRol(roleData);

        // Cargar todos los permisos disponibles
        const allPermissions = await getAllPermissions();
        const filteredPermissions = allPermissions.filter((i: PermisoBase) => i.id_permiso !== 0);
        setAvailablePermissions(filteredPermissions as PermisoCompleto[]);

        // Inicializar el estado de permisos con los que ya tiene el rol
        const rolePermissions = loadPermissionsFromRoleData(roleData);
        setPermissionsState(rolePermissions);
      } catch (err) {
        console.log(err);
      }
    };

    fetchOneRol();
  }, [id]);

  // Limpiar el estado de guardado después de 3 segundos
  useEffect(() => {
    if (saveStatus === 'success' || saveStatus === 'error') {
      const timeout = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [saveStatus]);

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus('idle');

    try {
      console.log("Guardando permisos:", permissionsState);

      const permisosToSave: PermisoToSave[] = Object.entries(permissionsState).map(
        ([id_permiso, valor]) => ({
          id_permiso: Number.parseInt(id_permiso),
          permiso: valor,
        }),
      );

      console.log("Estructura para guardar:", { permisos: permisosToSave });

      await updateRolePermissions(rol!.id!, { permisos: permisosToSave });

      setSaveStatus('success');
    } catch (error) {
      console.error("Error guardando:", error);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!rol) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Rol no encontrado</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Permisos para: {rol.nombre}</h1>
        <p className="text-gray-600">ID del Rol: {rol.id}</p>
      </div>

      <PermissionsTable
        permissionsState={permissionsState}
        setPermissionsState={setPermissionsState}
        permisos={availablePermissions}
      />

      <div className="mt-6 flex gap-4 items-center">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${isLoading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Guardando...
            </>
          ) : (
            'Guardar Cambios'
          )}
        </button>

        <button
          onClick={() => router.back()}
          disabled={isLoading}
          className={`px-6 py-2 rounded-lg transition-colors ${isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gray-600 hover:bg-gray-700'
            } text-white`}
        >
          Cancelar
        </button>

        {/* Mensajes de estado */}
        {saveStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200 animate-fade-in">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">¡Cambios guardados exitosamente!</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200 animate-fade-in">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="font-medium">Error al guardar los cambios</span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
