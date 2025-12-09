"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Plus,
  CheckCircle,
  Clock,
  Calculator,
  DollarSign
} from "lucide-react";
import { crearPeriodoNomina } from "@/utils/api/nominas";

// Función para obtener número de semana del año
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
};

// Función para obtener lunes de una semana
const getMondayOfWeek = (year: number, week: number): Date => {
  const jan4 = new Date(year, 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1 + (week - 1) * 7);
  return monday;
};

// Función para obtener domingo de una semana
const getSundayOfWeek = (year: number, week: number): Date => {
  const monday = getMondayOfWeek(year, week);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
};

export default function PeriodosNominaPage() {
  const router = useRouter();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [creando, setCreando] = useState(false);

  const hoy = new Date();
  const añoActual = hoy.getFullYear();
  const semanaActual = getWeekNumber(hoy);

  const [nuevoPeriodo, setNuevoPeriodo] = useState({
    tipo: "semanal" as "semanal" | "quincenal" | "mensual",
    año: añoActual,
    semana: semanaActual
  });

  // Calcular fechas automáticamente
  const fechaInicio = getMondayOfWeek(nuevoPeriodo.año, nuevoPeriodo.semana);
  const fechaFin = getSundayOfWeek(nuevoPeriodo.año, nuevoPeriodo.semana);
  const fechaPago = new Date(fechaFin);
  fechaPago.setDate(fechaPago.getDate() + 1); // Pago el lunes siguiente

  const handleCrearPeriodo = async () => {
    setCreando(true);
    try {
      await crearPeriodoNomina({
        tipo: nuevoPeriodo.tipo,
        fecha_inicio: fechaInicio.toISOString().split('T')[0],
        fecha_fin: fechaFin.toISOString().split('T')[0],
        fecha_pago: fechaPago.toISOString().split('T')[0]
      });

      alert(`Periodo creado: Semana ${nuevoPeriodo.semana}/${nuevoPeriodo.año}`);
      setMostrarModal(false);
    } catch (error: any) {
      console.error("Error:", error);
      alert(error?.response?.data?.message || "Error al crear periodo");
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Periodos de Nómina</h1>
              <p className="text-gray-500 mt-2">
                Periodos semanales automáticos (Lunes a Domingo)
              </p>
            </div>
            <button
              onClick={() => setMostrarModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              <Plus size={20} />
              Nuevo Periodo
            </button>
          </div>

          {/* Info actual */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Semana Actual</p>
              <p className="text-2xl font-bold text-blue-900">
                Semana {semanaActual}
              </p>
              <p className="text-xs text-blue-700 mt-1">{añoActual}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Periodo Actual</p>
              <p className="text-sm font-bold text-green-900">
                {getMondayOfWeek(añoActual, semanaActual).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                {' - '}
                {getSundayOfWeek(añoActual, semanaActual).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Tipo</p>
              <p className="text-lg font-bold text-purple-900">Semanal</p>
              <p className="text-xs text-purple-700">Lunes - Domingo</p>
            </div>
          </div>
        </div>

        {/* Lista de periodos ejemplo */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Periodos Recientes</h2>
          <div className="space-y-3">
            {[semanaActual, semanaActual - 1, semanaActual - 2].map((sem) => {
              const inicio = getMondayOfWeek(añoActual, sem);
              const fin = getSundayOfWeek(añoActual, sem);
              const estaActual = sem === semanaActual;

              return (
                <div
                  key={sem}
                  className={`p-4 rounded-lg border-2 ${
                    estaActual
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  } cursor-pointer transition-all`}
                  onClick={() => router.push(`/dashboard/ingenierias/nominas/calcular-desde-planeacion/${sem}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          estaActual
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          Semana {sem}
                        </span>
                        {estaActual && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            Actual
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        <Calendar size={14} className="inline mr-1" />
                        {inicio.toLocaleDateString('es-MX', { day: '2-digit', month: 'long' })}
                        {' - '}
                        {fin.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/ingenierias/nominas/calcular-desde-planeacion/${sem}`);
                      }}
                    >
                      <Calculator size={16} />
                      Calcular
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Nuevo Periodo de Nómina
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Periodo
                  </label>
                  <select
                    value={nuevoPeriodo.tipo}
                    onChange={(e) => setNuevoPeriodo({ ...nuevoPeriodo, tipo: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="semanal">Semanal (predeterminado)</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Año
                  </label>
                  <input
                    type="number"
                    value={nuevoPeriodo.año}
                    onChange={(e) => setNuevoPeriodo({ ...nuevoPeriodo, año: parseInt(e.target.value) })}
                    min={2020}
                    max={2030}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Semana
                  </label>
                  <input
                    type="number"
                    value={nuevoPeriodo.semana}
                    onChange={(e) => setNuevoPeriodo({ ...nuevoPeriodo, semana: parseInt(e.target.value) })}
                    min={1}
                    max={52}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Preview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 font-semibold mb-2">Vista Previa:</p>
                  <p className="text-xs text-blue-800">
                    <strong>Inicio:</strong> {fechaInicio.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-blue-800 mt-1">
                    <strong>Fin:</strong> {fechaFin.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-blue-800 mt-1">
                    <strong>Pago:</strong> {fechaPago.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setMostrarModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                  disabled={creando}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCrearPeriodo}
                  disabled={creando}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                >
                  {creando ? "Creando..." : "Crear Periodo"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
