// // components/planeacion/TablaSeguimientoProyecto.tsx
// 'use client';
//
// import { Actividad } from '@/types/planeacion';
//
// interface ActividadSeguimiento extends Actividad {
//   diasEjecucion: number;
//   fechaInicioPresupuestado: string;
//   fechaFinPresupuestado: string;
//   fechaInicioReal?: string;
//   fechaFinReal?: string;
// }
//
// interface TablaSeguimientoProyectoProps {
//   planta: string;
//   proyecto: string;
//   responsable: string;
//   fechaInicio: string;
//   diasPlaneados: number;
//   fechaFin: string;
//   actividades: ActividadSeguimiento[];
// }
//
// export default function TablaSeguimientoProyecto({
//   planta,
//   proyecto,
//   responsable,
//   fechaInicio,
//   diasPlaneados,
//   fechaFin,
//   actividades,
// }: TablaSeguimientoProyectoProps) {
//
//   const getEstadoBadge = (estado: string) => {
//     const badges: Record<string, { bg: string; text: string; label: string }> = {
//       completada: { bg: 'bg-green-500', text: 'text-white', label: 'Completado' },
//       en_proceso: { bg: 'bg-blue-500', text: 'text-white', label: 'En Proceso' },
//       pendiente: { bg: 'bg-yellow-500', text: 'text-white', label: 'Pendiente' },
//       pausada: { bg: 'bg-orange-500', text: 'text-white', label: 'Pausada' },
//       cancelada: { bg: 'bg-red-500', text: 'text-white', label: 'Cancelada' },
//     };
//
//     const badge = badges[estado] || badges.pendiente;
//
//     return (
//       <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-sm font-medium`}>
//         {badge.label}
//       </span>
//     );
//   };
//
//   const formatFecha = (fecha: string) => {
//     if (!fecha) return '-';
//     return new Date(fecha).toLocaleDateString('es-MX', {
//       day: '2-digit',
//       month: '2-digit',
//       year: '2-digit'
//     });
//   };
//
//   return (
//     <div className="bg-white rounded-lg shadow-lg overflow-hidden">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
//         <h1 className="text-3xl font-bold mb-6">PROGRAMACIÓN DE PROYECTOS CPS</h1>
//
//         <div className="grid grid-cols-2 gap-6 bg-white/10 backdrop-blur-sm rounded-lg p-6">
//           <div>
//             <div className="text-sm opacity-90">Planta:</div>
//             <div className="text-xl font-bold text-blue-200">{planta}</div>
//           </div>
//           <div>
//             <div className="text-sm opacity-90">Proyecto:</div>
//             <div className="text-xl font-bold text-blue-200">{proyecto}</div>
//           </div>
//           <div>
//             <div className="text-sm opacity-90">Responsable:</div>
//             <div className="text-lg font-semibold">{responsable}</div>
//           </div>
//           <div>
//             <div className="text-sm opacity-90">Fecha de inicio:</div>
//             <div className="text-lg font-semibold">{formatFecha(fechaInicio)}</div>
//           </div>
//           <div>
//             <div className="text-sm opacity-90">Días planeados de trabajo:</div>
//             <div className="text-lg font-semibold">{diasPlaneados}</div>
//           </div>
//           <div>
//             <div className="text-sm opacity-90">Fecha de fin:</div>
//             <div className="text-lg font-semibold">{formatFecha(fechaFin)}</div>
//           </div>
//         </div>
//       </div>
//
//       {/* Tabla */}
//       <div className="overflow-x-auto">
//         <table className="w-full border-collapse">
//           <thead>
//             <tr className="bg-blue-100">
//               <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-700 w-16">
//                 NO
//               </th>
//               <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-700 min-w-[300px]">
//                 ACTIVIDAD
//               </th>
//               <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-700 w-32">
//                 DÍAS DE<br/>EJECUCIÓN
//               </th>
//               <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-700 w-40">
//                 ESTADO
//               </th>
//               <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-700 w-40 bg-blue-50">
//                 FECHA DE INICIO<br/>PRESUPUESTADO
//               </th>
//               <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-700 w-40 bg-blue-50">
//                 FECHA DE TÉRMINO<br/>PRESUPUESTADO
//               </th>
//               <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-700 w-40 bg-green-50">
//                 FECHA REAL<br/>DE COMIENZO
//               </th>
//               <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-700 w-40 bg-green-50">
//                 FECHA TÉRMINO<br/>REAL
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             {actividades.map((actividad, index) => (
//               <tr key={actividad.id} className="hover:bg-gray-50">
//                 <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-700">
//                   {index + 1}
//                 </td>
//                 <td className="border border-gray-300 px-4 py-3">
//                   <div className="font-medium text-gray-900">{actividad.nombre}</div>
//                   {actividad.descripcion && (
//                     <div className="text-sm text-gray-600 mt-1">{actividad.descripcion}</div>
//                   )}
//                 </td>
//                 <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
//                   {actividad.diasEjecucion}
//                 </td>
//                 <td className="border border-gray-300 px-4 py-3 text-center">
//                   {getEstadoBadge(actividad.estado)}
//                 </td>
//                 <td className="border border-gray-300 px-4 py-3 text-center bg-blue-50/30">
//                   {formatFecha(actividad.fechaInicioPresupuestado)}
//                 </td>
//                 <td className="border border-gray-300 px-4 py-3 text-center bg-blue-50/30">
//                   {formatFecha(actividad.fechaFinPresupuestado)}
//                 </td>
//                 <td className="border border-gray-300 px-4 py-3 text-center bg-green-50/30">
//                   {actividad.fechaInicioReal ? (
//                     <span className="font-semibold text-green-700">
//                       {formatFecha(actividad.fechaInicioReal)}
//                     </span>
//                   ) : (
//                     <span className="text-gray-400">-</span>
//                   )}
//                 </td>
//                 <td className="border border-gray-300 px-4 py-3 text-center bg-green-50/30">
//                   {actividad.fechaFinReal ? (
//                     <span className="font-semibold text-green-700">
//                       {formatFecha(actividad.fechaFinReal)}
//                     </span>
//                   ) : (
//                     <span className="text-gray-400">-</span>
//                   )}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//
//       {/* Resumen */}
//       <div className="bg-gray-50 p-6 border-t border-gray-300">
//         <div className="grid grid-cols-4 gap-4 text-center">
//           <div className="bg-white p-4 rounded-lg shadow-sm">
//             <div className="text-2xl font-bold text-blue-600">
//               {actividades.filter(a => a.estado === 'completada').length}
//             </div>
//             <div className="text-sm text-gray-600 mt-1">Completadas</div>
//           </div>
//           <div className="bg-white p-4 rounded-lg shadow-sm">
//             <div className="text-2xl font-bold text-yellow-600">
//               {actividades.filter(a => a.estado === 'en_proceso').length}
//             </div>
//             <div className="text-sm text-gray-600 mt-1">En Proceso</div>
//           </div>
//           <div className="bg-white p-4 rounded-lg shadow-sm">
//             <div className="text-2xl font-bold text-gray-600">
//               {actividades.filter(a => a.estado === 'pendiente').length}
//             </div>
//             <div className="text-sm text-gray-600 mt-1">Pendientes</div>
//           </div>
//           <div className="bg-white p-4 rounded-lg shadow-sm">
//             <div className="text-2xl font-bold text-green-600">
//               {Math.round(
//                 (actividades.filter(a => a.estado === 'completada').length / actividades.length) * 100
//               )}%
//             </div>
//             <div className="text-sm text-gray-600 mt-1">Avance Total</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
