// components/Header.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import NotificacionesBell from "./NotificacionesBell";
import {
  FaUser,
  FaTimes,
  FaUserCircle,
  FaHistory,
  FaSignOutAlt,
  FaClock,
  FaEnvelope,
  FaIdBadge,
  FaChevronDown,
  FaBars,
} from "react-icons/fa";
import { getCookie } from "cookies-next";
import { registrarLogout, obtenerUltimaSesion } from "../utils/api/auth";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";

interface HeaderProps {
  dateTime: string;
}

export default function Header({ dateTime }: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [usuario, setUsuario] = useState<User["usuario"] | null>(null);
  const [ultimaSesion, setUltimaSesion] = useState<string>("");
  const mountedRef = useRef(true);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebar();

  const formatFechaLocal = (isoOrDate: string | Date | null | undefined) => {
    if (!isoOrDate) return "";
    try {
      const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
      if (isNaN(d.getTime())) return "";
      return d.toLocaleString("es-MX");
    } catch {
      return "";
    }
  };

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    mountedRef.current = true;

    const userCookie = getCookie("usuario");
    const storedSesion = getCookie("ultimaSesion");

    if (userCookie) {
      try {
        const userData: User = JSON.parse(userCookie.toString());
        setUsuario(userData.usuario);

        obtenerUltimaSesion(userData.usuario.correo)
          .then((res) => {
            if (!mountedRef.current) return;
            const valor = res?.fechaHora ? formatFechaLocal(res.fechaHora) : "";
            setUltimaSesion(
              valor ||
                (storedSesion
                  ? formatFechaLocal(storedSesion.toString())
                  : "Sin sesión previa")
            );
          })
          .catch((err) => {
            console.error("Error obteniendo última sesión:", err);
            if (!mountedRef.current) return;
            setUltimaSesion(
              storedSesion
                ? formatFechaLocal(storedSesion.toString())
                : "Sin sesión previa"
            );
          });
      } catch (error) {
        console.error("Error parsing user cookie:", error);
      }
    } else {
      setUltimaSesion(
        storedSesion ? formatFechaLocal(storedSesion.toString()) : ""
      );
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleLogoutLocal = async () => {
    const userCookie = getCookie("usuario");
    const logoutTime = new Date();

    if (userCookie) {
      try {
        const userData: User = JSON.parse(userCookie.toString());
        await registrarLogout({
          usuario: userData.usuario.correo,
          ip: window.location.hostname,
          modulo: "Sistema",
        });
      } catch (error) {
        console.error("Error al registrar logout:", error);
      }
    }

    document.cookie = `ultimaSesion=${logoutTime.toISOString()}; path=/; max-age=2592000`;
    logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Header principal - z-50 para estar encima del sidebar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-4 lg:px-6 py-3 lg:py-4 bg-gradient-to-r from-white via-gray-50 to-white shadow-lg border-b border-gray-200/50 backdrop-blur-sm">
        {/* Lado izquierdo: Botón hamburguesa + Fecha/hora */}
        <div className="flex items-center gap-3 lg:gap-4">
          {/* Botón hamburguesa - solo visible en móvil */}
          <button
            className="lg:hidden w-10 h-10 bg-gradient-to-br from-[#940C25] to-[#a10c28] text-white rounded-lg shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {isSidebarOpen ? (
              <FaTimes className="text-sm" />
            ) : (
              <FaBars className="text-sm" />
            )}
          </button>

          {/* Fecha y hora */}
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden sm:flex w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-[#940C25]/20 to-[#940C25]/10 rounded-lg items-center justify-center">
              <FaClock className="text-[#940C25] text-sm lg:text-base" />
            </div>
            <div className="text-gray-700">
              {/* Desktop: fecha completa */}
              <div className="text-sm lg:text-lg font-medium hidden sm:block">
                {dateTime}
              </div>
              {/* Móvil: solo hora */}
              <div className="text-xs text-gray-600 sm:hidden font-medium">
                {dateTime.split(" ")[1]}
              </div>
            </div>
          </div>
        </div>

        {/* Lado derecho: Notificaciones + Usuario */}
        <div className="flex items-center gap-2 lg:gap-4">
          <NotificacionesBell />

          {/* Menú de usuario */}
          <div className="relative" ref={userMenuRef}>
            <button
              className="group flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg bg-gradient-to-br from-[#940C25] to-[#a10c28] hover:from-[#a10c28] hover:to-[#b10e2a] text-white transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="w-6 h-6 lg:w-8 lg:h-8 bg-white/20 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold backdrop-blur-sm">
                {usuario ? getInitials(usuario.nombre) : "U"}
              </div>
              <span className="hidden sm:block text-sm lg:text-base font-medium truncate max-w-24 lg:max-w-32">
                {usuario?.nombre || "Usuario"}
              </span>
              <FaChevronDown
                className={`text-xs lg:text-sm transition-transform duration-200 ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 lg:w-64 bg-white rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden z-50 animate-in slide-in-from-top-5 duration-200">
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#940C25] to-[#a10c28] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {usuario ? getInitials(usuario.nombre) : "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate text-sm">
                        {usuario?.nombre || "Usuario"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {usuario?.rol.nombre}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <button
                    className="group flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-all duration-150 text-left"
                    onClick={() => {
                      setShowProfile(true);
                      setUserMenuOpen(false);
                    }}
                  >
                    <FaUserCircle className="text-gray-400 group-hover:text-[#940C25] transition-colors" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      Mi Perfil
                    </span>
                  </button>
                  <button className="group flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-all duration-150 text-left">
                    <FaHistory className="text-gray-400 group-hover:text-[#940C25] transition-colors" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      Historial de Actividad
                    </span>
                  </button>
                </div>

                <div className="border-t border-gray-100"></div>

                <div className="py-2">
                  <button
                    className="group flex items-center gap-3 w-full px-4 py-2.5 hover:bg-red-50 transition-all duration-150 text-left"
                    onClick={handleLogoutLocal}
                  >
                    <FaSignOutAlt className="text-gray-400 group-hover:text-red-500 transition-colors" />
                    <span className="text-sm text-gray-700 group-hover:text-red-600">
                      Cerrar Sesión
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Panel de perfil lateral */}
      {showProfile && usuario && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setShowProfile(false)}
          />
          <div className="fixed top-0 right-0 w-full sm:w-96 lg:w-[420px] h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#940C25] to-[#a10c28] text-white p-4 lg:p-6 shadow-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 rounded-full flex items-center justify-center text-lg lg:text-xl font-bold backdrop-blur-sm">
                    {getInitials(usuario.nombre)}
                  </div>
                  <div>
                    <h2 className="text-lg lg:text-xl font-bold">
                      Perfil de Usuario
                    </h2>
                    <p className="text-white/80 text-sm">Sistema</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfile(false)}
                  className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
            </div>

            <div className="p-4 lg:p-6 space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 lg:p-5 border border-gray-200/50 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaUser className="text-[#940C25]" />
                  Información Personal
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <FaIdBadge className="text-[#940C25] mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500">Nombre completo</p>
                      <p className="font-medium text-gray-900 break-words">
                        {usuario.nombre}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaEnvelope className="text-[#940C25] mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500">Correo electrónico</p>
                      <p className="font-medium text-gray-900 break-all">
                        {usuario.correo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaUserCircle className="text-[#940C25] mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500">Rol asignado</p>
                      <p className="font-medium text-gray-900">
                        {usuario.rol.nombre}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 lg:p-5 border border-blue-200/50 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaClock className="text-blue-600" />
                  Sesión Actual
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <FaHistory className="text-blue-600 mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500">Última sesión</p>
                      <p className="font-medium text-gray-900 text-sm">
                        {ultimaSesion || "Sin sesión previa"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 rounded-lg transition-all duration-200 transform hover:scale-[1.02] border border-gray-200/50">
                  <FaHistory className="text-gray-600" />
                  <span className="font-medium text-gray-700">
                    Ver Historial Completo
                  </span>
                </button>
                <button
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
                  onClick={handleLogoutLocal}
                >
                  <FaSignOutAlt />
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
