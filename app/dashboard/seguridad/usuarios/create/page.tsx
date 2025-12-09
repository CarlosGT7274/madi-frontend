"use client";
import { getroles } from "@/utils/api/roles";
import { registerUser } from "@/utils/api/users";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Shield,
  ArrowLeft,
  UserPlus,
} from "lucide-react";

interface CreateUserData {
  nombre: string;
  correo: string;
  password: string;
  // confirmPassword: string;
  rol_id: number;
}

interface Roles {
  id: number;
  nombre: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Roles[] | null>(null);
  const [userData, setUserData] = useState<CreateUserData>({
    nombre: "",
    correo: "",
    password: "",
    // confirmPassword: "",
    rol_id: 1,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesData = await getroles();
        setRoles(rolesData);
        if (rolesData && rolesData.length > 0) {
          setUserData((prev) => ({ ...prev, rol_id: rolesData[0].id }));
        }
      } catch (err) {
        console.error("Error fetching roles:", err);
        toast.error("Error al cargar los perfiles de usuario");
      }
    };
    fetchRoles();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!userData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    } else if (userData.nombre.trim().length < 2) {
      newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
    }

    if (!userData.correo.trim()) {
      newErrors.correo = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.correo)) {
      newErrors.correo = "El formato del correo no es válido";
    }

    if (!userData.password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (userData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    // if (!userData.confirmPassword) {
    //   newErrors.confirmPassword = "Confirma tu contraseña";
    // } else if (userData.password !== userData.confirmPassword) {
    //   newErrors.confirmPassword = "Las contraseñas no coinciden";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserData((prev) => ({ ...prev, rol_id: Number(e.target.value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario");
      return;
    }

    setLoading(true);
    try {
      const { ...dataToSend } = userData;
      await registerUser(dataToSend);
      toast.success("¡Usuario creado exitosamente!", {
        position: "top-right",
        autoClose: 3000,
      });
      setTimeout(() => {
        router.push("/users");
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

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Crear Usuario</h1>
          <p className="mt-2 text-gray-600">
            Completa la información para crear un nuevo usuario
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
                value={userData.nombre}
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
                value={userData.correo}
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

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="inline h-4 w-4 mr-1" />
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={userData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full border rounded-xl px-4 py-3 pr-12 transition-all duration-200 bg-white hover:border-gray-300 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#940C25] focus:border-transparent ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirmar Contraseña */}
            {/* <div> */}
            {/*   <label className="block text-sm font-medium text-gray-700 mb-2"> */}
            {/*     <Lock className="inline h-4 w-4 mr-1" /> */}
            {/*     Confirmar Contraseña */}
            {/*   </label> */}
            {/*   <div className="relative"> */}
            {/*     <input */}
            {/*       type={showConfirmPassword ? "text" : "password"} */}
            {/*       name="confirmPassword" */}
            {/*       value={userData.confirmPassword} */}
            {/*       onChange={handleChange} */}
            {/*       placeholder="Confirma tu contraseña" */}
            {/*       className={`w-full border rounded-xl px-4 py-3 pr-12 transition-all duration-200 bg-white hover:border-gray-300 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#940C25] focus:border-transparent ${ */}
            {/*         errors.confirmPassword */}
            {/*           ? "border-red-500" */}
            {/*           : "border-gray-300" */}
            {/*       }`} */}
            {/*     /> */}
            {/*     <button */}
            {/*       type="button" */}
            {/*       onClick={() => setShowConfirmPassword(!showConfirmPassword)} */}
            {/*       className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" */}
            {/*     > */}
            {/*       {showConfirmPassword ? ( */}
            {/*         <EyeOff className="h-5 w-5" /> */}
            {/*       ) : ( */}
            {/*         <Eye className="h-5 w-5" /> */}
            {/*       )} */}
            {/*     </button> */}
            {/*   </div> */}
            {/*   {errors.confirmPassword && ( */}
            {/*     <p className="mt-1 text-sm text-red-600"> */}
            {/*       {errors.confirmPassword} */}
            {/*     </p> */}
            {/*   )} */}
            {/* </div> */}

            {/* Perfil */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="inline h-4 w-4 mr-1" />
                Perfil de Usuario
              </label>
              <select
                name="rol_id"
                value={userData.rol_id}
                onChange={handleRoleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                {roles?.map((rol) => (
                  <option key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </div>
                ) : (
                  "Crear Usuario"
                )}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium flex items-center justify-center"
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
            Los campos marcados son obligatorios
          </p>
        </div>
      </div>
    </div>
  );
}
