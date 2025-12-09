"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LevantamientoForm } from "@/components/LevantamientoForm";
import { obtenerPlantaPorId } from "@/utils/api/ing-proyectos";

interface Planta {
  id: string;
  nombre: string;
  fechaCreacion: string;
  levantamientosIds: string[];
}

export default function NuevoLevantamientoPage() {
  const params = useParams();
  const router = useRouter();
  const plantaId = params.plantaId as string;
  const [planta, setPlanta] = useState<Planta | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarPlanta = async () => {
      try {
        setCargando(true);
        // Obtener la planta desde la API
        const plantaData = await obtenerPlantaPorId(parseInt(plantaId));
        
        if (!plantaData) {
          router.push("/proyectos");
          return;
        }

        // Adaptar la respuesta de la API al formato esperado
        const plantaAdaptada: Planta = {
          id: plantaData.id.toString(),
          nombre: plantaData.nombre,
          fechaCreacion: plantaData.fecha_creacion || new Date().toISOString(),
          levantamientosIds: plantaData.levantamientos_ids || [],
        };

        setPlanta(plantaAdaptada);
      } catch (error) {
        console.error("Error cargando planta:", error);
        router.push("/proyectos");
      } finally {
        setCargando(false);
      }
    };

    if (plantaId) {
      cargarPlanta();
    }
  }, [plantaId, router]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando planta...</p>
        </div>
      </div>
    );
  }

  if (!planta) return null;

  return (
    <LevantamientoForm
      modo="crear"
      planta={planta}  // ✅ Pasar objeto completo
      onCrearLevantamiento={(levantamientoId) => {
        router.push(`${levantamientoId}`);
      }}
      onCancelar={() => router.push(`/proyectos/${plantaId}`)}
    />
  );
}
