import { post, get, del, patch } from "../http";
import { optimizarImagenParaSubida } from "../imageComprecion";

// ==========================================
// PLANTAS
// ==========================================

export const base64ToDataUrl = (base64: string, mimeType: string): string => {
  return `data:${mimeType};base64,${base64}`;
};

export const crearPlanta = async (data: {
  nombre: string;
  direccion?: string;
  descripcion?: string;
  usuario_id: number;
}) => {
  return await post("ingenieria/proyectos/plantas", data);
};

export const obtenerPlantas = async () => {
  return await get("ingenieria/proyectos/plantas");
};

export const obtenerPlantasPorUsuario = async (usuario_id: number) => {
  return await get(`ingenieria/proyectos/plantas?usuario_id=${usuario_id}`);
};

export const obtenerPlantaPorId = async (id: number) => {
  return await get(`ingenieria/proyectos/plantas/${id}`);
};

export const obtenerEstadisticasPlanta = async (id: number) => {
  return await get(`ingenieria/proyectos/plantas/${id}/estadisticas`);
};

// ==========================================
// LEVANTAMIENTOS
// ==========================================

export const crearLevantamiento = async (data: {
  planta_id: number;
  nombre: string;
  cliente: string;
  planta_nombre?: string;
  obra?: string;
  solicitante?: string;
  fecha_solicitud?: string;
  usuario_requiriente?: string;
  correo_usuario?: string;
  area_trabajo?: string;
  titulo_cotizacion?: string;
  trabajos_alturas?: {
    aplica: boolean;
    certificado: boolean;
    notas?: string;
  };
  espacios_confinados?: {
    aplica: boolean;
    certificado: boolean;
    notas?: string;
  };
  corte_soldadura?: {
    aplica: boolean;
    certificado: boolean;
    notas?: string;
  };
  izaje?: {
    aplica: boolean;
    certificado: boolean;
    notas?: string;
  };
  apertura_lineas?: {
    aplica: boolean;
    certificado: boolean;
    notas?: string;
  };
  excavacion?: {
    aplica: boolean;
    certificado: boolean;
    notas?: string;
  };
  notas_maquinaria?: string;
  usuario_id?: number;
}) => {
  return await post("ingenieria/proyectos/levantamientos", data);
};

export const obtenerLevantamientosPorPlanta = async (planta_id: number) => {
  return await get(`ingenieria/proyectos/levantamientos?planta_id=${planta_id}`);
};

export const obtenerLevantamientoPorId = async (id: number) => {
  return await get(`ingenieria/proyectos/levantamientos/${id}`);
};

// ==========================================
// PROYECTOS
// ==========================================

export const crearProyecto = async (data: {
  levantamiento_id: number;
  nombre: string;
  descripcion?: string;
  usuario_id?: number;
}) => {
  return await post("ingenieria/proyectos/proyectos", data);
};

export const obtenerProyectosPorLevantamiento = async (levantamiento_id: number) => {
  return await get(`ingenieria/proyectos/proyectos?levantamiento_id=${levantamiento_id}`);
};

export const obtenerProyectoPorId = async (id: number) => {
  return await get(`ingenieria/proyectos/proyectos/${id}`);
};

export const bloquearProyecto = async (id: number, motivo: string) => {
  return await patch(`ingenieria/proyectos/proyectos/${id}/bloquear`, { motivo });
};

export const desbloquearProyecto = async (id: number) => {
  return await patch(`ingenieria/proyectos/proyectos/${id}/desbloquear`, {});
};

// ==========================================
// COTIZACIONES
// ==========================================

export const crearCotizacion = async (data: {
  proyecto_id: number;
  fecha: string;
  subtotal: number;
  iva: number;
  total: number;
  partidas?: Array<{
    numero_partida: number;
    descripcion: string;
    cantidad: number;
    unidad?: string;
    precio_unitario: number;
    importe: number;
  }>;
  usuario_id?: number;
}) => {
  return await post("ingenieria/proyectos/cotizaciones", data);
};

