// components/Sidebar.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCookie } from "cookies-next";
import {
  FaChevronDown,
  FaChartBar,
  FaTools,
  FaBook,
  FaBuilding,
  FaWarehouse,
  FaIndustry,
  FaCreditCard,
  FaUserShield,
  FaFileInvoice,
  FaBoxes,
  FaWrench,
  FaClipboard,
} from "react-icons/fa";
import { useSidebar } from "@/context/SidebarContext";

// Iconos por módulo
const MODULE_ICONS = {
  dashboard: <FaChartBar />,
  almacen: <FaWarehouse />,
  ingenierias: <FaIndustry />,
  compras: <FaCreditCard />,
  administracion: <FaBuilding />,
  seguridad: <FaUserShield />,
  requisiciones: <FaFileInvoice />,
} as const;

// Iconos por sub-módulo
const SUB_MODULE_ICONS = {
  inventario: <FaBoxes />,
  herramientas: <FaTools />,
  manuales: <FaBook />,
  "asignacion-herramientas": <FaWrench />,
} as const;

export default function Sidebar() {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { isOpen: isMobileMenuOpen, close: closeMobileMenu } = useSidebar();
  const prevPathnameRef = useRef(pathname);

  // Cargar usuario desde cookies
  useEffect(() => {
    const usuarioCookie = getCookie("usuario");
    if (usuarioCookie) {
      try {
        const userData = JSON.parse(usuarioCookie.toString());
        setUser(userData);
      } catch (error) {
        console.error("Error parsing user cookie:", error);
        setUser(null);
      }
    }
  }, []);

  // Abrir automáticamente el submenú basado en la ruta actual
  useEffect(() => {
    if (!user) return;
    const currentModule = pathname.split("/")[2];
    if (currentModule && user.permisos) {
      const permiso = Object.values(user.permisos).find(
        (p) => p.endpoint === currentModule
      );
      if (permiso && permiso.valor > 0) {
        setOpenSubmenu(currentModule);
      }
    }
  }, [pathname, user]);

  // Cerrar sidebar en móvil solo cuando navegas a una ruta diferente
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      closeMobileMenu();
      prevPathnameRef.current = pathname;
    }
  }, [pathname, closeMobileMenu]);

  const isActive = (href: string) =>
    href === pathname || pathname.startsWith(href + "/");

  const handleNavClick = () => {
    // Cerrar sidebar en móvil al navegar
    if (window.innerWidth < 1024) {
      closeMobileMenu();
    }
  };

  // Componente Group mejorado
  const ModuleGroup = ({ permiso }: { permiso: Permiso }) => {
    const keyName = permiso.endpoint;
    const label = permiso.nombre;
    const icon = MODULE_ICONS[keyName as keyof typeof MODULE_ICONS] || (
      <FaBuilding />
    );
    const isOpen = openSubmenu === keyName;
    const isGroupActive = isActive(`/dashboard/${keyName}`);

    if (permiso.valor <= 0) return null;

    return (
      <li className="mb-1">
        <button
          className={`group flex justify-between items-center w-full px-2 lg:px-3 py-2 lg:py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
            isGroupActive
              ? "bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm shadow-lg border-l-4 border-white/50"
              : "hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 hover:backdrop-blur-sm hover:shadow-md"
          }`}
          onClick={() => setOpenSubmenu(isOpen ? null : keyName)}
        >
          <span className="flex items-center gap-2 lg:gap-3">
            <span
              className={`text-base lg:text-lg transition-all duration-300 ${
                isGroupActive
                  ? "text-white scale-110"
                  : "text-white/80 group-hover:text-white group-hover:scale-105"
              }`}
            >
              {icon}
            </span>
            <span
              className={`text-sm lg:text-base font-medium transition-all duration-300 capitalize ${
                isGroupActive
                  ? "text-white"
                  : "text-white/90 group-hover:text-white"
              }`}
            >
              {label}
            </span>
          </span>
          <FaChevronDown
            className={`text-xs lg:text-sm transition-all duration-300 ease-out ${
              isOpen
                ? "rotate-180 text-white"
                : "rotate-0 text-white/70 group-hover:text-white"
            }`}
          />
        </button>

        {/* Submenú animado */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="ml-4 mt-2 space-y-1 border-l-2 border-white/20 pl-4">
            {permiso.sub_permisos &&
              Object.values(permiso.sub_permisos).map((subPermiso: SubPermiso) => {
                if (subPermiso.valor <= 0) return null;
                const subHref = `/dashboard/${keyName}/${subPermiso.endpoint}`;
                const subIcon =
                  SUB_MODULE_ICONS[
                    subPermiso.endpoint as keyof typeof SUB_MODULE_ICONS
                  ] || <FaClipboard />;

                return (
                  <Link
                    key={subPermiso.endpoint}
                    href={subHref}
                    onClick={handleNavClick}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 transform hover:translate-x-1 ${
                      isActive(subHref)
                        ? "bg-white/20 text-white shadow-md border-l-2 border-white/50"
                        : "text-white/80 hover:bg-white/10 hover:text-white hover:shadow-sm"
                    }`}
                  >
                    <span className="text-sm transition-transform duration-200 group-hover:scale-110">
                      {subIcon}
                    </span>
                    <span className="font-medium">{subPermiso.nombre}</span>
                  </Link>
                );
              })}
          </div>
        </div>
      </li>
    );
  };

  // Dashboard principal
  const DashboardLink = () => (
    <li className="mb-1">
      <Link
        href="/dashboard"
        onClick={handleNavClick}
        className={`group flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 lg:py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
          pathname === "/dashboard"
            ? "bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm shadow-lg border-l-4 border-white/50"
            : "hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 hover:backdrop-blur-sm hover:shadow-md"
        }`}
      >
        <span
          className={`text-base lg:text-lg transition-all duration-300 ${
            pathname === "/dashboard"
              ? "text-white scale-110"
              : "text-white/80 group-hover:text-white group-hover:scale-105"
          }`}
        >
          <FaChartBar />
        </span>
        <span
          className={`text-sm lg:text-base font-medium transition-all duration-300 ${
            pathname === "/dashboard"
              ? "text-white"
              : "text-white/90 group-hover:text-white"
          }`}
        >
          Dashboard
        </span>
      </Link>
    </li>
  );

  if (!user) {
    return (
      <aside className="fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-[#940C25] to-[#940C25] text-white hidden lg:flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">Cargando...</p>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Overlay para móvil */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - siempre fixed */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          w-72 h-screen
          bg-gradient-to-b from-[#940C25] via-[#a10c28] to-[#940C25] 
          text-white flex flex-col shadow-2xl 
          transform transition-transform duration-300 ease-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          overflow-hidden
        `}
      >
        {/* Decoración de fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>

        {/* Header del sidebar */}
        <div className="p-4 lg:p-6 border-b border-white/10 backdrop-blur-sm relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg">
              <FaBuilding className="text-sm lg:text-lg text-white" />
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                MADI
              </h2>
              <p className="text-xs text-white/60">{user.usuario?.nombre}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 lg:p-4 overflow-y-auto relative z-10">
          <ul className="space-y-1">
            <DashboardLink />
            {user.permisos &&
              Object.values(user.permisos)
                .filter((permiso) => permiso.valor > 0)
                .map((permiso) => (
                  <ModuleGroup key={permiso.endpoint} permiso={permiso} />
                ))}
          </ul>
        </nav>

        {/* Footer decorativo */}
        <div className="h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </aside>
    </>
  );
}
