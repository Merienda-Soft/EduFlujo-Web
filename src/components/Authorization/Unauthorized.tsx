// components/UnauthorizedAccess.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';

const UnauthorizedAccess = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 p-6">
      <div className="bg-white dark:bg-gray-900 text-center">
        <div className="h-80 relative mb-6">
          <Image
            src="/images/unauthorized/unauthorized.jpg" 
            alt="Acceso no autorizado"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
          Acceso Restringido
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          No tienes los permisos necesarios para ver esta página.
        </p>
        
        <Link 
          href="/" 
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedAccess;