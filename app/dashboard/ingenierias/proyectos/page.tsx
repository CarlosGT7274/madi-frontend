"use client";
import { useEffect, useState } from "react";
import { Building2, Plus, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { obtenerPlantas } from "@/utils/api/ing-proyectos";

interface Planta {
  id: number;
  folio: string;
  nombre: string;
  direccion?: string;
  activa: boolean;
  usuario?: {
    id: number;
    nombre: string;
  };
  levantamientos?: Array<unknown>;
  fecha_creacion: string;
}

export default function PlantasPage() {
  const router = useRouter();
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [cargando, setCargando] = useState(true);

  const pathname = usePathname();

  useEffect(() => {
    cargarPlantas();
  }, []);

  const cargarPlantas = async () => {
    try {
      const data = await obtenerPlantas();
      setPlantas(data);
    } catch (error) {
      console.error("Error cargando plantas:", error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Plantas</h1>
              <p className="text-gray-500 mt-2">
                Gestiona las plantas y sus levantamientos
              </p>
            </div>
            <button
              onClick={() => router.push(`${pathname}/nueva-planta`)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              <Plus size={20} />
              Nueva Planta
            </button>
          </div>
        </div>

        {/* Grid de Plantas */}
        {plantas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No hay plantas registradas
            </h3>
            <p className="text-gray-500 mb-6">
              Crea tu primera planta para comenzar
            </p>
            <button
              onClick={() => router.push(`${pathname}/nueva-planta`)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Crear Primera Planta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plantas.map((planta) => (
              <div
                key={planta.id}
                onClick={() => router.push(`${pathname}/${planta.id}`)}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Building2 size={32} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 mb-2">
                      {planta.nombre}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="bg-gray-100 px-3 py-1 rounded-full">
                        {planta.levantamientos?.length || 0} levantamiento
                        {(planta.levantamientos?.length || 0) !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      Creada:{" "}
                      {new Date(planta.fecha_creacion).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
