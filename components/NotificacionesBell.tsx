
"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { FaBell, FaCheck, FaExternalLinkAlt } from "react-icons/fa"
import { useNotifications } from "@/context/NotificationContext"

interface NotificacionesBellProps {
  className?: string
}

export default function NotificacionesBell({ className = "" }: NotificacionesBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, handleNotificationClick } = useNotifications()

  // Calcular posición del dropdown
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const scrollY = window.scrollY
      const scrollX = window.scrollX

      setDropdownPosition({
        top: rect.bottom + scrollY + 8, // 8px de margen
        left: rect.right + scrollX - 320, // Alinear a la derecha (320px es el ancho del dropdown)
      })
    }
  }

  // Abrir/cerrar dropdown
  const toggleDropdown = () => {
    if (!isOpen) {
      updateDropdownPosition()
    }
    setIsOpen(!isOpen)
  }

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      window.addEventListener("scroll", updateDropdownPosition)
      window.addEventListener("resize", updateDropdownPosition)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("scroll", updateDropdownPosition)
      window.removeEventListener("resize", updateDropdownPosition)
    }
  }, [isOpen])

  // Componente del dropdown que se renderiza en portal
  const DropdownContent = () => (
    <div
      ref={dropdownRef}
      className="fixed w-80 lg:w-96 bg-white rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden animate-in slide-in-from-top-5 duration-200"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        zIndex: 9999, // Z-index muy alto
        maxWidth: "calc(100vw - 16px)", // Evitar overflow horizontal
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Notificaciones</h3>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Lista de notificaciones */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Cargando...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <FaBell className="text-3xl text-gray-300 mx-auto mb-2" />
            <p>No hay notificaciones</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors group ${
                  !notif.leida ? "bg-blue-50" : ""
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-900">{notif.modulo}</span>
                  <div className="flex items-center gap-2">
                    {!notif.leida && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Nuevo
                      </span>
                    )}
                    <FaExternalLinkAlt className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{notif.mensaje}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">{notif.fechaFormateada}</span>
                  {!notif.leida && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(notif.id)
                      }}
                      className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors"
                    >
                      <FaCheck className="text-xs" />
                      Marcar como leída
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="text-xs text-gray-500 text-center">
            {unreadCount} sin leer de {notifications.length} notificaciones
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Botón de campana */}
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          className="relative p-2 lg:p-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md border border-gray-200/50"
          aria-label="Notificaciones"
          aria-expanded={isOpen}
        >
          <FaBell className="text-lg lg:text-xl" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Portal para el dropdown */}
      {isOpen && typeof window !== "undefined" && createPortal(<DropdownContent />, document.body)}
    </>
  )
}

