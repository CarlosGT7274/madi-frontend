// components/planeacion/GestionActividades.tsx
'use client';

import { useState } from 'react';
import { diasSemana, getDiaNombre } from '@/utils/api/planeacion';
import { Actividad, DiaSemana } from '@/types/planeacion';

interface GestionActividadesProps {
  proyectoSemanaId: string;
  actividades: Actividad[];
  onCrear: (actividad: Omit<Actividad, 'id' | 'fechaCreacion'>) => void;
  onEditar: (id: string, data: Partial<Actividad>) => void;
  onEliminar: (id: string) => void;
}

// Definir interfaz específica para el formulario
interface FormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  duracionHoras: number;
  avancePlaneado: number;
  avanceReal: number;
  prioridad: 'alta' | 'media' | 'baja';
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'pausada' | 'cancelada';
  requiereMaquinaria: boolean;
  requiereMaterial: boolean;
  notas: string;
  orden: number;
}

export default function GestionActividades({
  proyectoSemanaId,
  actividades,
  onCrear,
  onEditar,
  onEliminar,
}: GestionActividadesProps) {

  const [modoEdicion, setModoEdicion] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    codigo: '',
    nombre: '',
    descripcion: '',
    diaSemana: 'lunes',
    horaInicio: '',
    horaFin: '',
    duracionHoras: 0,
    avancePlaneado: 0,
    avanceReal: 0,
    prioridad: 'media',
    estado: 'pendiente',
    requiereMaquinaria: false,
    requiereMaterial: false,
    notas: '',
    orden: 0,
  });

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      diaSemana: 'lunes',
      horaInicio: '',
      horaFin: '',
      duracionHoras: 0,
      avancePlaneado: 0,
      avanceReal: 0,
      prioridad: 'media',
      estado: 'pendiente',
      requiereMaquinaria: false,
      requiereMaterial: false,
      notas: '',
      orden: actividades.length,
    });
  };

  const handleNueva = () => {
    resetForm();
    setModoEdicion(null);
    setMostrarFormulario(true);
  };

  const handleEditar = (actividad: Actividad) => {
    setFormData({
      codigo: actividad.codigo,
      nombre: actividad.nombre,
      descripcion: actividad.descripcion || '',
      diaSemana: actividad.diaSemana,
      horaInicio: actividad.horaInicio || '',
      horaFin: actividad.horaFin || '',
      duracionHoras: actividad.duracionHoras || 0,
      avancePlaneado: actividad.avancePlaneado ?? 0,
      avanceReal: actividad.avanceReal ?? 0,
      prioridad: actividad.prioridad ?? 'media',
      estado: actividad.estado ?? 'pendiente',
      requiereMaquinaria: actividad.requiereMaquinaria ?? false,
      requiereMaterial: actividad.requiereMaterial ?? false,
      notas: actividad.notas || '',
      orden: actividad.orden ?? 0,
    });
    setModoEdicion(actividad.id?.toString() ?? null);
    setMostrarFormulario(true);
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();

    if (modoEdicion) {
      onEditar(modoEdicion, formData);
    } else {
      onCrear({
        proyectoSemanaId,
        partidaId: undefined,
        ...formData,
      });
    }

    setMostrarFormulario(false);
    setModoEdicion(null);
    resetForm();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setModoEdicion(null);
    resetForm();
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Eliminar esta actividad y todas sus asignaciones?')) {
      onEliminar(id);
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    const colores: Record<string, string> = {
      alta: 'text-red-600 bg-red-50',
      media: 'text-yellow-600 bg-yellow-50',
      baja: 'text-green-600 bg-green-50',
    };
    return colores[prioridad] || 'text-gray-600 bg-gray-50';
  };

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, string> = {
      pendiente: 'text-gray-600 bg-gray-50',
      en_proceso: 'text-blue-600 bg-blue-50',
      completada: 'text-green-600 bg-green-50',
      pausada: 'text-orange-600 bg-orange-50',
      cancelada: 'text-red-600 bg-red-50',
    };
    return colores[estado] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Actividades</h2>
          <p className="text-gray-600 mt-1">
            Crea y administra las actividades de la semana
          </p>
        </div>
        {!mostrarFormulario && (
          <button
            onClick={handleNueva}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Actividad
          </button>
        )}
      </div>

      {/* Formulario */}
      {mostrarFormulario && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4">
            {modoEdicion ? '✏️ Editar Actividad' : '➕ Nueva Actividad'}
          </h3>

          <form onSubmit={handleGuardar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Código */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ACT-001"
                  required
                />
              </div>

              {/* Día */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Día Principal *
                </label>
                <select
                  value={formData.diaSemana}
                  onChange={(e) => setFormData({ ...formData, diaSemana: e.target.value as DiaSemana })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {diasSemana.map((dia) => (
                    <option key={dia} value={dia}>
                      {getDiaNombre(dia)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prioridad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <select
                  value={formData.prioridad}
                  onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as 'alta' | 'media' | 'baja' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="alta">🔴 Alta</option>
                  <option value="media">🟡 Media</option>
                  <option value="baja">🟢 Baja</option>
                </select>
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Actividad *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Instalación de muebles"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción detallada..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Horario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  value={formData.horaInicio}
                  onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora Fin
                </label>
                <input
                  type="time"
                  value={formData.horaFin}
                  onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as FormData['estado'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="completada">Completada</option>
                  <option value="pausada">Pausada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              {/* Avance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avance Real (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.avanceReal}
                  onChange={(e) => setFormData({ ...formData, avanceReal: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex gap-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.requiereMaquinaria}
                  onChange={(e) => setFormData({ ...formData, requiereMaquinaria: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Requiere Maquinaria</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.requiereMaterial}
                  onChange={(e) => setFormData({ ...formData, requiereMaterial: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Requiere Material</span>
              </label>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelar}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {modoEdicion ? 'Guardar Cambios' : 'Crear Actividad'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de Actividades */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Código</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actividad</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Día</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Horario</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Prioridad</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Estado</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Avance</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {actividades.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-lg">No hay actividades creadas</p>
                  <p className="text-sm mt-2">Haz clic en &quot;Nueva Actividad&quot; para crear una</p>
                </td>
              </tr>
            ) : (
              actividades.map((actividad) => (
                <tr key={actividad.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {actividad.codigo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{actividad.nombre}</div>
                    {actividad.descripcion && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {actividad.descripcion}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      {actividad.requiereMaquinaria && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                          🏗️ Maquinaria
                        </span>
                      )}
                      {actividad.requiereMaterial && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          📦 Material
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-gray-700">
                      {getDiaNombre(actividad.diaSemana)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {actividad.horaInicio && actividad.horaFin ? (
                      <span>{actividad.horaInicio} - {actividad.horaFin}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPrioridadColor(actividad.prioridad ?? 'media')}`}>
                      {(actividad.prioridad ?? 'media').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(actividad.estado ?? 'pendiente')}`}>
                      {(actividad.estado ?? 'pendiente').replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${actividad.estado === 'completada' ? 'bg-green-500' :
                            actividad.estado === 'en_proceso' ? 'bg-blue-500' :
                              'bg-gray-400'
                            }`}
                          style={{ width: `${actividad.avanceReal}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 min-w-[40px]">
                        {actividad.avanceReal}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEditar(actividad)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => actividad.id && handleEliminar(actividad.id.toString())}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Estadísticas */}
      {actividades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Actividades</div>
            <div className="text-2xl font-bold text-gray-900">{actividades.length}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-700 mb-1">Completadas</div>
            <div className="text-2xl font-bold text-green-900">
              {actividades.filter(a => a.estado === 'completada').length}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-700 mb-1">En Proceso</div>
            <div className="text-2xl font-bold text-blue-900">
              {actividades.filter(a => a.estado === 'en_proceso').length}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Avance Promedio</div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(
                actividades.reduce((sum, a) => sum + (a.avanceReal ?? 0), 0) / actividades.length
              )}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
