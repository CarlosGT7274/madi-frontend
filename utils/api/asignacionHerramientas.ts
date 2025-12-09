import { del, get, patch, post } from "../http";

export const crearAsignacionHerr = async (data: any) => {
  return await post("herramientas", data);
};

export const getAllAsignacion = async () => {
  return await get("herramientas");
};

export const actualizarAsignacion = async (data: any) => {
  return await patch("herramientas", data);
};

export const borrarAsignacion = async (id: any) => {
  return await del(`herramientas/${id}`);
};