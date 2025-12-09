"use client";
import { useState, useEffect } from "react";
import { Building2, Save, X, Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { usersAll } from "@/utils/api/users";
import { useGoBackOneSegment } from "@/components/breadcrumb";
import { crearPlanta } from "@/utils/api/ing-proyectos"; // Usando la ruta correcta

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol_id: number;
}

interface UsuarioCookie {
  usuario: {
    id: number;
    nombre: string;
    correo: string;
    rol_id: number;
  };
}

export default function NuevaPlantaPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [usuarioACargoId, setUsuarioACargoId] = useState<number | "">("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);

  const gobackone = useGoBackOneSegment()

  // Obtener usuario actual de las cookies
  const obtenerUsuarioActual = (): Usuario | null => {
    try {
      // Buscar la cookie 'usuario'
      const cookies = document.cookie.split(';');
      const usuarioCookie = cookies.find(cookie =>
        cookie.trim().startsWith('usuario=')
      );

      if (usuarioCookie) {
        const usuarioData = JSON.parse(decodeURIComponent(usuarioCookie.split('=')[1])) as UsuarioCookie;
        return usuarioData.usuario;
      }
    } catch (error) {
      console.error("Error obteniendo usuario de cookies:", error);
    }
    return null;
  };

  // Cargar usuarios disponibles y usuario actual
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargandoUsuarios(true);

        // Obtener usuario actual de cookies
        const usuarioCookie = obtenerUsuarioActual();
        if (usuarioCookie) {
          setUsuarioActual(usuarioCookie);
          // Establecer como valor predeterminado
          setUsuarioACargoId(usuarioCookie.id);
        }

        // Obtener usuarios de la API
        const usuariosData = await usersAll();
        setUsuarios(usuariosData);

      } catch (error) {
        console.error("Error cargando datos:", error);
        setError("Error al cargar la lista de usuarios");
      } finally {
        setCargandoUsuarios(false);
      }
    };

    cargarDatos();
  }, []);

  const handleGuardar = async () => {
    // Validación
    if (!nombre.trim()) {
      setError("El nombre de la planta es obligatorio");
      return;
    }

    if (!usuarioACargoId) {
      setError("Debes asignar un usuario a cargo");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      // Obtener usuario seleccionado
      const usuarioSeleccionado = usuarios.find(u => u.id === usuarioACargoId);

      if (!usuarioSeleccionado) {
        throw new Error("Usuario seleccionado no encontrado");
      }

      // Crear planta usando la API
      const plantaData = {
        nombre: nombre.trim(),
        usuario_id: usuarioSeleccionado.id,
      };

      const response = await crearPlanta(plantaData);

      // Obtener la ruta actual y redirigir a la planta creada
      // const pathname = window.location.pathname;

      // Redirigir a la vista de la planta usando la ruta relativa
      router.push(`${response.id}`);


    } catch (err: unknown) {
      console.error("Error creando planta:", err);

      // Refinar el tipo antes de usarlo
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          setError(`Error al crear la planta: ${axiosError.response.data.message}`);
        }
      } else if (err instanceof Error) {
        setError(`Error al crear la planta: ${err.message}`);
      } else {
        setError("Error al crear la planta. Por favor, intenta nuevamente.");
      }

      setGuardando(false);
    }

  };

  // Obtener el usuario seleccionado para mostrar información
  const usuarioSeleccionado = usuarios.find(u => u.id === usuarioACargoId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Building2 size={32} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nueva Planta</h1>
              <p className="text-gray-500 mt-1">
                Crea una nueva planta para gestionar levantamientos
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="space-y-6">
            {/* Campo Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Planta *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setError("");
                }}
                placeholder="Ej: Planta Norte, Planta Monterrey..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* Campo Usuario a Cargo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario a Cargo *
              </label>
              {cargandoUsuarios ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="animate-spin" size={16} />
                  Cargando usuarios...
                </div>
              ) : (
                <select
                  value={usuarioACargoId}
                  onChange={(e) => {
                    setUsuarioACargoId(Number(e.target.value));
                    setError("");
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar usuario...</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nombre} ({usuario.correo})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Información del usuario seleccionado */}
            {usuarioSeleccionado && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <User size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Usuario asignado: {usuarioSeleccionado.nombre}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {usuarioSeleccionado.id === usuarioActual?.id ? (
                        <strong>✓ Eres tú - Podrás ver y gestionar esta planta en planeación</strong>
                      ) : (
                        `Solo ${usuarioSeleccionado.nombre} podrá ver y gestionar esta planta en la sección de planeación.`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            {/* Consejo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Consejo:</strong> Asigna la planta al usuario responsable de su gestión.
                {usuarioActual && (
                  <> Por defecto se ha seleccionado tu usuario (<strong>{usuarioActual.nombre}</strong>).</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            onClick={handleGuardar}
            disabled={guardando || !nombre.trim() || !usuarioACargoId}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {guardando ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Creando...
              </>
            ) : (
              <>
                <Save size={20} />
                Crear Planta
              </>
            )}
          </button>
          <button
            onClick={gobackone}
            disabled={guardando}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold disabled:opacity-50"
          >
            <X size={20} className="inline mr-2" />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
