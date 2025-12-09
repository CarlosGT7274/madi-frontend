"use client";
import { useEffect, useState } from "react";
import { Building2, Plus, FileText, Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useGoBackOneSegment } from "@/components/breadcrumb";
import { obtenerPlantaPorId, obtenerLevantamientosPorPlanta } from "@/utils/api/ing-proyectos";

interface Planta {
  id: number;
  folio: string;
  nombre: string;
  fecha_creacion: string;
  levantamientos?: Array<unknown>;
}

interface Levantamiento {
  id: number;
  planta_id: number;
  folio: string;
  nombre: string;
  cliente: string;
  titulo_cotizacion: string;
  fecha_creacion: string;
  estado: "borrador" | "activo" | "completado" | "cancelado";
  proyectos?: Array<unknown>;
}

export default function PlantaDetallePage() {
  const router = useRouter();
  const params = useParams();
  const plantaId = Number(params.plantaId);

  const [planta, setPlanta] = useState<Planta | null>(null);
  const [levantamientos, setLevantamientos] = useState<Levantamiento[]>([]);
  const [cargando, setCargando] = useState(true);

  const pathname = usePathname();
  const gobackone = useGoBackOneSegment();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar planta
        const plantaData = await obtenerPlantaPorId(plantaId);
        setPlanta(plantaData);

        // Cargar levantamientos
        const levsData = await obtenerLevantamientosPorPlanta(plantaId);
        setLevantamientos(levsData);
      } catch (error) {
        console.error("Error cargando datos:", error);
        router.push("/dashboard/ingenierias/proyectos");
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [plantaId, router]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!planta) {
    return null;
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "borrador":
        return "bg-gray-100 text-gray-700";
      case "activo":
        return "bg-blue-100 text-blue-700";
      case "completado":
        return "bg-green-100 text-green-700";
      case "cancelado":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <button
            onClick={gobackone}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Volver a Plantas
          </button>

          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-4 rounded-lg">
                <Building2 size={40} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {planta.nombre}
                </h1>
                <p className="text-gray-500 mt-2">
                  {levantamientos.length} levantamiento
                  {levantamientos.length !== 1 ? "s" : ""} registrado
                  {levantamientos.length !== 1 ? "s" : ""}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {planta.folio} • Creada: {new Date(planta.fecha_creacion).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`${pathname}/levantamiento`)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              <Plus size={20} />
              Nuevo Levantamiento
            </button>
          </div>
        </div>

        {/* Lista de Levantamientos */}
        {levantamientos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FileText size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No hay levantamientos
            </h3>
            <p className="text-gray-500 mb-6">
              Crea el primer levantamiento para esta planta
            </p>
            <button
              onClick={() => router.push(`${pathname}/levantamiento`)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Crear Primer Levantamiento
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {levantamientos.map((lev) => (
              <div
                key={lev.id}
                onClick={() => router.push(`${plantaId}/${lev.id}`)}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <FileText size={32} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-xl text-gray-900">
                          {lev.folio}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(lev.estado)}`}
                        >
                          {lev.estado.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-700 font-medium mb-2">
                        {lev.titulo_cotizacion || lev.nombre || "Sin título"}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Cliente: {lev.cliente}</span>
                        <span>•</span>
                        <span>{lev.proyectos?.length || 0} proyecto{(lev.proyectos?.length || 0) !== 1 ? "s" : ""}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Creado: {new Date(lev.fecha_creacion).toLocaleDateString()}
                      </p>
                    </div>
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
