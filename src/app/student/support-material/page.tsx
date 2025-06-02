"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupportMaterials } from "../../../utils/supportMaterialService";
import { ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Swal from "sweetalert2";
import { resolve } from "path";
import { getCurrentManagementData, getManagementGlobal, subscribe } from "../../../utils/globalState";

const FILE_ICONS = {
  'pdf': '/images/file-icons/pdf.png',
  'doc': '/images/file-icons/word.png',
  'docx': '/images/file-icons/word.png',
  'xls': '/images/file-icons/excel.png',
  'xlsx': '/images/file-icons/excel.png',
  'ppt': '/images/file-icons/powerpoint.png',
  'pptx': '/images/file-icons/powerpoint.png',
  'jpg': '/images/file-icons/image.png',
  'jpeg': '/images/file-icons/image.png',
  'png': '/images/file-icons/image.png',
  'gif': '/images/file-icons/image.png',
  'mp4': '/images/file-icons/video.png',
  'mov': '/images/file-icons/video.png',
  'avi': '/images/file-icons/video.png',
  'txt': '/images/file-icons/txt.png',
  'zip': '/images/file-icons/zip.png',
  'default': '/images/file-icons/file.png'
};

const FILE_CATEGORIES = [
  {
    key: 'all',
    label: 'Todos',
    match: () => true
  },
  {
    key: 'pdf',
    label: 'PDF',
    match: (ext: string) => ext === 'pdf'
  },
  {
    key: 'image',
    label: 'Imágenes',
    match: (ext: string) => ['jpg', 'jpeg', 'png', 'gif'].includes(ext)
  },
  {
    key: 'video',
    label: 'Videos',
    match: (ext: string) => ['mp4', 'mov', 'avi'].includes(ext)
  },
  {
    key: 'word',
    label: 'Word',
    match: (ext: string) => ['doc', 'docx'].includes(ext)
  },
  {
    key: 'excel',
    label: 'Excel',
    match: (ext: string) => ['xls', 'xlsx'].includes(ext)
  },
  {
    key: 'powerpoint',
    label: 'PowerPoint',
    match: (ext: string) => ['ppt', 'pptx'].includes(ext)
  },
  {
    key: 'zip',
    label: 'Comprimidos',
    match: (ext: string) => ['zip', 'rar'].includes(ext)
  },
  {
    key: 'other',
    label: 'Otros',
    match: (ext: string) => true
  }
];

export default function SupportMaterialPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [filterIndex, setFilterIndex] = useState(0);
  const [availableFilters, setAvailableFilters] = useState([]);

  const subjectId = searchParams.get("subjectId");
  const courseId = searchParams.get("courseId");
  const [selectedManagement, setSelectedManagement] = useState(getCurrentManagementData()?.id);
  const materiaName = searchParams.get("materiaName");

  // Suscribirse a cambios en la gestión
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      const { id } = getManagementGlobal();
      if (id) {
        setSelectedManagement(id);
      }
    });
    return unsubscribe;
  }, []);

  // Cargar materiales
  const fetchMaterials = async () => {
    if (!courseId || !subjectId || !selectedManagement) return;
    setLoading(true);
    try {
      const response = await getSupportMaterials(
        Number(courseId),
        Number(subjectId),
        Number(selectedManagement)
      );
      
      if (response.ok && response.data) {
        const sortedMaterials = response.data.sort((a: any, b: any) => 
          new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        );
        setMaterials(sortedMaterials);
        updateAvailableFilters(sortedMaterials);
      } else if (Array.isArray(response)) {
        const sortedMaterials = response.sort((a: any, b: any) => 
          new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        );
        setMaterials(sortedMaterials);
        updateAvailableFilters(sortedMaterials);
      } else {
        setMaterials([]);
        setAvailableFilters([]);
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los archivos" });
    } finally {
      setLoading(false);
    }
  };

  // Actualizar los filtros disponibles basados en los materiales
  const updateAvailableFilters = (materials: any[]) => {
    const extensions = new Set();
    
    materials.forEach((mat: any) => {
      const ext = mat.file.name.split('.').pop()?.toLowerCase() || '';
      extensions.add(ext);
    });

    const available = FILE_CATEGORIES.filter(cat => {
      if (cat.key === 'all') return true;
      if (cat.key === 'other') {
        return Array.from(extensions).some(ext => {
          const isOther = FILE_CATEGORIES
            .filter(c => c.key !== 'all' && c.key !== 'other')
            .every(c => !c.match(ext as string));
          return isOther;
        });
      }
      return Array.from(extensions).some(ext => cat.match(ext as string));
    });

    setAvailableFilters(available);
    setFilterIndex(0); // Resetear al filtro "Todos" cuando cambian los materiales
  };

  useEffect(() => {
    if (selectedManagement) {
      fetchMaterials();
    }
  }, [courseId, subjectId, selectedManagement]);

  const handlePrevFilter = () => {
    setFilterIndex(prev => (prev > 0 ? prev - 1 : availableFilters.length - 1));
  };

  const handleNextFilter = () => {
    setFilterIndex(prev => (prev < availableFilters.length - 1 ? prev + 1 : 0));
  };

  // Filtrar materiales según la selección
  const filteredMaterials = materials.filter((mat: any) => {
    const currentFilter = availableFilters[filterIndex];
    if (!currentFilter) return true;
    
    if (currentFilter.key === 'all') return true;
    if (currentFilter.key === 'other') {
      const ext = mat.file.name.split('.').pop()?.toLowerCase() || '';
      return FILE_CATEGORIES
        .filter(c => c.key !== 'all' && c.key !== 'other')
        .every(c => !c.match(ext));
    }
    
    const ext = mat.file.name.split('.').pop()?.toLowerCase() || '';
    return currentFilter.match(ext);
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    for (const [key, value] of Object.entries(FILE_ICONS)) {
      if (key === extension) return value;
    }
    return FILE_ICONS['default'];
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
                <span className="text-sm text-gray-500 dark:text-gray-400">Gestión {selectedManagement}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {availableFilters.length > 1 && (
                <div className="flex items-center gap-2 mr-9">
                  <button
                    onClick={handlePrevFilter}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-700"
                    title="Categoría anterior"
                  >
                    <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[100px] text-center">
                    {availableFilters[filterIndex]?.label || 'Todos'}
                  </span>
                  <button
                    onClick={handleNextFilter}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-700"
                    title="Siguiente categoría"
                  >
                    <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              )}
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                title="Volver"
              >
                 <ArrowLeftIcon className="h-5 w-5" /> Volver
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lista de archivos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {filteredMaterials.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No hay archivos disponibles
            </p>
          ) : (
            <div className="space-y-4">
              {filteredMaterials.map((mat: any) => {
                const ext = mat.file.name.split('.').pop()?.toLowerCase() || '';
                const fileSize = mat.file.size ? `(${(mat.file.size / 1024 / 1024).toFixed(2)} MB)` : '';
                
                return (
                  <div
                    key={mat.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <img 
                        src={getFileIcon(mat.file.name)} 
                        alt="File icon" 
                        className="h-10 w-10 object-contain"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate" title={mat.file.name}>
                          {mat.file.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(mat.submitted_at)} {fileSize}
                        </p>
                      </div>
                    </div>
                    <a
                      href={mat.file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      title="Descargar"
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
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}