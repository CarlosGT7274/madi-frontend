// "use server";
// import { cookies } from "next/headers";
import { getCookie } from "cookies-next";
import { get, post } from "../http";
import { Usuario } from "@/types/planeacion";

export const loginUser = async (correo: string, password: string) => {
  try {
    const response = await post("auth/login", { correo, password });

    // cookies().set("token, response.access_token);
    // cookies().set("usuario", JSON.stringify(response.usuario));

    return response;
  } catch (error: any) {
    throw new Error(error.message || "Error al iniciar sesión");
  }
};

export const registrarLogout = async (data: {
  usuario: string;
  ip: string;
  modulo: string;
}) => {
  const payload = {
    accion: "Logout",
    descripcion: "Cierre de sesión",
    usuario: data.usuario,
    ip: data.ip,
    fechaHora: new Date(),
    modulo: data.modulo,
  };

  return await post("bitacora/logout", payload);
};

export const obtenerUltimaSesion = async (correo: string) => {
  return await get(`bitacora/ultima-sesion/${correo}`);
};

export function obtenerUsuarioDesdeCokie(): UsuarioCookie | null {
  try {
    const userCookie = getCookie("usuario");
    
    if (!userCookie) {
      return null;
    }

    const userData: CookieData = JSON.parse(userCookie.toString());
    return userData.usuario;
  } catch (error) {
    console.error("Error obteniendo usuario de cookie:", error);
    return null;
  }
}

/**
 * Obtiene el rol del usuario en formato string
 */
export function obtenerRolUsuario(): string {
  const usuario = obtenerUsuarioDesdeCokie();
  if (!usuario) return "invitado";
  
  const nombreRol = usuario.rol.nombre.toLowerCase();
  
  if (nombreRol.includes("admin")) return "administrador";
  if (nombreRol.includes("ingenier")) return "ingeniero";
  if (nombreRol.includes("almacen") || nombreRol.includes("almacén")) return "almacen";
  if (nombreRol.includes("compras")) return "compras";
  
  return nombreRol;
}
