"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupportMaterials } from "../../../utils/supportMaterialService";
import { DocumentIcon, PhotoIcon, VideoCameraIcon, DocumentTextIcon, TableCellsIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import Swal from "sweetalert2";
import { resolve } from "path";

const FILE_CATEGORIES = [
  {
    key: 'pdf',
    label: 'PDF',
    match: (ext: string) => ext === 'pdf',
    icon: DocumentTextIcon,
  },
  {
    key: 'image',
    label: 'Imágenes',
    match: (ext: string) => ['jpg', 'jpeg', 'png'].includes(ext),
    icon: PhotoIcon,
  },
  {
    key: 'video',
    label: 'Videos',
    match: (ext: string) => ['mp4', 'mov', 'avi'].includes(ext),
    icon: VideoCameraIcon,
  },
  {
    key: 'word',
    label: 'Word',
    match: (ext: string) => ['doc', 'docx'].includes(ext),
    icon: DocumentIcon,
  },
  {
    key: 'excel',
    label: 'Excel',
    match: (ext: string) => ['xls', 'xlsx'].includes(ext),
    icon: TableCellsIcon,
  },
  {
    key: 'zip',
    label: 'Comprimidos',
    match: (ext: string) => ['zip', 'rar'].includes(ext),
    icon: ArchiveBoxIcon,
  },
  {
    key: 'other',
    label: 'Otros',
    match: (ext: string) => true,
    icon: DocumentIcon,
  },
];

export default function SupportMaterialPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);

  const subjectId = searchParams.get("subjectId");
  const courseId = searchParams.get("courseId");
  const managementId = searchParams.get("managementId");
  const materiaName = searchParams.get("materiaName");

  // Cargar materiales
  const fetchMaterials = async () => {
    if (!courseId || !subjectId || !managementId) return;
    setLoading(true);
    try {
      const response = await getSupportMaterials(
        Number(courseId),
        Number(subjectId),
        Number(managementId)
      );
      console.log(response)
      if (response.ok && response.data) {
        setMaterials(response.data.sort((a: any, b: any) => 
          new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        ));
      } else if (Array.isArray(response)) {
        setMaterials(response.sort((a: any, b: any) => 
          new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        ));
      } else {
        setMaterials([]);
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los archivos" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [courseId, subjectId, managementId]);

  // Filtrar materiales por categoría
  const materialsByCategory = FILE_CATEGORIES.map(cat => ({
    ...cat,
    files: materials.filter((mat: any) => {
      const ext = mat.file.name.split('.').pop()?.toLowerCase() || '';
      if (cat.key !== 'other') {
        const isClassified = FILE_CATEGORIES.slice(0, FILE_CATEGORIES.findIndex(c => c.key === cat.key))
          .some(prevCat => prevCat.match(ext));
        return !isClassified && cat.match(ext);
      }
      const isClassified = FILE_CATEGORIES.slice(0, -1).some(prevCat => prevCat.match(ext));
      return !isClassified;
    })
  })).filter(cat => cat.files.length > 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 lg:pt-[150px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 lg:pt-[150px]">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Material de Apoyo</h1>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">{materiaName}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Gestión {managementId}</span>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Volver
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lista de archivos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Archivos Disponibles</h2>
          
          {materials.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No hay archivos disponibles
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materialsByCategory.map(cat => (
                <div
                  key={cat.key}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <cat.icon className="h-6 w-6 text-blue-500" />
                    <h3 className="font-medium text-gray-900 dark:text-white">{cat.label}</h3>
                  </div>
                  <div className="space-y-2">
                    {cat.files.map((mat: any) => (
                      <div
                        key={mat.id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow"
                      >
                        <a
                          href={mat.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 font-medium text-blue-600 dark:text-blue-400 truncate hover:underline"
                          title={mat.file.name}
                          onClick={(e) => {
                            e.preventDefault();
                            if (mat.file.url.startsWith('blob:')) {
                              Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'No se puede acceder a este archivo directamente. Por favor, contacta al profesor.'
                              });
                            } else {
                              window.open(mat.file.url, '_blank', 'noopener,noreferrer');
                            }
                          }}
                        >
                          {mat.file.name}
                        </a>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
                          {formatDate(mat.submitted_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 