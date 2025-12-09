// app/auth/login/page.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { post } from "@/utils/http";
import { FaLock, FaUser } from "react-icons/fa";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const correo = formData.get("correo") as string;
    const password = formData.get("password") as string;

    try {
      const response = await post("auth/login", { correo, password });
      const Ruser = {
        usuario: {...response.usuario},
        permisos: response.permisos
      }
      console.log(Ruser)

      // Actualizar el contexto de autenticación
      login(response.access_token, Ruser);
      router.push("/dashboard");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Error al iniciar sesión");
      } else {
        setError("Error al iniciar sesión");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 bg-cover bg-center"
      style={{ backgroundImage: "url('../Logo.svg')" }}
    >
      <div className="relative bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center z-10">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Iniciar sesión
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          <div className="">
            <div className="flex items-center bg-gray-200 rounded-lg px-4 py-3 mb-4">
              <FaUser className="text-gray-600 mr-3" />
              <input
                name="correo"
                type="email"
                required
                className="bg-transparent flex-1 focus:outline-none text-gray-900 placeholder-gray-600"
                placeholder="Correo electrónico"
              />
            </div>
            <div className="flex items-center bg-gray-200 rounded-lg px-4 py-3 mb-4">
              <FaLock className="text-gray-600 mr-3" />
              <input
                name="password"
                type="password"
                required
                className="bg-transparent flex-1 focus:outline-none text-gray-900 placeholder-gray-600"
                placeholder="Contraseña"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#940C25] text-white font-bold py-3 rounded-full text-lg hover:bg-[#7a0a1e] transition"
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
