import { getCookie } from "cookies-next";
import { post, get, patch, postFormData, getFile } from "../http";
import { toast } from "react-toastify";
import { is } from "date-fns/locale";
export const crearRequisicion = async (data: {
  folio: string;
  proyecto: string;
  orden?: string;
  materiales: {
    material: string;
    // descripcion: string;
    cantidad: number;
    unidadMedida: string;
    idUrgencia: number;
    inventarioActual?: number | null;
  }[];
}) => {
  const usuarioC = getCookie("usuario") ?? "{}";
  const usuario: User = JSON.parse(usuarioC.toString());
  if (!usuario.usuario.nombre) throw new Error("Usuario no identificado");

  const payload = {
    folio: data.folio,
    proyecto: data.proyecto,
    empleado: usuario.usuario.nombre,
    orden: data.orden,
    materiales: data.materiales,
    origen: usuario?.usuario?.rol.nombre.toLowerCase(),
  };

  console.log(payload);

  return await post("requisicion", payload);
};

export const obtenerRequisicionPorId = async (id: number) => {
  return await get(`requisicion/${id}`);
};

export const obtenerRequisiciones = async () => {
  return await get("requisicion");
};

export const obtenerFolio = async () => {
  return await get("requisicion/folio");
};

export const obtenerRequisicionesActivas = async () => {
  return await get("requisicion/activas");
};

export const evaluarRequisicion = async (data: any) => {
  console.log("DTO FINAL:", JSON.stringify(data, null, 2));
  return await patch("requisicion/evaluar", data);
};

export const obtenerRequisicionesCompras = async () => {
  return await get("requisicion/compras");
};

export const subirArchivoExcel = async (
  requisicionId: number,
  archivo: File,
) => {
  const formData = new FormData();
  formData.append("file", archivo);

  return await postFormData(
    `requisicion/${requisicionId}/upload-excel`,
    formData,
  );
};

export const descargarArchivoExcel = async (requisicionId: number) => {
  try {
    const file = await getFile(`requisicion/${requisicionId}/descargar-excel`);

    // Soporte para ambas formas: Blob directo o { blob, filename }
    const { blob, filename } =
      file instanceof Blob
        ? { blob: file as Blob, filename: null as string | null }
        : (file as { blob: Blob; filename?: string | null });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename ?? `Requisicion_${requisicionId}.xlsx`;
    document.body.appendChild(link); // Safari/iOS
    link.click();
    document.body.removeChild(link);

    // Revocar en el siguiente ciclo para evitar cortar la descarga en algunos navegadores
    setTimeout(() => URL.revokeObjectURL(url), 0);

    toast.success("Archivo descargado correctamente 📥");
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "Error inesperado al descargar archivo";
    toast.error(mensaje);
    console.error("Error detallado:", error);
  }
};

export const desbloquearRequiscion = async (id: number, user: any) => {
  return await post(`requisicion/${id}/desbloquear`, user)
}
