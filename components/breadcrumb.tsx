"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  ChevronRight,
  Building2,
  ClipboardList,
  FolderOpen,
  FileText,
  Loader2,
} from "lucide-react";
import {
  obtenerPlantaPorId,
  obtenerLevantamientoPorId,
  obtenerProyectoPorId,
  obtenerCotizacionPorId,
} from "@/utils/api/ing-proyectos";

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

interface BreadcrumbData {
  planta?: { id: number; nombre: string };
  levantamiento?: { id: number; nombre: string };
  proyecto?: { id: number; nombre: string };
  cotizacion?: { id: number; folio: string };
}

export function useGoBackOneSegment() {
  const router = useRouter();
  const pathname = usePathname();

  const goBackOne = () => {
    const parts = pathname.split("/").filter(Boolean);
    parts.pop();
    const newPath = "/" + parts.join("/");
    router.push(newPath || "/");
  };

  return goBackOne;
}

export const Breadcrumb = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [items, setItems] = useState<BreadcrumbItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBreadcrumbData = async () => {
      setIsLoading(true);

      // Parsear la ruta
      const segments = pathname.split("/").filter(Boolean);

      // Verificar si estamos en la ruta correcta: /dashboard/ingenierias/proyectos
      if (
        segments.length < 3 ||
        segments[0] !== "dashboard" ||
        segments[1] !== "ingenierias" ||
        segments[2] !== "proyectos"
      ) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      const breadcrumbItems: BreadcrumbItem[] = [
        {
          label: "Proyectos",
          href: "/dashboard/ingenierias/proyectos",
          icon: <Home size={16} />,
        },
      ];

      try {
        const data: BreadcrumbData = {};

        // Identificar qué segmentos tenemos después de /dashboard/ingenierias/proyectos
        // segments[3] = plantaId
        // segments[4] = levantamientoId
        // segments[5] = proyectoId
        // segments[6] = cotizacionId

        const plantaId = segments[3];
        const levantamientoId = segments[4];
        const proyectoId = segments[5];
        const cotizacionId = segments[6];

        // Cargar Planta
        if (plantaId && !isNaN(Number(plantaId))) {
          try {
            const plantaData = await obtenerPlantaPorId(Number(plantaId));
            data.planta = plantaData;
            breadcrumbItems.push({
              label: data.planta?.nombre || "Planta",
              href: `/dashboard/ingenierias/proyectos/${plantaId}`,
              icon: <Building2 size={16} />,
            });
          } catch (error) {
            console.error("Error cargando planta:", error);
          }
        }

        // Cargar Levantamiento
        if (levantamientoId && !isNaN(Number(levantamientoId))) {
          try {
            const levData = await obtenerLevantamientoPorId(Number(levantamientoId));
            data.levantamiento = levData;
            breadcrumbItems.push({
              label: data.levantamiento?.nombre || "Levantamiento",
              href: `/dashboard/ingenierias/proyectos/${plantaId}/${levantamientoId}`,
              icon: <ClipboardList size={16} />,
            });
          } catch (error) {
            console.error("Error cargando levantamiento:", error);
          }
        }

        // Cargar Proyecto
        if (proyectoId && !isNaN(Number(proyectoId))) {
          try {
            const proyData = await obtenerProyectoPorId(Number(proyectoId));
            data.proyecto = proyData;
            breadcrumbItems.push({
              label: data.proyecto?.nombre || "Proyecto",
              href: `/dashboard/ingenierias/proyectos/${plantaId}/${levantamientoId}/${proyectoId}`,
              icon: <FolderOpen size={16} />,
            });
          } catch (error) {
            console.error("Error cargando proyecto:", error);
          }
        }

        // Cargar Cotización
        if (
          cotizacionId &&
          !isNaN(Number(cotizacionId)) &&
          !segments.includes("explosion-insumos") &&
          !segments.includes("orden-compra")
        ) {
          try {
            const cotData = await obtenerCotizacionPorId(Number(cotizacionId));
            data.cotizacion = cotData;
            breadcrumbItems.push({
              label: data.cotizacion?.folio || "Cotización",
              href: `/dashboard/ingenierias/proyectos/${plantaId}/${levantamientoId}/${proyectoId}/${cotizacionId}`,
              icon: <FileText size={16} />,
            });
          } catch (error) {
            console.error("Error cargando cotización:", error);
          }
        }

        // Manejar rutas especiales
        if (segments.includes("explosion-insumos")) {
          breadcrumbItems.push({
            label: "Explosión de Insumos",
            href: pathname,
            icon: <FileText size={16} />,
          });
        } else if (segments.includes("orden-compra")) {
          breadcrumbItems.push({
            label: "Orden de Compra",
            href: pathname,
            icon: <FileText size={16} />,
          });
        }

        setItems(breadcrumbItems);
      } catch (error) {
        console.error("Error cargando breadcrumb:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBreadcrumbData();
  }, [pathname]);

  // No mostrar nada si estamos en la página principal de proyectos
  if (pathname === "/dashboard/ingenierias/proyectos" || items.length === 0) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14">
          {isLoading ? (
            // Skeleton loading
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  {i < 3 && (
                    <ChevronRight size={16} className="text-gray-300" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <ol className="flex items-center gap-1 text-sm overflow-x-auto scrollbar-hide">
              {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const isFirst = index === 0;
                return (
                  <li
                    key={item.href}
                    className="flex items-center gap-1 flex-shrink-0"
                  >
                    {!isFirst && (
                      <ChevronRight
                        size={16}
                        className="text-gray-400 flex-shrink-0 mx-1"
                      />
                    )}
                    <button
                      onClick={() => !isLast && router.push(item.href)}
                      disabled={isLast}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group ${
                        isLast
                          ? "text-gray-900 font-semibold bg-gray-50 cursor-default"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                      }`}
                      title={item.label}
                    >
                      {item.isLoading ? (
                        <Loader2
                          size={16}
                          className="animate-spin text-gray-400"
                        />
                      ) : (
                        <span
                          className={`transition-colors duration-200 ${
                            isLast
                              ? "text-blue-600"
                              : "text-gray-500 group-hover:text-blue-600"
                          }`}
                        >
                          {item.icon}
                        </span>
                      )}
                      <span className="whitespace-nowrap max-w-[200px] truncate">
                        {item.label}
                      </span>
                      {!isLast && (
                        <span className="w-0 group-hover:w-4 overflow-hidden transition-all duration-200 text-blue-600">
                          →
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </nav>
  );
};
