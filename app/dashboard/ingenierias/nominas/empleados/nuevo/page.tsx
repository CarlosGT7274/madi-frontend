"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearEmpleado } from "@/utils/api/nominas";
import { ArrowLeft, Save, User, Briefcase, DollarSign } from "lucide-react";

export default function NuevoEmpleadoPage() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState({
    numero_empleado: "",
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    fecha_nacimiento: "",
    rfc: "",
    curp: "",
    nss: "",
    email: "",
    telefono: "",
    direccion: "",
    puesto_id: "1",
    tipo_contrato: "planta" as "planta" | "temporal" | "honorarios",
    salario_base: "",
    salario_diario: "",
    fecha_ingreso: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));

    // Auto-calcular salario diario
    if (name === "salario_base" && value) {
      const salarioMensual = parseFloat(value);
      const salarioDiario = (salarioMensual / 30).toFixed(2);
      setFormulario(prev => ({ ...prev, salario_diario: salarioDiario }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      await crearEmpleado({
        ...formulario,
        puesto_id: parseInt(formulario.puesto_id),
        salario_base: parseFloat(formulario.salario_base),
        salario_diario: parseFloat(formulario.salario_diario)
      });

      alert("Empleado creado exitosamente");
      router.push("/dashboard/ingenierias/nominas/empleados");
    } catch (error: any) {
      console.error("Error al crear empleado:", error);
      alert(error?.response?.data?.message || "Error al crear empleado");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nuevo Empleado</h1>
              <p className="text-gray-500 mt-1">Registra un nuevo empleado</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Info Personal */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="text-blue-600" size={24} />
              Información Personal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Empleado <span className="text-red-500">*</span>
                </label>
                <input type="text" name="numero_empleado" value={formulario.numero_empleado} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre(s) <span className="text-red-500">*</span>
                </label>
                <input type="text" name="nombre" value={formulario.nombre} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Apellido Paterno <span className="text-red-500">*</span></label>
                <input type="text" name="apellido_paterno" value={formulario.apellido_paterno} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Apellido Materno <span className="text-red-500">*</span></label>
                <input type="text" name="apellido_materno" value={formulario.apellido_materno} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento</label>
                <input type="date" name="fecha_nacimiento" value={formulario.fecha_nacimiento} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RFC</label>
                <input type="text" name="rfc" value={formulario.rfc} onChange={handleChange} maxLength={13}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CURP</label>
                <input type="text" name="curp" value={formulario.curp} onChange={handleChange} maxLength={18}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">NSS</label>
                <input type="text" name="nss" value={formulario.nss} onChange={handleChange} maxLength={11}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (opcional)</label>
                <input type="email" name="email" value={formulario.email} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <input type="tel" name="telefono" value={formulario.telefono} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                <textarea name="direccion" value={formulario.direccion} onChange={handleChange} rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Info Laboral */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Briefcase className="text-green-600" size={24} />
              Información Laboral
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Puesto <span className="text-red-500">*</span></label>
                <select name="puesto_id" value={formulario.puesto_id} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="1">Supervisor</option>
                  <option value="2">Obrero</option>
                  <option value="3">Ingeniero</option>
                  <option value="4">Técnico</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Contrato <span className="text-red-500">*</span></label>
                <select name="tipo_contrato" value={formulario.tipo_contrato} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="planta">Planta</option>
                  <option value="temporal">Temporal</option>
                  <option value="honorarios">Honorarios</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salario Mensual <span className="text-red-500">*</span></label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input type="number" name="salario_base" value={formulario.salario_base} onChange={handleChange} step="0.01" required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salario Diario (auto)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input type="number" name="salario_diario" value={formulario.salario_diario} onChange={handleChange} step="0.01" readOnly
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Ingreso <span className="text-red-500">*</span></label>
                <input type="date" name="fecha_ingreso" value={formulario.fecha_ingreso} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 justify-end">
            <button type="button" onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50">
              <Save size={20} />
              {guardando ? "Guardando..." : "Guardar Empleado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
