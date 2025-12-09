// context/NotificationContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { toast, ToastContent, ToastOptions } from "react-toastify";
import { useRouter } from "next/navigation";
import {
  obtenerNotificacionesPorArea,
  marcarNotificacionComoLeida,
} from "@/utils/api/notificacion";
import { useAuth } from "./AuthContext";

export interface Notificacion {
  id: number;
  mensaje: string;
  destino: string;
  modulo: string;
  leida: boolean;
  fecha: string;
  fechaFormateada: string;
  relacion_id?: number; // ID genérico (requisicion, asignacion, compra, etc.)
  tipo_entidad?: string; // Tipo de entidad ('requisicion', 'asignacion', 'compra', 'inventario')
}

interface NotificationContextType {
  notifications: Notificacion[];
  unreadCount: number;
  loading: boolean;
  showNotification: (message: ToastContent, options?: ToastOptions) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  handleNotificationClick: (notificacion: Notificacion) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.leida).length;

  // Función para reproducir sonido de notificación
  const playNotificationSound = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const audio = new Audio("/notificacion.mp3");
        audio.play().catch(() => {});
      } catch {}
    }
  }, []);

  // Función para mostrar notificación toast
  const showNotification = useCallback(
    (message: ToastContent, options?: ToastOptions) => {
      toast(message, options);
    },
    [],
  );

  // Función para obtener notificaciones
  const fetchNotifications = useCallback(async () => {
    // Opción A: Si necesitas el área, pero no está en la interfaz actual
    // Podrías usar el rol.nombre como área temporal
    if (!user?.usuario?.rol?.nombre) return;
    
    // Opción B: Si la API espera un área específica, mapea el rol a un área
    const areaMap: Record<string, string> = {
      'admin': 'administracion',
      'almacen': 'almacen',
      'compras': 'compras',
      'ingenierias': 'ingenierias',
      'seguridad': 'seguridad'
      // Agrega más mapeos según tus roles
    };
    
    const area = areaMap[user.usuario.rol.nombre.toLowerCase()] || user.usuario.rol.nombre;

    try {
      setLoading(true);
      const notifs = await obtenerNotificacionesPorArea(area);
      setNotifications(notifs || []);

      // Mostrar toast si hay nuevas notificaciones
      const newUnreadCount = (notifs || []).filter((n: Notificacion) => !n.leida).length;
      // const newUnreadCount = (notifs || []).filter((n) => !n.leida).length;
      if (newUnreadCount > unreadCount) {
        showNotification("¡Tienes nuevas notificaciones! 🔔", { type: "info" });
        playNotificationSound();
      }
    } catch (error) {
      console.error("Error obteniendo notificaciones:", error);
      showNotification("Error al cargar notificaciones", { type: "error" });
    } finally {
      setLoading(false);
    }
  }, [user, unreadCount, showNotification, playNotificationSound]);

  // Función para marcar notificación como leída
  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await marcarNotificacionComoLeida(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
        );
      } catch (error) {
        console.error("Error marcando notificación como leída:", error);
        showNotification("Error al marcar notificación", { type: "error" });
      }
    },
    [showNotification],
  );

  // Función para manejar clic en notificación - ¡MEJORADA!
  const handleNotificationClick = useCallback(
    async (notificacion: Notificacion) => {
      try {
        // Marcar como leída primero
        if (!notificacion.leida) {
          await markAsRead(notificacion.id);
        }

        // Navegación inteligente basada en tipo_entidad y relacion_id
        if (notificacion.relacion_id && notificacion.tipo_entidad) {
          // Redirección ESPECÍFICA a la entidad concreta
          switch (notificacion.tipo_entidad.toLowerCase()) {
            case "requisicion":
              router.push(
                `/dashboard/requisiciones/requisiciones/${notificacion.relacion_id}`,
              );
              break;

            case "asignacion":
              router.push(
                `/dashboard/almacen/asignacion-herramientas/${notificacion.relacion_id}`,
              );
              break;

            case "compra":
              router.push(`/dashboard/compras/${notificacion.relacion_id}`);
              break;

            case "inventario":
              router.push(
                `/dashboard/almacen/inventario/${notificacion.relacion_id}`,
              );
              break;

            case "herramienta":
              router.push(
                `/dashboard/almacen/herramientas/${notificacion.relacion_id}`,
              );
              break;

            case "manual":
              router.push(
                `/dashboard/almacen/manuales/${notificacion.relacion_id}`,
              );
              break;

            default:
              // Para tipos de entidad no especificados, redirigir al módulo
              router.push(`/dashboard/${notificacion.modulo.toLowerCase()}`);
          }
        } else {
          // Redirección GENERAL por módulo (notificaciones sin entidad específica)
          switch (notificacion.modulo.toLowerCase()) {
            case "requisiciones":
              router.push("/dashboard/requisiciones");
              break;

            case "compras":
              router.push("/dashboard/compras");
              break;

            case "inventario":
              router.push("/dashboard/almacen/inventario");
              break;

            case "herramientas":
              router.push("/dashboard/almacen/herramientas");
              break;

            case "asignacion":
            case "asignacion-herramientas":
              router.push("/dashboard/almacen/asignacion-herramientas");
              break;

            case "manuales":
              router.push("/dashboard/almacen/manuales");
              break;

            case "administracion":
              router.push("/dashboard/administracion");
              break;

            case "ingenierias":
              router.push("/dashboard/ingenierias");
              break;

            case "seguridad":
              router.push("/dashboard/seguridad");
              break;

            default:
              router.push("/dashboard");
          }
        }
      } catch (error) {
        console.error("Error al manejar clic en notificación:", error);
        showNotification("Error al procesar la notificación", {
          type: "error",
        });
      }
    },
    [markAsRead, router, showNotification],
  );

  // Función para marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.leida).map((n) => n.id);
      await Promise.all(unreadIds.map((id) => marcarNotificacionComoLeida(id)));

      setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
      showNotification("Todas las notificaciones marcadas como leídas", {
        type: "success",
      });
    } catch (error) {
      console.error("Error marcando notificaciones como leídas:", error);
      showNotification("Error al marcar notificaciones", { type: "error" });
    }
  }, [notifications, showNotification]);

  // Efecto para cargar notificaciones al iniciar y cuando cambia el usuario
  useEffect(() => {
    if (!user) return;

    fetchNotifications();
  }, [user, fetchNotifications]);

  // Efecto para actualizar notificaciones cada 30 segundos
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    showNotification,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    handleNotificationClick,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications debe ser usado dentro de un NotificationProvider",
    );
  }
  return context;
};
