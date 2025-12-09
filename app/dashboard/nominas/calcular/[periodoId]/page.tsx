"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calculator,
  Save,
  CheckCircle,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Download
} from "lucide-react";

interface NominaEmpleado {
  empleado_id: number;
  empleado_nombre: string;
  empleado_numero: string;
  puesto: string;
  salario_diario: number;
  dias_trabajados: number;
  horas_extra: number;
  salario_base: number;
  pago_horas_extra: number;
  bonos: number;
  total_percepciones: number;
  imss: number;
  isr: number;
  prestamos: number;
  total_deducciones: number;
  neto_pagar: number;
}

export default function CalcularNominaPage() {
  const params = useParams();
  const router = useRouter();
  const periodoId = parseInt(params.periodoId as string);

  const [calculando, setCalculando] = useState(false);
  const [nominasCalculadas, setNominasCalculadas] = useState(false);
  const [nominas, setNominas] = useState<NominaEmpleado[]>([]);

  const [periodo] = useState({
    id: periodoId,
    tipo: "quincenal",
    fecha_inicio: "2025-12-01",
    fecha_fin: "2025-12-15",
    fecha_pago: "2025-12-16",
    dias_periodo: 15
  });

  const empleadosMock: NominaEmpleado[] = [
    {
      empleado_id: 1,
      empleado_nombre: "Juan Carlos Pérez García",
      empleado_numero: "EMP-001",
      puesto: "Supervisor",
      salario_diario: 850.00,
      dias_trabajados: 15,
      horas_extra: 8,
      salario_base: 12750.00,
      pago_horas_extra: 1700.00,
      bonos: 500.00,
      total_percepciones: 14950.00,
      imss: 894.00,
      isr: 1495.00,
      prestamos: 500.00,
      total_deducciones: 2889.00,
      neto_pagar: 12061.00
    },
    {
      empleado_id: 2,
      empleado_nombre: "María Elena Rodríguez López",
      empleado_numero: "EMP-002",
      puesto: "Obrero",
      salario_diario: 450.00,
      dias_trabajados: 15,
      horas_extra: 4,
      salario_base: 6750.00,
      pago_horas_extra: 450.00,
      bonos: 0,
      total_percepciones: 7200.00,
      imss: 432.00,
      isr: 360.00,
      prestamos: 0,
      total_deducciones: 792.00,
      neto_pagar: 6408.00
    },
    {
      empleado_id: 3,
      empleado_nombre: "Pedro Antonio Martínez Hernández",
      empleado_numero: "EMP-003",
      puesto: "Ingeniero",
      salario_diario: 1200.00,
      dias_trabajados: 15,
      horas_extra: 10,
      salario_base: 18000.00,
      pago_horas_extra: 3000.00,
      bonos: 1000.00,
      total_percepciones: 22000.00,
      imss: 1320.00,
      isr: 2640.00,
      prestamos: 0,
      total_deducciones: 3960.00,
      neto_pagar: 18040.00
    }
  ];

  const calcularNominas = () => {
    setCalculando(true);

    // Simular cálculo
    setTimeout(() => {
      setNominas(empleadosMock);
      setNominasCalculadas(true);
      setCalculando(false);
    }, 2000);
  };

  const totales = nominas.reduce((acc, nomina) => ({
    percepciones: acc.percepciones + nomina.total_percepciones,
    deducciones: acc.deducciones + nomina.total_deducciones,
    neto: acc.neto + nomina.neto_pagar
  }), { percepciones: 0, deducciones: 0, neto: 0 });

  const handleGuardar = () => {
    alert("Nóminas guardadas exitosamente");
    router.push("/dashboard/ingenierias/nominas/periodos");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Calcular Nómina</h1>
              <p className="text-gray-500 mt-1">
                Periodo: {new Date(periodo.fecha_inicio).toLocaleDateString('es-MX')} - {new Date(periodo.fecha_fin).toLocaleDateString('es-MX')}
              </p>
            </div>
            {!nominasCalculadas ? (
              <button
                onClick={calcularNominas}
                disabled={calculando}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator size={20} />
                {calculando ? "Calculando..." : "Calcular Nóminas"}
              </button>
            ) : (
              <button
                onClick={handleGuardar}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition-all"
              >
                <Save size={20} />
                Guardar Nóminas
              </button>
            )}
          </div>

          {/* Información del Periodo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium flex items-center gap-2">
                <Users size={16} />
                Empleados
              </p>
              <p className="text-2xl font-bold text-blue-900">{empleadosMock.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Días del Periodo</p>
              <p className="text-2xl font-bold text-purple-900">{periodo.dias_periodo}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Fecha de Pago</p>
              <p className="text-lg font-bold text-yellow-900">
                {new Date(periodo.fecha_pago).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Estado</p>
              <p className="text-lg font-bold text-green-900">
                {nominasCalculadas ? "Calculada" : "Pendiente"}
              </p>
            </div>
          </div>
        </div>

        {/* Resumen Financiero */}
        {nominasCalculadas && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Percepciones</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totales.percepciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-red-100 p-3 rounded-lg">
                  <TrendingDown className="text-red-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Deducciones</p>
                  <p className="text-2xl font-bold text-red-600">
                    -${totales.deducciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <DollarSign className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Neto a Pagar</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${totales.neto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado antes de calcular */}
        {!nominasCalculadas && !calculando && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Calculator className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Listo para calcular
            </h3>
            <p className="text-gray-500 mb-6">
              Haz clic en "Calcular Nóminas" para procesar la nómina de {empleadosMock.length} empleados
            </p>
            <button
              onClick={calcularNominas}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-all inline-flex items-center gap-2"
            >
              <Calculator size={20} />
              Calcular Nóminas
            </button>
          </div>
        )}

        {/* Calculando */}
        {calculando && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="animate-spin mx-auto text-blue-600 mb-4">
              <Calculator size={64} />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Calculando nóminas...
            </h3>
            <p className="text-gray-500">
              Por favor espera mientras procesamos la información
            </p>
          </div>
        )}

        {/* Tabla de Nóminas Calculadas */}
        {nominasCalculadas && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Empleado
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">
                      Días / Hrs Extra
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">
                      Percepciones
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">
                      Deducciones
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">
                      Neto a Pagar
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {nominas.map((nomina) => (
                    <tr key={nomina.empleado_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {nomina.empleado_nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {nomina.empleado_numero} • {nomina.puesto}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            ${nomina.salario_diario.toLocaleString('es-MX')}/día
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {nomina.dias_trabajados} días
                        </div>
                        {nomina.horas_extra > 0 && (
                          <div className="text-xs text-orange-600 font-medium">
                            +{nomina.horas_extra} hrs extra
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-semibold text-green-600">
                          ${nomina.total_percepciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Base: ${nomina.salario_base.toLocaleString('es-MX')}
                          {nomina.pago_horas_extra > 0 && (
                            <> + Extra: ${nomina.pago_horas_extra.toLocaleString('es-MX')}</>
                          )}
                          {nomina.bonos > 0 && (
                            <> + Bonos: ${nomina.bonos.toLocaleString('es-MX')}</>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-semibold text-red-600">
                          -${nomina.total_deducciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          IMSS: ${nomina.imss.toLocaleString('es-MX')} |
                          ISR: ${nomina.isr.toLocaleString('es-MX')}
                          {nomina.prestamos > 0 && (
                            <> | Préstamo: ${nomina.prestamos.toLocaleString('es-MX')}</>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-lg font-bold text-blue-600">
                          ${nomina.neto_pagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-all"
                            title="Ver detalle"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-all"
                            title="Descargar recibo"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-sm font-bold text-gray-900">
                      TOTALES
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                      ${totales.percepciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-red-600">
                      -${totales.deducciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-lg font-bold text-blue-600">
                      ${totales.neto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
