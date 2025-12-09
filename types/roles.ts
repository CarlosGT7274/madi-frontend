//
// interface PermisoR {
//   id_permiso: number;
//   padre: number;
//   nombre: string;
//   endpoint: string;
//   activo: number;
// }
//
// interface Permiso {
//   id_permiso: number;
//   permiso: number;
// }
//
// interface Roles {
//   id?: number;
//   nombre: string;
//   permisos?: PermisoRol[];
// }

// interface PermisoRol {
//   id_rol: number;
//   id_permiso: number;
//   valor: number;
//   permisos?: SubPermiso[];
// }

type SubPermiso = {
  nombre: string
  endpoint: string
  valor: number
}

type Permiso = {
  nombre: string
  endpoint: string
  valor: number
  sub_permisos?: Record<string, SubPermiso>
}

type Permisos = Record<string, Permiso>


//
// interface PermisoRol {
//   id_rol: number;
//   id_permiso: number;
//   valor: number;
//   permisos?: SubPermiso[];
// }

interface Roles {
  id?: number;
  nombre: string;
  permisos?: PermisoRol[];
}

interface PermisoToSave {
  id_permiso: number;
  permiso: number;
}

interface RolePermissionsPayload {
  nombre?: string;
  permisos: PermisoToSave[];
}

// type PermisoInput = PermisoRol | Permiso | (SubPermiso & { id_permiso?: number; padre?: number });

interface PermisoBase {
  id_permiso: number;
  nombre: string;
  endpoint: string;
  padre: number;
  activo: number;
  valor?: number;
}

interface PermisoRol {
  id_rol: number;
  id_permiso: number;
  valor: number;
  permisos?: PermisoBase;
}

type PermisoCompleto = {
  id_permiso: number;
  nombre: string;
  endpoint: string;
  padre: number;
  activo: number;
  valor?: number;
}

type PermisoInput = PermisoRol | PermisoCompleto;
