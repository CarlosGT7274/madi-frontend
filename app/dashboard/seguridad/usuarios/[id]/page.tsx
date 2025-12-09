"use client";
import { getroles } from "@/utils/api/roles";
import { getOneUser, updateUser } from "@/utils/api/users";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { User, Mail, Shield, ArrowLeft, Save, Loader2 } from "lucide-react";

interface UpdateUserData {
  nombre: string;
  correo: string;
  rol_id: number;
}

interface Allusers {
  id: number;
  nombre: string;
  correo: string;
  rol_id: number;
}

interface Roles {
  id: number;
  nombre: string;
}

export default function OneUserPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number.parseInt(params.id as string);
  const [user, setUser] = useState<Allusers | null>(null);
  const [roles, setRoles] = useState<Roles[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, rolesData] = await Promise.all([
          getOneUser(id),
          getroles(),
        ]);
        setUser(userData);
        setRoles(rolesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Error al cargar los datos del usuario", {
          position: "top-right",
          autoClose: 4000,
        });
        router.back();
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, router]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!user?.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    } else if (user.nombre.trim().length < 2) {
      newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
    }

    if (!user?.correo.trim()) {
      newErrors.correo = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.correo)) {
      newErrors.correo = "El formato del correo no es válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prev) => (prev ? ({ ...prev, [name]: value } as Allusers) : prev));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUser((prev) =>
      prev ? { ...prev, rol_id: Number(e.target.value) } : prev,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario");
      return;
    }

    setLoading(true);
    try {
      const updateData: UpdateUserData = {
        nombre: user.nombre,
        correo: user.correo,
        rol_id: user.rol_id,
      };

      await updateUser(id, updateData);
      toast.success("¡Usuario actualizado exitosamente!", {
        position: "top-right",
        autoClose: 3000,
      });
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: unknown) {
      console.error("Error creating user:", error);

      let errorMessage = "Error al crear el usuario";

      if (typeof error === "object" && error !== null) {
        const apiError = error as ApiError;
        errorMessage =
          apiError?.response?.data?.message ||
          apiError?.message ||
          errorMessage;
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading inicial
  if (initialLoading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow-xl rounded-lg p-8">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#940C25]" />
              <span className="ml-3 text-lg text-gray-600">
                Cargando datos del usuario...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !roles) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow-xl rounded-lg p-8">
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">
                No se pudo cargar la información del usuario
              </p>
              <button
                onClick={() => router.back()}
                className="mt-4 text-[#940C25] hover:text-[#7a0a1f] font-medium"
              >
                Volver atrás
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-[#940C25] rounded-full flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Usuario</h1>
          <p className="mt-2 text-gray-600">
            Actualiza la información del usuario
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-xl rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Nombre Completo
              </label>
              <input
                type="text"
                name="nombre"
                value={user.nombre}
                onChange={handleChange}
                placeholder="Ingresa el nombre completo"
                className={`w-full border rounded-xl px-4 py-3 transition-all duration-200 bg-white hover:border-gray-300 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#940C25] focus:border-transparent ${
                  errors.nombre ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
              )}
            </div>

            {/* Correo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Correo Electrónico
              </label>
              <input
                type="email"
                name="correo"
                value={user.correo}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                className={`w-full border rounded-xl px-4 py-3 transition-all duration-200 bg-white hover:border-gray-300 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#940C25] focus:border-transparent ${
                  errors.correo ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.correo && (
                <p className="mt-1 text-sm text-red-600">{errors.correo}</p>
              )}
            </div>

            {/* Perfil */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="inline h-4 w-4 mr-1" />
                Perfil de Usuario
              </label>
              <select
                name="rol_id"
                value={user.rol_id}
                onChange={handleRoleChange}
                className="w-full border rounded-xl px-4 py-3 transition-all duration-200 bg-white hover:border-gray-300 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#940C25] focus:border-transparent"
              >
                {roles.map((rol) => (
                  <option key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Información adicional */}
            {/* <div className="bg-blue-50 border border-blue-200 rounded-xl p-4"> */}
            {/*   <div className="flex"> */}
            {/*     <div className="flex-shrink-0"> */}
            {/*       <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor"> */}
            {/*         <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /> */}
            {/*       </svg> */}
            {/*     </div> */}
            {/*     <div className="ml-3"> */}
            {/*       <h3 className="text-sm font-medium text-blue-800"> */}
            {/*         Información importante */}
            {/*       </h3> */}
            {/*       <div className="mt-1 text-sm text-blue-700"> */}
            {/*         Al editar este usuario, los cambios se aplicarán inmediatamente y el usuario será notificado si es necesario. */}
            {/*       </div> */}
            {/*     </div> */}
            {/*   </div> */}
            {/* </div> */}

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#940C25] text-white py-3 px-6 rounded-xl hover:bg-[#7a0a1f] focus:outline-none focus:ring-2 focus:ring-[#940C25] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Guardando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Save className="h-4 w-4 mr-1" />
                    Guardar Cambios
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Cancelar
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            ID del usuario:{" "}
            <span className="font-mono text-gray-700">#{user.id}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
