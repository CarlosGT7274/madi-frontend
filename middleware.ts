import { NextRequest, NextResponse } from "next/server";

// Función para verificar si el token está expirado
function isTokenExpired(token: string) {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
}

// Función para construir rutas permitidas desde los permisos
function buildAllowedRoutes(permisos: User["permisos"]) {
  const allowedRoutes = ["/dashboard"]; // Dashboard siempre permitido si está autenticado

  if (!permisos) {
    console.log("⚠️ No hay permisos definidos, retornando rutas básicas");
    return allowedRoutes;
  }

  Object.values(permisos).forEach((permiso) => {
    if (permiso.valor > 0) {
      // Para rutas bajo /dashboard/
      allowedRoutes.push(`/dashboard/${permiso.endpoint}`);

      if (permiso.sub_permisos) {
        Object.values(permiso.sub_permisos).forEach((subPermiso) => {
          if (subPermiso.valor > 0) {
            allowedRoutes.push(
              `/dashboard/${permiso.endpoint}/${subPermiso.endpoint}`,
            );
          }
        });
      }
    }
  });

  return allowedRoutes;
}

// Función para verificar si una ruta está permitida
function hasPermissionForRoute(currentPath: string, allowedRoutes: string[]) {
  // Rutas públicas
  const publicRoutes = ["/auth/login", "/unauthorized", "/"];

  if (publicRoutes.includes(currentPath)) {
    return true;
  }

  // Verificar coincidencia EXACTA primero
  if (allowedRoutes.includes(currentPath)) {
    return true;
  }

  // Para rutas dinámicas (como [id]), verificar si el padre está permitido
  // Solo permitir sub-rutas si la ruta exacta del padre está permitida
  const pathSegments = currentPath.split("/").filter(Boolean);

  if (pathSegments.length > 2) {
    // /dashboard/algo/subalgo
    const parentPath = "/" + pathSegments.slice(0, -1).join("/");

    // Solo permitir si el padre exacto está en las rutas permitidas
    // Y si no es una ruta de sub-permiso específica
    if (allowedRoutes.includes(parentPath)) {
      // Verificar si es una ruta dinámica (contiene [id] o similar)
      // o si es una sub-ruta válida
      const lastSegment = pathSegments[pathSegments.length - 1];

      const validActionRoutes = ["create", "levantamiento"];
      if (validActionRoutes.includes(lastSegment)) {
        return true;
      }

      // Si parece un ID (número), permitir
      // if (/^\d+$/.test(lastSegment)) {
      //   return true;
      // }
      if (/^[\w-]+$/.test(lastSegment)) {
        return true;
      }

      // Si no, debe estar explícitamente permitida
      return false;
    }
  }

  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("🔍 Middleware ejecutándose para:", pathname);

  // 1. Obtener cookies usando los nombres de tu AuthContext
  const tokenCookie = request.cookies.get("token");
  const usuarioCookie = request.cookies.get("usuario");

  console.log("🍪 Token cookie:", !!tokenCookie);
  console.log("🍪 Usuario cookie:", !!usuarioCookie);

  // 2. Si no hay datos de usuario o token
  if (!tokenCookie || !usuarioCookie) {
    console.log("❌ No se encontraron cookies de autenticación");
    if (
      pathname !== "/auth/login" &&
      pathname !== "/" &&
      pathname !== "/unauthorized"
    ) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    return NextResponse.next();
  }

  let userData;
  try {
    userData = JSON.parse(usuarioCookie.value);
  } catch (error) {
    console.log("❌ Error parseando datos de usuario:", error);
    // Limpiar cookies corruptas
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.delete("token");
    response.cookies.delete("usuario");
    return response;
  }

  // 3. Verificar si el token está expirado
  if (isTokenExpired(tokenCookie.value)) {
    console.log("❌ Token expirado");
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.delete("token");
    response.cookies.delete("usuario");
    return response;
  }

  // 4. Si está autenticado y va a login, redirigir al dashboard
  if (pathname === "/auth/login") {
    console.log(
      "✅ Usuario autenticado yendo a /auth/login, redirigiendo a /dashboard",
    );
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 5. Si va a la raíz y está autenticado, redirigir al dashboard
  if (pathname === "/") {
    console.log("✅ Usuario autenticado en raíz, redirigiendo a /dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 6. Verificar permisos solo para rutas bajo /dashboard/
  if (pathname.startsWith("/dashboard")) {
    if (!userData.permisos) {
      console.log("❌ No se encontraron permisos en userData");
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    const allowedRoutes = buildAllowedRoutes(userData.permisos);
    console.log("📋 Rutas permitidas:", allowedRoutes);

    if (!hasPermissionForRoute(pathname, allowedRoutes)) {
      console.log("🚫 Acceso denegado para la ruta:", pathname);
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  console.log("✅ Acceso permitido para la ruta:", pathname);
  return NextResponse.next();
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    /*
     * Coincide con todos los paths de request excepto los que empiecen con:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - archivos estáticos (.png, .jpg, .svg, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
