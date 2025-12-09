export type Boolish = boolean | 0 | 1;

export interface Material {
  id: number;
  material: string;
  cantidad: number;
  unidadMedida: string;
  descripcion: string;

  // inventario / cantidades
  inventarioActual?: number | null;
  cantidadEntregada?: number | null;
  sugerenciaCompra?: number | null;

  // urgencia / estatus
  idUrgencia?: number | null;
  urgencia?: { id?: number; descripcion: string } | null;

  estatus?: { id: number; nombre: string } | null;
  idEstatus?: number | null;

  // logística
  fechaLlegada?: string | Date | null;
  diasLlegada?: string | null;

  observacion?: string | null;

  enviadoACompras?: Boolish; // viene de MySQL BIT -> a veces 0/1
}


// Interfaz para UI (con advertencias y presupuesto)
export interface MaterialPendienteUI {
  material: string;
  cantidad: number;
  unidadMedida: string;
  descripcion: string;
  idUrgencia: number;
  inventarioActual?: number | null;
  presupuestoDisponible?: number | null;
  advertencias?: string[];
}

// Interfaz para API (solo datos requeridos)
export interface MaterialPendienteAPI {
  material: string;
  cantidad: number;
  unidadMedida: string;
  descripcion: string;
  idUrgencia: number;
  inventarioActual?: number | null;
}


export interface Insumo {
  [key: string]: string | number;
}

