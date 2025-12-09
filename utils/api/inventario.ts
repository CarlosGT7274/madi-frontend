import { post, get, del, patch } from "../http";

export const subirInventarioDesdeExcel = async (data: any[]) => {
  console.log("🚀 Inició el proceso de carga del archivo Excel");
  return await post("inventario/cargar-excel", data);
};

export const obtenerInventario = async () => {
  return await get("inventario");
};

export const registrarEventoBitacora = async ({
  usuario,
  accion,
  descripcion,
  modulo,
  ip = "localhost",
}: {
  usuario: string;
  accion: string;
  descripcion: string;
  modulo: string;
  ip?: string;
}) => {
  const payload = {
    usuario,
    accion,
    descripcion,
    modulo,
    ip,
    fechaHora: new Date(),
  };

  return await post("bitacora/logout", payload);
};

export const deleteItemInventario = async (id: number) => {
  return await del(`inventario/${id}`);
};

export const actualizarCantidadDisponible = async (
  id: number,
  cantidad: number
) => {
  try {
    return await patch(`inventario/${id}/cantidad`, {
      cantidadDisponible: cantidad,
    });
  } catch (error) {
    console.error("❌ Error en actualizarCantidadDisponible:", error);
    throw error;
  }
};

export const agregarItemManualInventario = async (data: any) => {
  try {
    const respuesta = await post("inventario", data);

    await registrarEventoBitacora({
      usuario: data.usuarioRegistro,
      accion: "Alta de material manual",
      descripcion: `Se registró manualmente el material "${data.material}" con SKU ${data.codigoSKU}`,
      modulo: "Inventario",
    });

    return respuesta;
  } catch (error) {
    console.error("❌ Error al agregar item manual:", error);
    throw error;
  }
};

export const verificarRequisicionesDesdeInventario = async (
  materialNombre: string,
  cantidad: number
) => {
  return await patch(
    `inventario/verificar-requisiciones/${materialNombre}/${cantidad}`,
    {}
  );
};
