import { get, patch, post } from "../http";

export const getOneUser = async (id: any) => {
  return await get(`usuarios/${id}`)
}

export const usersAll = async () => {
  return await get("usuarios");
};

export const registerUser = async (data: any) => {
  return await post("usuarios", data);
};

export const updateUser = async (id: any, data: any) => {
  return await patch(`usuarios/${id}`, data)
}
