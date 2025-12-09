import { get, patch, post } from "../http"

export const getroles = async () => {
  return get("roles")
}

export const readOneRol = async (id: number) =>{
  return get(`roles/${id}`)
}

export const updateRolePermissions = async (id: number, data: RolePermissionsPayload) => {
  return patch(`roles/${id}`, data)
}

export const createRole = async ( data: RolePermissionsPayload ) => {
  console.log(data)
  return post("roles", data)
}

export const getAllPermissions = async () => {
  return get("roles/permisos")
}
