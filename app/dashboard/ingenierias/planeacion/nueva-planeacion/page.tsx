"use client";
import { useState } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
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

export default function NuevaPlaneacionPage() {
  const [usuario] = useState(obtenerUsuarioActual());

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <Breadcrumb />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">➕ Nueva Planeación Semanal</h1>
          <p className="text-gray-600 mt-2">
            Crea una nueva planeación de actividades para la semana seleccionada
          </p>
        </div>

        {/* Formulario */}
        <PlaneacionForm
          mode="create"
          userRole={usuario.rol}
          userId={usuario.id}
          userName={usuario.nombre}
          userEmail={usuario.correo}
        />
      </div>
    </div>
  );
}
