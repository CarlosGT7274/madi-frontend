declare interface User {
  usuario: {
    id: number;
    nombre: string;
    correo: string;
    password: string;
    rol_id: number;
    rol: {
      id: number;
      nombre: string;
    };
  };
  access_token?: string;
  permisos?: {
    [key: string]: {
      nombre: string;
      endpoint: string;
      valor: number;
      sub_permisos?: {
        [key: string]: {
          nombre: string;
          endpoint: string;
          valor: number;
        };
      };
    };
  };
}

interface PermisoUsuario {
  [key: string]: {
    nombre: string
    endpoint: string
    valor: number
    sub_permisos?: {
      [key: string]: {
        nombre: string
        endpoint: string
        valor: number
      }
    }
  }
}

declare interface Allusers {
  id?: number;
  nombre: string;
  correo: string;
  rol_id: number;
  rol?: {
    id: number,
    nombre: string
  }
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface UsuarioCookie {
  id: number;
  nombre: string;
  correo: string;
  rol_id: number;
  rol: {
    id: number;
    nombre: string;
  };
}

interface PermisoCookie {
  nombre: string;
  endpoint: string;
  valor: number;
  sub_permisos?: Record<string, {
    nombre: string;
    endpoint: string;
    valor: number;
  }>;
}

interface CookieData {
  usuario: UsuarioCookie;
  permisos: Record<string, PermisoCookie>;
}
