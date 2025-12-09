// // components/planeacion/PlantaProyectoSelector.tsx - VERSIÓN CORREGIDA
// 'use client';
//
// import { useState, useEffect } from 'react';
// import {
//   getPlantas,
//   getLevantamientosByPlanta,
//   getProyectosByLevantamiento,
//   getLevantamientoById,
// } from '@/utils/api/planeacion';
//
// // Definir interfaces para los tipos
// interface Planta {
//   id: string;
//   nombre: string;
//   clave?: string;
//   direccion?: string;
//   activa?: boolean;
//   fechaCreacion?: string;
// }
//
// interface Levantamiento {
//   id: string;
//   folio: string;
//   nombre: string;
//   cliente: string;
//   plantaId?: string;
//   fechaCreacion?: string;
// }
//
// interface Proyecto {
//   id: string;
//   nombre: string;
//   levantamientoId?: string;
//   descripcion?: string;
//   fechaCreacion?: string;
// }
//
// interface SeleccionData {
//   planta: Planta | undefined;
//   levantamiento: Levantamiento | undefined;
//   proyecto: Proyecto | undefined;
// }
//
// interface PlantaProyectoSelectorProps {
//   onSeleccionar: (plantaId: string, proyectoId: string, data: SeleccionData) => void;
// }
//
// export default function PlantaProyectoSelector({ onSeleccionar }: PlantaProyectoSelectorProps) {
//   const [paso, setPaso] = useState(1);
//   const [plantas, setPlantas] = useState<Planta[]>([]);
//   const [levantamientos, setLevantamientos] = useState<Levantamiento[]>([]);
//   const [proyectos, setProyectos] = useState<Proyecto[]>([]);
//
//   const [plantaSeleccionada, setPlantaSeleccionada] = useState('');
//   const [levantamientoSeleccionado, setLevantamientoSeleccionado] = useState('');
//   const [proyectoSeleccionado, setProyectoSeleccionado] = useState('');
//
//   useEffect(() => {
//     cargarPlantas();
//   }, []);
//
//   const cargarPlantas = () => {
//     const data = getPlantas();
//     setPlantas(data);
//   };
//
//   const handlePlantaChange = (plantaId: string) => {
//     setPlantaSeleccionada(plantaId);
//     setLevantamientoSeleccionado('');
//     setProyectoSeleccionado('');
//
//     if (plantaId) {
//       const levs = getLevantamientosByPlanta(plantaId);
//       setLevantamientos(levs);
//       setPaso(2);
//     }
//   };
//
//   const handleLevantamientoChange = (levId: string) => {
//     setLevantamientoSeleccionado(levId);
//     setProyectoSeleccionado('');
//
//     if (levId) {
//       const proys = getProyectosByLevantamiento(levId);
//       setProyectos(proys);
//       setPaso(3);
//     }
//   };
//
//   const handleProyectoChange = (proyId: string) => {
//     setProyectoSeleccionado(proyId);
//
//     if (proyId) {
//       const planta = plantas.find(p => p.id === plantaSeleccionada);
//       const levantamiento = getLevantamientoById(levantamientoSeleccionado);
//       const proyecto = proyectos.find(p => p.id === proyId);
//
//       onSeleccionar(plantaSeleccionada, proyId, {
//         planta,
//         levantamiento,
//         proyecto,
//       });
//     }
//   };
//
//   return (
//     <div className="bg-white rounded-lg shadow-lg p-6">
//       <h2 className="text-2xl font-bold text-gray-900 mb-6">
//         Seleccionar Planta y Proyecto
//       </h2>
//
//       <div className="space-y-6">
//         {/* Select Planta */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             1. Selecciona la Planta
//           </label>
//           <select
//             value={plantaSeleccionada}
//             onChange={(e) => handlePlantaChange(e.target.value)}
//             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           >
//             <option value="">-- Selecciona una planta --</option>
//             {plantas.map((planta) => (
//               <option key={planta.id} value={planta.id}>
//                 {planta.nombre}
//               </option>
//             ))}
//           </select>
//         </div>
//
//         {/* Select Levantamiento */}
//         {paso >= 2 && (
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               2. Selecciona el Levantamiento
//             </label>
//             <select
//               value={levantamientoSeleccionado}
//               onChange={(e) => handleLevantamientoChange(e.target.value)}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               disabled={!plantaSeleccionada}
//             >
//               <option value="">-- Selecciona un levantamiento --</option>
//               {levantamientos.map((lev) => (
//                 <option key={lev.id} value={lev.id}>
//                   {lev.folio} - {lev.nombre} ({lev.cliente})
//                 </option>
//               ))}
//             </select>
//           </div>
//         )}
//
//         {/* Select Proyecto */}
//         {paso >= 3 && (
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               3. Selecciona el Proyecto
//             </label>
//             <select
//               value={proyectoSeleccionado}
//               onChange={(e) => handleProyectoChange(e.target.value)}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               disabled={!levantamientoSeleccionado}
//             >
//               <option value="">-- Selecciona un proyecto --</option>
//               {proyectos.map((proy) => (
//                 <option key={proy.id} value={proy.id}>
//                   {proy.nombre}
//                 </option>
//               ))}
//             </select>
//           </div>
//         )}
//       </div>
//
//       {plantas.length === 0 && (
//         <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//           <p className="text-yellow-800 text-sm">
//             ⚠️ No hay plantas creadas. Crea una planta primero en el módulo de Proyectos.
//           </p>
//         </div>
//       )}
//     </div>
//   );
// }
