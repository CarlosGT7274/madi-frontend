
export interface Urgencia {
  id: number
  descripcion: string
}

export interface Estado {
  id: number
  nombre: string
}

export interface Estatus {
  id: number
  nombre: string
}

export interface Material {
  id: number
  material: string
  descripcion?: string
  cantidad: number
  unidadMedida: string
  urgencia?: Urgencia
  fechaLlegada?: string | Date
  observacion?: string
  inventarioActual?: number
  cantidadEntregada?: number
  estatus?: Estatus
  sugerenciaCompra?: number
}

export interface Requisicion {
  id: number
  folio: string
  solicitante?: string
  departamento?: string;
  fechaRegistro: string | Date;
  proyecto: string
  orden?: string
  origen: string
  empleado: string
  idEstado: number
  estado: Estado
  fechaSolicitud: string | Date
  observaciones?: string
  materiales: Material[]
  archivoExcelNombre?: string
  archivoExcelRuta?: string
}

// In your types/requisicion.ts file or wherever you define the Requisicion type
// export interface Requisicion {
//   id: number;
//   folio: string;
//   solicitante: string; // Add this line
//   departamento: string;
//   fechaRegistro: string;
//   proyecto: string;
//   orden?: string;
//   origen: string;
//   observaciones?: string;
//   estado: string | { nombre: string };
//   materiales: Material[];
//   archivoExcelNombre?: string;
//   // Add any other properties you're using in your component
// }

export interface EvaluacionPayload {
  requisicionId: number
  evaluador: string
  materiales: {
    id: number
    cantidadEntregada: number
    enviarACompras: boolean
    observacion: string | null
    sugerenciaCompra: number
  }[]
}

