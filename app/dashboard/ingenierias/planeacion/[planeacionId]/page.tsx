"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
// import PlaneacionForm from "@/components/proyectos";
import { obtenerPlaneacion, Planeacion } from "@/utils/api/planeacion";
import PlaneacionForm from "@/components/planeacion/planeacionForm";
import { obtenerRolUsuario, obtenerUsuarioDesdeCokie } from "@/utils/api/auth";

function obtenerUsuarioActual() {
  const usuario = obtenerUsuarioDesdeCokie();

  if (!usuario) {
    // Redirigir al login si no hay sesión
    // if (typeof window !== 'undefined') {
    //   window.location.href = '/login';
    // }
    throw new Error('No hay sesión activa');
  }

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: obtenerRolUsuario(),
    rol_id: usuario.rol_id,
  };
}



export default function VerPlaneacionPage() {
  const params = useParams();
  const router = useRouter();
  const [usuario] = useState(obtenerUsuarioActual());
  const [planeacion, setPlaneacion] = useState<Planeacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const planeacionId = Number.parseInt(params.planeacionId as string);

useEffect(() => {
  if (planeacionId) {
    const planeacionIdNum = planeacionId;

    
    if (!planeacionIdNum) {
      setError("ID de planeación inválido");
      setCargando(false);
      return;
    }

    const cargarPlaneacion = async () => {
      setCargando(true);
      setError(null);

      try {
        const plan = await obtenerPlaneacion(planeacionIdNum);

          if (!plan) {
            setError("Planeación no encontrada");
            return;
          }

          // Verificar permisos: ingeniero solo puede ver sus propias planeaciones
          if (usuario.rol === "ingeniero") {
            setError("No tienes permiso para ver esta planeación");
            return;
          }

          setPlaneacion(plan);
        } catch (err) {
          console.error("Error cargando planeación:", err);
          setError("Error al cargar la planeación");
        } finally {
          setCargando(false);
        }
      };
      cargarPlaneacion();
    }
  }, [planeacionId, usuario.rol, usuario.id]);


  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando planeación...</p>
        </div>
      </div>
    );
  }

  if (error || !planeacion) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <Breadcrumb />
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto w-24 h-24 text-red-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {error || "Planeación no encontrada"}
            </h3>
            <p className="text-gray-600 mb-6">
              La planeación que buscas no existe o no tienes permiso para verla
            </p>
            <button
              onClick={() => router.push("/dashboard/ingenierias/planeacion")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              ← Volver al listado
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <Breadcrumb />

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {planeacion.estado === "borrador" || planeacion.estado === "rechazada"
                  ? "✏️ Editar Planeación"
                  : "👁️ Ver Planeación"}
              </h1>
              <p className="text-gray-600 mt-2">
                Semana {planeacion.semana} - {planeacion.anio}
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/ingenierias/planeacion")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              ← Volver al listado
            </button>
          </div>
        </div>

        {/* Formulario */}
        <PlaneacionForm
          mode="view"
          planeacionId={planeacionId}
          userRole={usuario.rol}
          userId={usuario.id}
          userName={usuario.nombre}
          userEmail={usuario.correo}
        />
      </div>
    </div>
  );
}
