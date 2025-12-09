// app/dashboard/layout.tsx
"use client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "@/components/ProtectedRoute";
import { NotificationProvider } from "@/context/NotificationContext";
import { SidebarProvider } from "@/context/SidebarContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    setDateTime(format(new Date(), "dd/MM/yyyy HH:mm"));
    
    const interval = setInterval(() => {
      setDateTime(format(new Date(), "dd/MM/yyyy HH:mm"));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <ProtectedRoute>
      <NotificationProvider>
        <SidebarProvider>
          <div className="flex h-screen bg-gray-50">
            {/* Spacer - solo ocupa espacio en desktop */}
            <div className="hidden lg:block w-72 flex-shrink-0" />
            
            {/* Sidebar - siempre fixed, se posiciona sobre el spacer en desktop */}
            <Sidebar />
            
            {/* Columna principal - flex-1 siempre */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
              <Header dateTime={dateTime} />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
            
            <ToastContainer position="top-right" autoClose={5000} />
          </div>
        </SidebarProvider>
      </NotificationProvider>
    </ProtectedRoute>
  );
}
