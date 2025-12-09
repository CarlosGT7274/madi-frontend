"use client";
import React, { useState } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

const PERMISSION_BITS = {
  READ: 1,
  CREATE: 2,
  UPDATE: 4,
  DELETE: 8,
  ALL: 15,
  DENY: 0,
  INHERIT: -1,
} as const;

// Definir interfaces basadas en tus tipos

// interface PermisoSimple extends PermisoBase {}

// type PermisoInput = PermisoRol | PermisoBase;

interface PermissionsTableProps {
  permissionsState: { [key: number]: number };
  setPermissionsState: React.Dispatch<
    React.SetStateAction<{ [key: number]: number }>
  >;
  permisos: PermisoInput[];
}

interface PermisoProcessed {
  id_permiso: number;
  nombre: string;
  endpoint: string;
  padre: number;
  valor: number;
  activo: number;
}

export function PermissionsTable({
  permissionsState,
  setPermissionsState,
  permisos,
}: PermissionsTableProps) {
  const [collapsedModules, setCollapsedModules] = useState<Set<number>>(
    new Set(),
  );

  // Función para normalizar los datos - MANEJA AMBAS ESTRUCTURAS
  const normalizePermissions = (
    permisosInput: PermisoInput[],
  ): PermisoProcessed[] => {
    return permisosInput.map((item) => {
      // Caso 1: Es PermisoRol (tiene id_rol y permisos anidado)
      if ("id_rol" in item) {
        return {
          id_permiso: item.id_permiso,
          nombre: item.permisos?.nombre || "Sin nombre",
          endpoint: item.permisos?.endpoint || "",
          padre: item.permisos?.padre || 0,
          valor: item.valor || 0,
          activo: item.permisos?.activo || 1,
        };
      }

      // Caso 2: Es PermisoCompleto (tiene todas las propiedades directas)
      return {
        id_permiso: item.id_permiso,
        nombre: item.nombre,
        endpoint: item.endpoint,
        padre: item.padre || 0,
        valor: item.valor || 0,
        activo: item.activo || 1,
      };
    });
  };

  // Procesar y organizar permisos
  const processedPermisos: PermisoProcessed[] = normalizePermissions(permisos);

  // Separar padres e hijos
  const padres = processedPermisos.filter((p) => p.padre === 0);
  const hijos = processedPermisos.filter((p) => p.padre !== 0);

  // Agrupar hijos por padre
  const hijosPorPadre = hijos.reduce(
    (acc, hijo) => {
      if (!acc[hijo.padre]) acc[hijo.padre] = [];
      acc[hijo.padre].push(hijo);
      return acc;
    },
    {} as { [key: number]: PermisoProcessed[] },
  );

  const hasBit = (valor: number, bit: number): boolean => {
    return (valor & bit) === bit;
  };

  const toggleBit = (permisoId: number, bit: number) => {
    const currentValue = permissionsState[permisoId] || 0;
    let newValue;

    if (bit === PERMISSION_BITS.ALL) {
      newValue =
        currentValue === PERMISSION_BITS.ALL
          ? PERMISSION_BITS.DENY
          : PERMISSION_BITS.ALL;
    } else if (bit === PERMISSION_BITS.DENY) {
      newValue = PERMISSION_BITS.DENY;
    } else if (bit === PERMISSION_BITS.INHERIT) {
      newValue = PERMISSION_BITS.INHERIT;
    } else {
      if (hasBit(currentValue, bit)) {
        newValue = currentValue & ~bit;
      } else {
        newValue = currentValue | bit;
      }
    }

    setPermissionsState((prev) => ({
      ...prev,
      [permisoId]: newValue,
    }));
  };

  // Función para manejar checkbox de padre
  const handleParentToggle = (parentId: number, bit: number) => {
    const currentValue = permissionsState[parentId] || 0;
    let newValue;

    if (bit === PERMISSION_BITS.ALL) {
      newValue =
        currentValue === PERMISSION_BITS.ALL
          ? PERMISSION_BITS.DENY
          : PERMISSION_BITS.ALL;
    } else {
      if (hasBit(currentValue, bit)) {
        newValue = currentValue & ~bit;
      } else {
        newValue = currentValue | bit;
      }
    }

    // Actualizar padre
    const updatedState = {
      ...permissionsState,
      [parentId]: newValue,
    };

    // Actualizar todos los hijos del padre
    const childrenOfParent = hijosPorPadre[parentId] || [];
    childrenOfParent.forEach((child) => {
      if (bit === PERMISSION_BITS.ALL) {
        updatedState[child.id_permiso] = newValue;
      } else {
        const childCurrentValue = permissionsState[child.id_permiso] || 0;
        if (hasBit(newValue, bit)) {
          // Activar el bit en el hijo
          updatedState[child.id_permiso] = childCurrentValue | bit;
        } else {
          // Desactivar el bit en el hijo
          updatedState[child.id_permiso] = childCurrentValue & ~bit;
        }
      }
    });

    setPermissionsState(updatedState);
  };

  const toggleCollapse = (moduleId: number) => {
    setCollapsedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const renderCheckbox = (
    permisoId: number,
    bit: number,
    label: string,
    isParent = false,
  ) => {
    const currentValue = permissionsState[permisoId] || 0;
    const isChecked = hasBit(currentValue, bit);

    return (
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => {
            if (isParent) {
              handleParentToggle(permisoId, bit);
            } else {
              toggleBit(permisoId, bit);
            }
          }}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
        <span className="text-sm">{label}</span>
      </label>
    );
  };

  const renderPermissionRow = (
    permiso: PermisoProcessed,
    isParent = false,
    isChild = false,
  ) => {
    const bgClass = isParent
      ? "bg-blue-50 border-l-4 border-blue-400"
      : isChild
        ? "bg-gray-50 border-l-4 border-gray-300 ml-6"
        : "bg-white";

    return (
      <div
        key={permiso.id_permiso}
        className={`p-4 border rounded-lg ${bgClass} ${isChild ? "mr-0" : ""}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {isParent && (
              <button
                onClick={() => toggleCollapse(permiso.id_permiso)}
                className="p-1 hover:bg-blue-100 rounded transition-colors"
              >
                {collapsedModules.has(permiso.id_permiso) ? (
                  <FaChevronRight className="w-5 h-5 text-gray-600" />
                ) : (
                  <FaChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>
            )}
            <div className="flex-1">
              <h3
                className={`font-medium ${isParent ? "text-blue-800" : isChild ? "text-gray-700" : "text-gray-900"}`}
              >
                {permiso.nombre}
              </h3>
              <p className="text-sm text-gray-500">
                ID: {permiso.id_permiso} | Endpoint: /{permiso.endpoint}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {renderCheckbox(
              permiso.id_permiso,
              PERMISSION_BITS.ALL,
              "Todos",
              isParent,
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Gestión de Permisos por Módulos
          </h2>
          <p className="text-sm text-gray-600">
            Los módulos padre controlan automáticamente los permisos de sus
            submódulos
          </p>
        </div>

        <div className="p-6 space-y-4">
          {padres.map((padre) => (
            <div key={padre.id_permiso} className="space-y-2">
              {/* Módulo Padre */}
              {renderPermissionRow(padre, true)}

              {/* Hijos del Módulo (Colapsables) */}
              {!collapsedModules.has(padre.id_permiso) &&
                hijosPorPadre[padre.id_permiso] && (
                  <div className="space-y-2">
                    {hijosPorPadre[padre.id_permiso].map((hijo) =>
                      renderPermissionRow(hijo, false, true),
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>

      {/* Debug Info */}
      {/* <div className="bg-gray-100 rounded-lg p-4"> */}
      {/*   <h3 className="font-semibold mb-2 text-sm">Estado de Permisos (Debug):</h3> */}
      {/*   <pre className="text-xs overflow-x-auto bg-white p-2 rounded border"> */}
      {/*     {JSON.stringify(permissionsState, null, 2)} */}
      {/*   </pre> */}
      {/*   <h3 className="font-semibold mb-2 text-sm mt-4">Permisos Procesados (Debug):</h3> */}
      {/*   <pre className="text-xs overflow-x-auto bg-white p-2 rounded border"> */}
      {/*     {JSON.stringify(processedPermisos, null, 2)} */}
      {/*   </pre> */}
      {/* </div> */}
    </div>
  );
}