// api/ing-proyectos.ts
export const actualizarCotizacion = async (id: number, data: {
  fecha?: string;
  subtotal?: number;
  iva?: number;
  total?: number;
  partidas?: Array<{
    numero_partida: number;
    descripcion: string;
    cantidad: number;
    unidad?: string;
    precio_unitario: number;
    importe: number;
  }>;
}) => {
  console.log('📤 Datos enviados para actualizar cotización:', {
    id,
    data: {
      ...data,
      partidas: data.partidas?.length || 0
    }
  });
  
  try {
    const response = await patch(`ingenieria/proyectos/cotizaciones/${id}`, data);
    console.log('✅ Cotización actualizada:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Error al actualizar cotización:', {
      id,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    throw error;
  }
};

export const obtenerCotizacionesPorProyecto = async (proyecto_id: number) => {
  return await get(`ingenieria/proyectos/cotizaciones?proyecto_id=${proyecto_id}`);
};

export const obtenerCotizacionPorId = async (id: number) => {
  return await get(`ingenieria/proyectos/cotizaciones/${id}`);
};

// ==========================================
// INSUMOS
// ==========================================
export const crearInsumo = async (data: {
  cotizacion_id: number;
  item_number: string;
  descripcion: string;
  material?: string;
  especificacion?: string;
  unidad_medida: string;
  cantidad: number;
  cantidad_requisitada?: number;
  cantidad_actual?: number;
  cantidad_disponible?: number;
  entregada_compras?: number;
  precio_unitario?: number;
  precio_hora?: number;
  importe?: number;
  valor_total?: number;
  proveedor?: string;
  direccion?: string;
  vendedor?: string;
  periodo?: string;
  cliente?: string;
  estatus?: "pendiente" | "requisitado" | "comprado" | "entregado";
  activo?: boolean;
  usuario_carga?: string;
}) => {
  return await post("ingenieria/proyectos/insumos", data);
};

// SOLO DOS FUNCIONES PRINCIPALES:
export const crearInsumosBulk = async (data: {
  cotizacion_id: number;
  insumos: Array<{
    item_number: string;
    descripcion: string;
    material?: string;
    especificacion?: string;
    unidad_medida: string;
    cantidad: number;
    cantidad_requisitada?: number;
    cantidad_actual?: number;
    cantidad_disponible?: number;
    entregada_compras?: number;
    precio_unitario?: number;
    precio_hora?: number;
    importe?: number;
    valor_total?: number;
    proveedor?: string;
    direccion?: string;
    vendedor?: string;
    periodo?: string;
    cliente?: string;
    estatus?: "pendiente" | "requisitado" | "comprado" | "entregado";
    activo?: boolean;
  }>;
  usuario_carga?: string;
}) => {
  return await post("ingenieria/proyectos/insumos/bulk", data);
};

export const actualizarInsumosBulk = async (data: {
  cotizacion_id: number;
  insumos: Array<{
    id?: number;
    item_number: string;
    descripcion: string;
    material?: string;
    especificacion?: string;
    unidad_medida: string;
    cantidad: number;
    cantidad_requisitada?: number;
    cantidad_actual?: number;
    cantidad_disponible?: number;
    entregada_compras?: number;
    precio_unitario?: number;
    precio_hora?: number;
    importe?: number;
    valor_total?: number;
    proveedor?: string;
    direccion?: string;
    vendedor?: string;
    periodo?: string;
    cliente?: string;
    estatus?: "pendiente" | "requisitado" | "comprado" | "entregado";
    activo?: boolean;
  }>;
  usuario_carga?: string;
}) => {
  return await patch("ingenieria/proyectos/insumos/bulk", data);
};

// Y si necesitas eliminar UNO solo:
export const eliminarInsumo = async (id: number) => {
  return await del(`ingenieria/proyectos/insumos/${id}`);
};

export const obtenerInsumosPorCotizacion = async (cotizacion_id: number) => {
  return await get(`ingenieria/proyectos/insumos?cotizacion_id=${cotizacion_id}`);
};

export const obtenerInsumoPorId = async (id: number) => {
  return await get(`ingenieria/proyectos/insumos/${id}`);
};

export const obtenerInsumosDisponibles = async () => {
  return await get("ingenieria/proyectos/insumos?disponibles=true");
};

export const actualizarInsumo = async (
  id: number,
  data: {
    descripcion?: string;
    material?: string;
    especificacion?: string;
    cantidad?: number;
    cantidad_requisitada?: number;
    cantidad_actual?: number;
    cantidad_disponible?: number;
    entregada_compras?: number;
    precio_unitario?: number;
    precio_hora?: number;
    importe?: number;
    valor_total?: number;
    proveedor?: string;
    direccion?: string;
    vendedor?: string;
    periodo?: string;
    cliente?: string;
    estatus?: "pendiente" | "requisitado" | "comprado" | "entregado";
    activo?: boolean;
  }
) => {
  return await patch(`ingenieria/proyectos/insumos/${id}`, data);
};


// ==========================================
// ARCHIVOS (IMÁGENES Y PDFs)
// ==========================================

export const subirArchivo = async (data: {
  nombre_archivo: string;
  tipo: "imagen" | "pdf";
  tipo_mime: string;
  tamano_bytes: number;
  contenido_base64: string;
  descripcion?: string;
  orden?: number;
  levantamiento_id?: number;
  orden_compra_id?: number;
}) => {
  return await post("ingenieria/proyectos/archivos", data);
};

export const obtenerArchivosPorLevantamiento = async (levantamiento_id: number) => {
  return await get(`ingenieria/proyectos/archivos/levantamiento/${levantamiento_id}`);
};

export const obtenerArchivosPorOrdenCompra = async (orden_compra_id: number) => {
  return await get(`ingenieria/proyectos/archivos/orden-compra/${orden_compra_id}`);
};

export const eliminarArchivo = async (id: number) => {
  return await del(`ingenieria/proyectos/archivos/${id}`);
};

// ==========================================
// ÓRDENES DE COMPRA
// ==========================================

export const crearOrdenCompra = async (data: {
  cotizacion_id: number;
  proveedor?: string;
  fecha_orden: string;
  fecha_entrega_estimada?: string;
  subtotal: number;
  iva: number;
  total: number;
  notas?: string;
  usuario_id?: number;
  pdf?: {
    nombre_archivo: string;
    tipo_mime: string;
    tamano_bytes: number;
    contenido_base64: string;
    descripcion?: string;
  };
}) => {
  return await post("ingenieria/proyectos/ordenes-compra", data);
};

export const obtenerOrdenCompraPorId = async (id: number) => {
  return await get(`ingenieria/proyectos/ordenes-compra/${id}`);
};

export const obtenerOrdenCompraPorCotizacion = async (cotizacion_id: number) => {
  return await get(`ingenieria/proyectos/ordenes-compra/cotizacion/${cotizacion_id}`);
};

export const actualizarEstadoOrdenCompra = async (
  id: number,
  estado: "pendiente" | "enviada" | "recibida" | "cancelada"
) => {
  return await patch(`ingenieria/proyectos/ordenes-compra/${id}/estado`, { estado });
};

export const subirPdfOrdenCompra = async (
  id: number,
  pdf: {
    nombre_archivo: string;
    tipo_mime: string;
    tamano_bytes: number;
    contenido_base64: string;
    descripcion?: string;
  }
) => {
  return await post(`ingenieria/proyectos/ordenes-compra/${id}/subir-pdf`, pdf);
};

// ==========================================
// HELPERS PARA CONVERSIÓN DE ARCHIVOS
// ==========================================

/**
 * Convierte un archivo File a Base64
 * @param file Archivo a convertir
 * @returns Promise con el Base64 del archivo (sin prefijo data:)
 */
export const archivoABase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]; // Quitar prefijo "data:image/jpeg;base64,"
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Helper para subir imagen de equipo a un levantamiento
 * @param levantamiento_id ID del levantamiento
 * @param file Archivo de imagen
 * @param descripcion Descripción opcional
 * @param orden Orden de la imagen (1, 2, 3...)
 */
// En ing-proyectos.ts
export const subirImagenEquipo = async (
  levantamiento_id: number,
  file: File,
  descripcion?: string,
  orden?: number
) => {
  try {
    console.log(`📸 Procesando imagen: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Optimizar imagen antes de subir
    const archivoOptimizado = await optimizarImagenParaSubida(file);
    
    console.log(`✅ Imagen optimizada: ${archivoOptimizado.name} (${(archivoOptimizado.size / 1024 / 1024).toFixed(2)}MB)`);

    // Validar tamaño máximo después de optimización (1MB)
    if (archivoOptimizado.size > 1 * 1024 * 1024) {
      throw new Error(`Imagen demasiado grande después de compresión: ${(archivoOptimizado.size / 1024 / 1024).toFixed(2)}MB`);
    }

    const contenido_base64 = await archivoABase64(archivoOptimizado);

    return await subirArchivo({
      nombre_archivo: archivoOptimizado.name,
      tipo: "imagen",
      tipo_mime: archivoOptimizado.type,
      tamano_bytes: archivoOptimizado.size,
      contenido_base64,
      descripcion: descripcion || `Imagen de equipo ${archivoOptimizado.name}`,
      orden: orden || 0,
      levantamiento_id,
    });
  } catch (error) {
    console.error('Error en subirImagenEquipo:', error);
    throw error;
  }
};

/**
 * Helper para subir PDF de orden de compra
 * @param orden_compra_id ID de la orden de compra
 * @param file Archivo PDF
 * @param descripcion Descripción opcional
 */
export const subirPdfOrden = async (
  orden_compra_id: number,
  file: File,
  descripcion?: string
) => {
  const contenido_base64 = await archivoABase64(file);

  return await subirPdfOrdenCompra(orden_compra_id, {
    nombre_archivo: file.name,
    tipo_mime: file.type,
    tamano_bytes: file.size,
    contenido_base64,
    descripcion,
  });
};
