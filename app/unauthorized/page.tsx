export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          Acceso Denegado
        </h1>
        <p className="text-gray-600 mb-8">
          No tienes permisos para acceder a esta página.
        </p>
        <a 
          href="/dashboard" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Volver al Dashboard
        </a>
      </div>
    </div>
  );
}
