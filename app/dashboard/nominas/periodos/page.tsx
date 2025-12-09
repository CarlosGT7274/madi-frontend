"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Users,
  Calculator,
  FileText
} from "lucide-react";

interface PeriodoNomina {
  id: number;
  tipo: "semanal" | "quincenal" | "mensual";
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string;
  estado: "abierto" | "calculado" | "pagado" | "cerrado";
  total_empleados: number;
  total_percepciones: number;
  total_deducciones: number;
  neto_total: number;
}

export default function PeriodosNominaPage() {
  const router = useRouter();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [periodos, setPeriodos] = useState<PeriodoNomina[]>([
    {
      id: 1,
      tipo: "quincenal",
      fecha_inicio: "2025-12-01",
      fecha_fin: "2025-12-15",
      fecha_pago: "2025-12-16",
      estado: "abierto",
      total_empleados: 42,
      total_percepciones: 0,
      total_deducciones: 0,
      neto_total: 0
    },
    {
      id: 2,
      tipo: "quincenal",
      fecha_inicio: "2025-11-16",
      fecha_fin: "2025-11-30",
      fecha_pago: "2025-12-01",
      estado: "pagado",
      total_empleados: 42,
      total_percepciones: 215340.00,
      total_deducciones: 26019.50,
      neto_total: 189320.50
    },
    {
      id: 3,
      tipo: "quincenal",
      fecha_inicio: "2025-11-01",
      fecha_fin: "2025-11-15",
      fecha_pago: "2025-11-16",
      estado: "pagado",
      total_empleados: 40,
      total_percepciones: 198500.00,
      total_deducciones: 23820.00,
      neto_total: 174680.00
    }
  ]);

  const [nuevoPeriodo, setNuevoPeriodo] = useState({
    tipo: "quincenal" as "semanal" | "quincenal" | "mensual",
    fecha_inicio: "",
    fecha_fin: "",
    fecha_pago: ""
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "abierto":
        return "bg-blue-100 text-blue-800";
      case "calculado":
        return "bg-yellow-100 text-yellow-800";
      case "pagado":
        return "bg-green-100 text-green-800";
      case "cerrado":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEstadoIcono = (estado: string) => {
    switch (estado) {
      case "abierto":
        return <Clock size={16} />;
      case "calculado":
        return <Calculator size={16} />;
      case "pagado":
        return <CheckCircle size={16} />;
      case "cerrado":
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "semanal":
        return "bg-purple-100 text-purple-800";
      case "quincenal":
        return "bg-blue-100 text-blue-800";
      case "mensual":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCrearPeriodo = () => {
    if (!nuevoPeriodo.fecha_inicio || !nuevoPeriodo.fecha_fin || !nuevoPeriodo.fecha_pago) {
      alert("Por favor completa todos los campos");
      return;
    }

    const periodo: PeriodoNomina = {
      id: periodos.length + 1,
      tipo: nuevoPeriodo.tipo,
      fecha_inicio: nuevoPeriodo.fecha_inicio,
      fecha_fin: nuevoPeriodo.fecha_fin,
      fecha_pago: nuevoPeriodo.fecha_pago,
      estado: "abierto",
      total_empleados: 42,
      total_percepciones: 0,
      total_deducciones: 0,
      neto_total: 0
    };

    setPeriodos([periodo, ...periodos]);
    setMostrarModal(false);
    setNuevoPeriodo({
      tipo: "quincenal",
      fecha_inicio: "",
      fecha_fin: "",
      fecha_pago: ""
    });
  };

  const handleCalcularNomina = (periodoId: number) => {
    router.push(`/dashboard/ingenierias/nominas/calcular/${periodoId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Periodos de Nómina</h1>
              <p className="text-gray-500 mt-2">
                Gestiona los periodos de pago y calcula las nóminas
              </p>
            </div>
            <button
              onClick={() => setMostrarModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-all"
            >
              <Plus size={20} />
              Nuevo Periodo
            </button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Abiertos</p>
              <p className="text-2xl font-bold text-blue-900">
                {periodos.filter(p => p.estado === "abierto").length}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Calculados</p>
              <p className="text-2xl font-bold text-yellow-900">
                {periodos.filter(p => p.estado === "calculado").length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Pagados</p>
              <p className="text-2xl font-bold text-green-900">
                {periodos.filter(p => p.estado === "pagado").length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Total Periodos</p>
              <p className="text-2xl font-bold text-purple-900">{periodos.length}</p>
            </div>
          </div>
        </div>

        {/* Lista de Periodos */}
        <div className="space-y-4">
          {periodos.map((periodo) => (
            <div
              key={periodo.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Información del Periodo */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTipoColor(periodo.tipo)}`}>
                      {periodo.tipo.charAt(0).toUpperCase() + periodo.tipo.slice(1)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getEstadoColor(periodo.estado)}`}>
                      {getEstadoIcono(periodo.estado)}
                      {periodo.estado.charAt(0).toUpperCase() + periodo.estado.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Periodo</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(periodo.fecha_inicio).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short'
                        })} - {new Date(periodo.fecha_fin).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Fecha de Pago</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(periodo.fecha_pago).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Empleados</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                        <Users size={16} />
                        {periodo.total_empleados}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información Financiera */}
                <div className="border-l pl-6">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Percepciones</p>
                      <p className="text-sm font-semibold text-green-600">
                        ${periodo.total_percepciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Deducciones</p>
                      <p className="text-sm font-semibold text-red-600">
                        -${periodo.total_deducciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">Neto a Pagar</p>
                      <p className="text-lg font-bold text-gray-900">
                        ${periodo.neto_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2 lg:border-l lg:pl-6">
                  {periodo.estado === "abierto" && (
                    <button
                      onClick={() => handleCalcularNomina(periodo.id)}
                      className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-all text-sm"
                    >
                      <Calculator size={16} />
                      Calcular
                    </button>
                  )}
                  {periodo.estado === "calculado" && (
                    <>
                      <button
                        className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold transition-all text-sm"
                      >
                        <DollarSign size={16} />
                        Pagar
                      </button>
                      <button
                        onClick={() => handleCalcularNomina(periodo.id)}
                        className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-semibold transition-all text-sm"
                      >
                        <Calculator size={16} />
                        Recalcular
                      </button>
                    </>
                  )}
                  {(periodo.estado === "pagado" || periodo.estado === "cerrado") && (
                    <button
                      className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold transition-all text-sm"
                    >
                      <FileText size={16} />
                      Ver Detalle
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal para Crear Periodo */}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={nuevoPeriodo.fecha_inicio}
                    onChange={(e) => setNuevoPeriodo({ ...nuevoPeriodo, fecha_inicio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={nuevoPeriodo.fecha_fin}
                    onChange={(e) => setNuevoPeriodo({ ...nuevoPeriodo, fecha_fin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Pago
                  </label>
                  <input
                    type="date"
                    value={nuevoPeriodo.fecha_pago}
                    onChange={(e) => setNuevoPeriodo({ ...nuevoPeriodo, fecha_pago: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setMostrarModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCrearPeriodo}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-all"
                >
                  Crear Periodo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
