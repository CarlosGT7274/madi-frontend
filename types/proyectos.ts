interface Fase {
  completado: boolean;
  fecha?: string;
  folio?: string;
}

interface Proyecto {
  id: number;
  nombre: string;
  cliente: string;
  obra: string;
  fechaCreacion: string;
  fases: {
    levantamiento: Fase;
    cotizacion: Fase;
    ordenCompra: Fase;
    explosion: Fase;
  };
  levantamiento?: any;
  cotizacion?: any;
  ordenCompra?: any;
  explosionInsumos?: any;
}

