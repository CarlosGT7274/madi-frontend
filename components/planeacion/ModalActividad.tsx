// // components/planeacion/CalendarioSemanalExcel.tsx - VERSIÓN CON TODO
// 'use client';
//
// import { useState } from 'react';
// import Image from 'next/image';
// import { 
//   diasSemana,
//   getDiaNombre,
//   getFechaDelDia 
// } from '@/utils/api/planeacion';
// import ModalActividad from './ModalActividad';
// import type { Actividad, AsignacionEmpleado, DiaSemana } from '@/types/planeacion';
//
// interface EmpleadoInfo {
//   id: string;
//   nombre: string;
// }
//
// interface CalendarioSemanalExcelProps {
//   semana: {
//     nombre: string;
//     fechaInicio: string;
//     fechaFin: string;
//   };
//   planta: {
//     nombre: string;
//   };
//   responsable: string;
//   proyectoSemanaId: string;
//   actividades: Actividad[];
//   asignaciones: AsignacionEmpleado[];
//   empleados: EmpleadoInfo[];
//   onCrearActividad?: (actividad: Omit<Actividad, 'id' | 'fechaCreacion'>) => void;
//   onEditarActividad?: (id: string, data: Partial<Actividad>) => void;
//   onEliminarActividad?: (id: string) => void;
//   onAsignarEmpleado?: (actividadId: string, empleadoId: string, dia: DiaSemana) => void;
//   onRemoverEmpleado?: (asignacionId: string) => void;
// }
//
// export default function CalendarioSemanalExcel({
//   semana,
//   planta,
//   responsable,
//   proyectoSemanaId,
//   actividades,
//   asignaciones,
//   empleados,
//   onCrearActividad,
//   onEditarActividad,
//   onEliminarActividad,
//   onAsignarEmpleado,
//   onRemoverEmpleado,
// }: CalendarioSemanalExcelProps) {
//
//   const [draggedEmpleado, setDraggedEmpleado] = useState<string | null>(null);
//   const [modalActividadOpen, setModalActividadOpen] = useState(false);
//   const [actividadEditar, setActividadEditar] = useState<Actividad | null>(null);
//
//   const getEmpleadosEnCelda = (actividadId: string, dia: DiaSemana) => {
//     return asignaciones
//       .filter(a => a.actividadId === actividadId && a.diaSemana === dia)
//       .map(a => {
//         const emp = empleados.find(e => e.id === a.empleadoId);
//         return emp ? { ...emp, asignacionId: a.id } : null;
//       })
//       .filter(e => e !== null) as (EmpleadoInfo & { asignacionId: string })[];
//   };
//
//   const getColorPrioridad = (prioridad: string): string => {
//     const colores: Record<string, string> = {
//       alta: 'bg-red-500',
//       media: 'bg-yellow-500',
//       baja: 'bg-green-500',
//     };
//     return colores[prioridad] || 'bg-gray-500';
//   };
//
//   const handleDragStart = (e: React.DragEvent, empleadoId: string) => {
//     e.dataTransfer.effectAllowed = 'move';
//     setDraggedEmpleado(empleadoId);
//   };
//
//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.dataTransfer.dropEffect = 'move';
//   };
//
//   const handleDrop = (e: React.DragEvent, actividadId: string, dia: DiaSemana) => {
//     e.preventDefault();
//     if (draggedEmpleado && onAsignarEmpleado) {
//       onAsignarEmpleado(actividadId, draggedEmpleado, dia);
//     }
//     setDraggedEmpleado(null);
//   };
//
//   const handleEliminarActividad = (id: string) => {
//     if (confirm('¿Eliminar esta actividad y todas sus asignaciones?')) {
//       onEliminarActividad?.(id);
//     }
//   };
//
//   const handleEditarActividad = (actividad: Actividad) => {
//     setActividadEditar(actividad);
//     setModalActividadOpen(true);
//   };
//
//   const handleGuardarActividad = (data: Omit<Actividad, 'id' | 'fechaCreacion'>) => {
//     if (actividadEditar) {
//       onEditarActividad?.(actividadEditar.id, data);
//     } else {
//       onCrearActividad?.(data);
//     }
//     setActividadEditar(null);
//   };
//
//   const formatFechaRango = () => {
//     const inicio = new Date(semana.fechaInicio);
//     const fin = new Date(semana.fechaFin);
//     return `${inicio.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).toUpperCase()} AL ${fin.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}`;
//   };
//
//   return (
//     <div className="bg-white rounded-lg shadow-lg overflow-hidden">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-6">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <Image 
//               src="/Logo.png" 
//               alt="MADI" 
//               width={48}
//               height={48}
//               className="h-12 w-12"
//             />
//             <div>
//               <h1 className="text-2xl font-bold">GRUPO INDUSTRIAL EN MANUFACTURA Y CONSTRUCCIÓN MADI</h1>
//               <div className="flex gap-6 mt-2 text-sm">
//                 <span>Planta: <strong className="bg-blue-600 px-3 py-1 rounded">{planta.nombre}</strong></span>
//                 <span>Responsable: <strong>{responsable}</strong></span>
//               </div>
//             </div>
//           </div>
//           <div className="text-right">
//             <div className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold">
//               {semana.nombre}
//             </div>
//             <div className="text-xs mt-1">{formatFechaRango()}</div>
//           </div>
//         </div>
//       </div>
//
//       {/* Botón Agregar Actividad */}
//       <div className="p-4 bg-gray-50 border-b border-gray-300">
//         <button
//           onClick={() => {
//             setActividadEditar(null);
//             setModalActividadOpen(true);
//           }}
//           className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
//         >
//           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//           </svg>
//           Agregar Actividad
//         </button>
//       </div>
//
//       {/* Tabla */}
//       <div className="overflow-x-auto">
//         <table className="w-full border-collapse">
//           <thead>
//             <tr className="bg-red-600 text-white">
//               <th className="border border-gray-400 px-4 py-3 text-left font-bold w-80">
//                 Actividades
//               </th>
//               {diasSemana.map((dia) => (
//                 <th key={dia} className="border border-gray-400 px-4 py-3 text-center font-bold min-w-[200px]">
//                   <div>{getDiaNombre(dia)}</div>
//                   <div className="text-xs font-normal mt-1">
//                     {new Date(getFechaDelDia(semana.fechaInicio, dia)).toLocaleDateString('es-MX', {
//                       day: '2-digit',
//                       month: 'short'
//                     })}
//                   </div>
//                 </th>
//               ))}
//               <th className="border border-gray-400 px-4 py-3 text-center font-bold">
//                 Domingo
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             {actividades.length === 0 ? (
//               <tr>
//                 <td colSpan={8} className="border border-gray-300 px-4 py-12 text-center text-gray-500">
//                   <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//                   </svg>
//                   <p className="text-lg">No hay actividades planeadas</p>
//                   <p className="text-sm mt-2">Haz clic en &quot;Agregar Actividad&quot; para comenzar</p>
//                 </td>
//               </tr>
//             ) : (
//               actividades.map((actividad) => (
//                 <tr key={actividad.id} className="hover:bg-gray-50 transition-colors">
//                   {/* Columna de Actividad */}
//                   <td className="border border-gray-300 px-4 py-3 align-top">
//                     <div className="flex items-start gap-2">
//                       <div 
//                         className={`w-4 h-full ${getColorPrioridad(actividad.prioridad)} rounded`}
//                         title={`Prioridad: ${actividad.prioridad}`}
//                       />
//                       <div className="flex-1">
//                         <div className="flex items-start justify-between mb-2">
//                           <div>
//                             <div className="font-bold text-sm text-gray-900">{actividad.codigo}</div>
//                             <div className="text-sm text-gray-700 mt-1">{actividad.nombre}</div>
//                           </div>
//                           <div className="flex gap-1 ml-2">
//                             <button
//                               onClick={() => handleEditarActividad(actividad)}
//                               className="p-1 text-blue-600 hover:bg-blue-50 rounded"
//                               title="Editar"
//                             >
//                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                               </svg>
//                             </button>
//                             <button
//                               onClick={() => handleEliminarActividad(actividad.id)}
//                               className="p-1 text-red-600 hover:bg-red-50 rounded"
//                               title="Eliminar"
//                             >
//                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                               </svg>
//                             </button>
//                           </div>
//                         </div>
//
//                         {actividad.descripcion && (
//                           <div className="text-xs text-gray-500 mb-2">{actividad.descripcion}</div>
//                         )}
//
//                         <div className="flex flex-wrap gap-2 text-xs">
//                           {actividad.horaInicio && (
//                             <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
//                               ⏰ {actividad.horaInicio} - {actividad.horaFin}
//                             </span>
//                           )}
//                           {actividad.requiereMaquinaria && (
//                             <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
//                               🏗️ Maquinaria
//                             </span>
//                           )}
//                           {actividad.requiereMaterial && (
//                             <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
//                               📦 Material
//                             </span>
//                           )}
//                         </div>
//
//                         {/* Barra de avance */}
//                         <div className="mt-3">
//                           <div className="flex justify-between text-xs text-gray-600 mb-1">
//                             <span>Avance: {actividad.avanceReal}%</span>
//                             <span className={`font-medium ${
//                               actividad.estado === 'completada' ? 'text-green-600' :
//                               actividad.estado === 'en_proceso' ? 'text-blue-600' :
//                               'text-gray-600'
//                             }`}>
//                               {actividad.estado}
//                             </span>
//                           </div>
//                           <div className="w-full bg-gray-200 rounded-full h-2">
//                             <div 
//                               className={`h-2 rounded-full transition-all ${
//                                 actividad.estado === 'completada' ? 'bg-green-500' :
//                                 actividad.estado === 'en_proceso' ? 'bg-blue-500' :
//                                 'bg-gray-400'
//                               }`}
//                               style={{ width: `${actividad.avanceReal}%` }}
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </td>
//
//                   {/* Columnas de días */}
//                   {diasSemana.map((dia) => (
//                     <td
//                       key={dia}
//                       className={`border border-gray-300 px-2 py-2 align-top min-h-[120px] transition-colors ${
//                         actividad.diaSemana === dia ? 'bg-blue-50' : ''
//                       } ${draggedEmpleado ? 'hover:bg-yellow-50' : ''}`}
//                       onDragOver={handleDragOver}
//                       onDrop={(e) => handleDrop(e, actividad.id, dia)}
//                     >
//                       <div className="space-y-1">
//                         {getEmpleadosEnCelda(actividad.id, dia).map((empleado) => (
//                           <div
//                             key={empleado.asignacionId}
//                             className="bg-gray-100 text-gray-800 px-2 py-1.5 rounded text-xs flex items-center justify-between hover:bg-gray-200 transition-colors group"
//                           >
//                             <span className="flex-1 truncate">{empleado.nombre}</span>
//                             {onRemoverEmpleado && (
//                               <button
//                                 onClick={() => onRemoverEmpleado(empleado.asignacionId)}
//                                 className="ml-2 text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
//                               >
//                                 ×
//                               </button>
//                             )}
//                           </div>
//                         ))}
//                         {getEmpleadosEnCelda(actividad.id, dia).length === 0 && (
//                           <div className="text-center text-gray-400 text-xs py-2">
//                             Arrastra empleado aquí
//                           </div>
//                         )}
//                       </div>
//                     </td>
//                   ))}
//
//                   {/* Domingo */}
//                   <td className="border border-gray-300 bg-gray-50"></td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//
//       {/* Panel de empleados - Drag and Drop */}
//       <div className="border-t border-gray-300 bg-gray-50 p-4">
//         <h3 className="font-bold text-sm mb-3 text-gray-700 flex items-center gap-2">
//           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//           </svg>
//           Empleados Disponibles (Arrastra para asignar)
//         </h3>
//         <div className="flex flex-wrap gap-2">
//           {empleados.map((empleado) => (
//             <div
//               key={empleado.id}
//               draggable
//               onDragStart={(e) => handleDragStart(e, empleado.id)}
//               gggclassName={`px-3 py-2 rounded-lg text-sm font-medium cursor-move transition-all shadow-sm ${
//                 draggedEmpleado === empleado.id
//                   ? 'bg-blue-600 text-white scale-105'
//                   : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
//               }`}
//             >
//               {empleado.nombre}
//             </div>
//           ))}
//           {empleados.length === 0 && (
//             <div className="text-gray-500 text-sm">
//               No hay empleados disponibles
//             </div>
//           )}
//         </div>
//       </div>
//
//       {/* Modal Actividad */}
//       <ModalActividad
//         // isOpen={modalActividadOpen}
//         // onClose={() => {
//         //   setModalActividadOpen(false);
//         //   setActividadEditar(null);
//         // }}
//         onGuardar={handleGuardarActividad}
//         proyectoSemanaId={proyectoSemanaId}
//         actividadEditar={actividadEditar}
//       />
//     </div>
//   );
// }
