"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { obtenerPlaneaciones } from "@/utils/api/planeacion";
import { usersAll } from "@/utils/api/users";
import {
  ArrowLeft,
  Calculator,
  Save,
  Users,
  Clock,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle
} from "lucide-react";

interface EmpleadoHoras {
  empleado_id: number;
  empleado_nombre: string;
  puesto?: string;
  precio_hora: number;
  horas_normales: number;
  horas_extra: number;
  total_horas: number;
  pago_normal: number;
  pago_extra: number;
  total_percepciones: number;
  deducciones: number;
  neto: number;
}

export default function CalcularNominaDesdePlaneacionPage() {
  const params = useParams();
  const router = useRouter();
  const periodoId = parseInt(params.periodoId as string);

  const [cargando, setcargando] = useState(true);
  const [empleadosHoras, setEmpleadosHoras] = useState<EmpleadoHoras[]>([]);
  const [semana, setSemana] = useState(48);
  const [anio, setAnio] = useState(2025);

  // Constantes
  const HORAS_NORMALES_SEMANA = 48; // 8 horas x 6 días
  const MULTIPLICADOR_EXTRA = 1.5; // Horas extra pagan 50% más
  const PORCENTAJE_IMSS = 0.06; // 6%
  const PORCENTAJE_ISR = 0.10; // 10%

  useEffect(() => {
    cargarDatosPlaneacion();
  }, [semana, anio]);

  const cargarDatosPlaneacion = async () => {
    try {
      setcargando(true);

      // 1. Obtener planeaciones aprobadas de la semana
      const planeaciones = await obtenerPlaneaciones({
        semana,
        anio,
        estado: "aprobada"
      });

      // 2. Obtener todos los empleados
      const usuarios = await usersAll();

      // 3. Agregar las horas por empleado
      const horasPorEmpleado: Map<number, { nombre: string; horas: number; puesto?: string; precio_hora?: number }> = new Map();

      planeaciones.forEach((planeacion) => {
        planeacion.asignaciones?.forEach((asignacion) => {
          const empleadoId = asignacion.empleado_id;
          const horasTrabajadas = asignacion.horas_trabajadas || 0;
          const nombreEmpleado = asignacion.empleado_nombre || "Sin nombre";

          // Buscar info del empleado
          const empleado = usuarios.find(u => u.id === empleadoId);

          if (horasPorEmpleado.has(empleadoId)) {
            const actual = horasPorEmpleado.get(empleadoId)!;
            actual.horas += horasTrabajadas;
          } else {
            horasPorEmpleado.set(empleadoId, {
              nombre: nombreEmpleado,
              horas: horasTrabajadas,
              puesto: empleado?.puesto || "N/A",
              precio_hora: empleado?.precio_hora || 150 // Default 150 pesos/hora
            });
          }
        });
      });

      // 4. Calcular nómina
      const datosNomina: EmpleadoHoras[] = [];

      horasPorEmpleado.forEach((data, empleadoId) => {
        const horasNormales = Math.min(data.horas, HORAS_NORMALES_SEMANA);
        const horasExtra = Math.max(0, data.horas - HORAS_NORMALES_SEMANA);

        const pagoNormal = horasNormales * data.precio_hora!;
        const pagoExtra = horasExtra * data.precio_hora! * MULTIPLICADOR_EXTRA;
        const totalPercepciones = pagoNormal + pagoExtra;

        const imss = totalPercepciones * PORCENTAJE_IMSS;
        const isr = totalPercepciones * PORCENTAJE_ISR;
        const totalDeducciones = imss + isr;

        const neto = totalPercepciones - totalDeducciones;

        datosNomina.push({
          empleado_id: empleadoId,
          empleado_nombre: data.nombre,
          puesto: data.puesto,
          precio_hora: data.precio_hora!,
          horas_normales: horasNormales,
          horas_extra: horasExtra,
          total_horas: data.horas,
          pago_normal: pagoNormal,
          pago_extra: pagoExtra,
          total_percepciones: totalPercepciones,
          deducciones: totalDeducciones,
          neto
        });
      });

      setEmpleadosHoras(datosNomina.sort((a, b) => b.total_horas - a.total_horas));
    } catch (error) {
      console.error("Error cargando planeaciones:", error);
    } finally {
      setcargando(false);
    }
  };

  const totales = empleadosHoras.reduce(
    (acc, emp) => ({
      horas: acc.horas + emp.total_horas,
      percepciones: acc.percepciones + emp.total_percepciones,
      deducciones: acc.deducciones + emp.deducciones,
      neto: acc.neto + emp.neto
    }),
    { horas: 0, percepciones: 0, deducciones: 0, neto: 0 }
  );

  const handleGuardar = () => {
    alert(`Nómina guardada para la semana ${semana}/${anio}`);
    router.push("/dashboard/ingenierias/nominas/periodos");
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Calculator className="animate-spin mx-auto text-blue-600 mb-4" size={48} />
          <p className="text-gray-600">Calculando nómina desde planeaciones...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">
                Nómina desde Planeaciones
              </h1>
              <p className="text-gray-500 mt-1">
                Calculando horas trabajadas de planeaciones aprobadas
              </p>
            </div>
            <button
              onClick={handleGuardar}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition-all"
            >
              <Save size={20} />
              Guardar Nómina
            </button>
          </div>

          {/* Selector de Semana */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semana
              </label>
              <input
                type="number"
                value={semana}
                onChange={(e) => setSemana(parseInt(e.target.value))}
                min={1}
                max={52}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año
              </label>
              <input
                type="number"
                value={anio}
                onChange={(e) => setAnio(parseInt(e.target.value))}
                min={2020}
                max={2030}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empleados
              </label>
              <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                  <Users size={24} />
                  {empleadosHoras.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Clock className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Horas</p>
                <p className="text-2xl font-bold text-purple-900">
                  {totales.horas.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Percepciones</p>
                <p className="text-xl font-bold text-green-900">
                  ${totales.percepciones.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <TrendingDown className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Deducciones</p>
                <p className="text-xl font-bold text-red-900">
                  -${totales.deducciones.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Neto Total</p>
                <p className="text-xl font-bold text-blue-900">
                  ${totales.neto.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Empleado
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">
                    $/Hora
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">
                    Hrs Normales
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">
                    Hrs Extra
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">
                    Total Hrs
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">
                    Percepciones
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">
                    Deducciones
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">
                    Neto
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {empleadosHoras.map((emp) => (
                  <tr key={emp.empleado_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {emp.empleado_nombre}
                        </div>
                        <div className="text-xs text-gray-500">{emp.puesto}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-blue-600">
                        ${emp.precio_hora}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900">
                        {emp.horas_normales.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {emp.horas_extra > 0 ? (
                        <span className="text-sm font-semibold text-orange-600">
                          +{emp.horas_extra.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-purple-600">
                        {emp.total_horas.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-semibold text-green-600">
                        ${emp.total_percepciones.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </div>
                      {emp.horas_extra > 0 && (
                        <div className="text-xs text-gray-500">
                          (+${emp.pago_extra.toLocaleString('es-MX', { maximumFractionDigits: 0 })} extra)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-red-600">
                        -${emp.deducciones.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-lg font-bold text-blue-600">
                        ${emp.neto.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-sm font-bold text-gray-900">
                    TOTALES
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-purple-600">
                    {totales.horas.toFixed(1)} hrs
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                    ${totales.percepciones.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-red-600">
                    -${totales.deducciones.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-6 py-4 text-right text-lg font-bold text-blue-600">
                    ${totales.neto.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {empleadosHoras.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No hay planeaciones aprobadas
              </h3>
              <p className="text-gray-500">
                No se encontraron planeaciones aprobadas para la semana {semana}/{anio}
              </p>
            </div>
          )}
        </div>

        {/* Leyenda */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <CheckCircle size={20} />
            Información del Cálculo
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>Horas normales:</strong> Hasta {HORAS_NORMALES_SEMANA} horas semanales (8h x 6 días)</li>
            <li>• <strong>Horas extra:</strong> Pagan {MULTIPLICADOR_EXTRA}x ({(MULTIPLICADOR_EXTRA - 1) * 100}% adicional)</li>
            <li>• <strong>IMSS:</strong> {PORCENTAJE_IMSS * 100}% del total</li>
            <li>• <strong>ISR:</strong> {PORCENTAJE_ISR * 100}% del total</li>
            <li>• <strong>Precio por hora:</strong> Configurable por empleado en seguridad/usuarios</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
