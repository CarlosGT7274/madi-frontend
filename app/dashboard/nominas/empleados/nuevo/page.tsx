"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, User, Briefcase, DollarSign, Calendar } from "lucide-react";

interface FormularioEmpleado {
  numero_empleado: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento: string;
  rfc: string;
  curp: string;
  nss: string;
  email: string;
  telefono: string;
  direccion: string;
  puesto_id: string;
  tipo_contrato: string;
  salario_base: string;
  salario_diario: string;
  fecha_ingreso: string;
}

export default function NuevoEmpleadoPage() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState<FormularioEmpleado>({
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
    puesto_id: "",
    tipo_contrato: "planta",
    salario_base: "",
    salario_diario: "",
    fecha_ingreso: new Date().toISOString().split('T')[0]
  });

  const puestos = [
    { id: 1, nombre: "Supervisor", salario_base: 25500, color: "#3b82f6" },
    { id: 2, nombre: "Obrero", salario_base: 13500, color: "#10b981" },
    { id: 3, nombre: "Ingeniero", salario_base: 36000, color: "#8b5cf6" },
    { id: 4, nombre: "Técnico", salario_base: 18000, color: "#f59e0b" },
    { id: 5, nombre: "Administrativo", salario_base: 15000, color: "#ec4899" }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calcular salario diario cuando cambia el salario base
    if (name === "salario_base" && value) {
      const salarioMensual = parseFloat(value);
      const salarioDiario = (salarioMensual / 30).toFixed(2);
      setFormulario(prev => ({
        ...prev,
        salario_diario: salarioDiario
      }));
    }

    // Auto-llenar salario base cuando se selecciona un puesto
    if (name === "puesto_id" && value) {
      const puesto = puestos.find(p => p.id === parseInt(value));
      if (puesto) {
        setFormulario(prev => ({
          ...prev,
          salario_base: puesto.salario_base.toString(),
          salario_diario: (puesto.salario_base / 30).toFixed(2)
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    // Validaciones básicas
    if (!formulario.nombre || !formulario.apellido_paterno || !formulario.puesto_id) {
      alert("Por favor completa los campos obligatorios");
      setGuardando(false);
      return;
    }

    try {
      // Aquí iría la llamada a la API
      console.log("Guardando empleado:", formulario);

      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert("Empleado creado exitosamente");
      router.push("/dashboard/nominas/empleados");
    } catch (error) {
      console.error("Error al guardar empleado:", error);
      alert("Error al guardar empleado");
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
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nuevo Empleado</h1>
              <p className="text-gray-500 mt-1">
                Registra un nuevo empleado en el sistema
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {/* Información Personal */}
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
                <input
                  type="text"
                  name="numero_empleado"
                  value={formulario.numero_empleado}
                  onChange={handleChange}
                  placeholder="EMP-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre(s) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={handleChange}
                  placeholder="Juan Carlos"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Paterno <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="apellido_paterno"
                  value={formulario.apellido_paterno}
                  onChange={handleChange}
                  placeholder="Pérez"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Materno <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="apellido_materno"
                  value={formulario.apellido_materno}
                  onChange={handleChange}
                  placeholder="García"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={formulario.fecha_nacimiento}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFC
                </label>
                <input
                  type="text"
                  name="rfc"
                  value={formulario.rfc}
                  onChange={handleChange}
                  placeholder="PEPJ850101XXX"
                  maxLength={13}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CURP
                </label>
                <input
                  type="text"
                  name="curp"
                  value={formulario.curp}
                  onChange={handleChange}
                  placeholder="PEPJ850101HDFRRN09"
                  maxLength={18}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NSS (Número de Seguridad Social)
                </label>
                <input
                  type="text"
                  name="nss"
                  value={formulario.nss}
                  onChange={handleChange}
                  placeholder="12345678901"
                  maxLength={11}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formulario.email}
                  onChange={handleChange}
                  placeholder="empleado@empresa.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formulario.telefono}
                  onChange={handleChange}
                  placeholder="1234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <textarea
                  name="direccion"
                  value={formulario.direccion}
                  onChange={handleChange}
                  placeholder="Calle, número, colonia, ciudad, estado, CP"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Información Laboral */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Briefcase className="text-green-600" size={24} />
              Información Laboral
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puesto <span className="text-red-500">*</span>
                </label>
                <select
                  name="puesto_id"
                  value={formulario.puesto_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecciona un puesto</option>
                  {puestos.map(puesto => (
                    <option key={puesto.id} value={puesto.id}>
                      {puesto.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Contrato <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipo_contrato"
                  value={formulario.tipo_contrato}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="planta">Planta</option>
                  <option value="temporal">Temporal</option>
                  <option value="honorarios">Honorarios</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salario Base Mensual <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    name="salario_base"
                    value={formulario.salario_base}
                    onChange={handleChange}
                    placeholder="25500.00"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salario Diario (calculado)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    name="salario_diario"
                    value={formulario.salario_diario}
                    onChange={handleChange}
                    placeholder="850.00"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Ingreso <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="fecha_ingreso"
                  value={formulario.fecha_ingreso}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {guardando ? "Guardando..." : "Guardar Empleado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
