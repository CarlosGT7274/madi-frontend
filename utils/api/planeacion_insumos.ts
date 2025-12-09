import { get, post } from "../http";

export const crearinsumos = async (data: any) => {
  return post("explosion-insumos/cargar-excel", data)
}

export const obtenerProyectos = async () => {
  return get("explosion-insumos/proyectos")
}

export const buscarProyecto = async (data: any) => {
  return get(`explosion-insumos/proyecto/${data}`)
}
