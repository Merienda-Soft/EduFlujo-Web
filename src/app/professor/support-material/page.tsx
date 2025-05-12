'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useUserRoles } from '../../../utils/roleUtils';
import { useRouter, useSearchParams } from 'next/navigation';
import Breadcrumb from '../../../components/Common/Breadcrumb';
import { getCurrentManagementData, isCurrentManagementActive, getManagementGlobal, subscribe } from '../../../utils/globalState';
import { getProfessorByEmail } from '../../../utils/tasksService';
import {
  uploadSupportMaterial,
  getSupportMaterials,
  deleteSupportMaterial,
  SupportMaterial,
} from '../../../utils/supportMaterialService';
import Swal from 'sweetalert2';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../utils/firebase/firebaseConfig';

const getFileIcon = (fileName: string) => {
  if (!fileName) return "📄";
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "📄";
    case "mp4":
    case "mov":
    case "avi":
      return "🎬";
    case "jpg":
    case "jpeg":
    case "png":
      return "🖼️";
    case "doc":
    case "docx":
      return "📝";
    case "xls":
    case "xlsx":
      return "📊";
    case "zip":
    case "rar":
      return "🗜️";
    default:
      return "📎";
  }
};

// Categorías de archivos para el kanban
const FILE_CATEGORIES = [
  {
    key: 'pdf',
    label: 'PDF',
    match: (ext: string) => ext === 'pdf',
    icon: '📄',
  },
  {
    key: 'image',
    label: 'Imágenes',
    match: (ext: string) => ['jpg', 'jpeg', 'png'].includes(ext),
    icon: '🖼️',
  },
  {
    key: 'video',
    label: 'Videos',
    match: (ext: string) => ['mp4', 'mov', 'avi'].includes(ext),
    icon: '🎬',
  },
  {
    key: 'word',
    label: 'Word',
    match: (ext: string) => ['doc', 'docx'].includes(ext),
    icon: '📝',
  },
  {
    key: 'excel',
    label: 'Excel',
    match: (ext: string) => ['xls', 'xlsx'].includes(ext),
    icon: '📊',
  },
  {
    key: 'zip',
    label: 'Comprimidos',
    match: (ext: string) => ['zip', 'rar'].includes(ext),
    icon: '🗜️',
  },
  {
    key: 'other',
    label: 'Otros',
    match: (ext: string) => true, // fallback
    icon: '📎',
  },
];

export default function SupportMaterialPage() {
  const { user, isLoading } = useUser();
  const { hasRole } = useUserRoles();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [professor, setProfessor] = useState<any | null>(null);
  const [materials, setMaterials] = useState<SupportMaterial[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const [selectedManagement, setSelectedManagement] = useState(getCurrentManagementData()?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjectId = searchParams?.get('subjectId');
  const courseId = searchParams?.get('courseId');

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

  // Cargar datos del profesor
  useEffect(() => {
    const loadProfessor = async () => {
      if (!user?.email) return;
      try {
        const data = await getProfessorByEmail(user.email);
        setProfessor(data.professor);
      } catch (error) {
        console.error("Error al cargar los datos del profesor:", error);
      }
    };
    loadProfessor();
  }, [user]);

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
        setMaterials(response.data.sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()));
      } else if (Array.isArray(response)) {
        setMaterials(response.sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()));
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
    // eslint-disable-next-line
  }, [professor, courseId, subjectId, selectedManagement]);

  // Filtros disponibles
  const availableFilters = [
    "all",
    ...Array.from(
      new Set(
        materials.map((m) => m.file.name.split(".").pop()?.toLowerCase()).filter(Boolean)
      )
    ),
  ];

  // Filtrar materiales
  const filteredMaterials =
    filter === "all"
      ? materials
      : materials.filter((m) => m.file.name.split(".").pop()?.toLowerCase() === filter);

  // Subir archivo
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !courseId || !subjectId || !selectedManagement) return;
    setUploading(true);
    try {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        // 1. Subir a Firebase Storage
        const storageRef = ref(storage, `support-material/${courseId}/${subjectId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        // 2. Obtener la URL pública de descarga
        const url = await getDownloadURL(storageRef);
        // 3. Guardar la URL real en tu backend
        const fileData = { name: file.name, url };
        const response = await uploadSupportMaterial(
          Number(courseId),
          Number(subjectId),
          Number(selectedManagement),
          fileData
        );
        if (!response.ok) {
          Swal.fire({ icon: "error", title: "Error", text: response.error || "No se pudo subir el archivo" });
        }
      }
      Swal.fire({ icon: "success", title: "Éxito", text: "Archivo(s) subido(s) correctamente" });
      fetchMaterials();
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Eliminar archivo
  const handleDelete = async (id: number) => {
    Swal.fire({
      title: "¿Eliminar archivo?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        const response = await deleteSupportMaterial(id);
        if (response.ok) {
          Swal.fire("Eliminado", "El archivo ha sido eliminado.", "success");
          fetchMaterials();
        } else {
          Swal.fire("Error", response.error || "No se pudo eliminar el archivo", "error");
        }
        setLoading(false);
      }
    });
  };

  // Agrupar materiales por categoría y filtrar solo las que tienen archivos
  const materialsByCategory = FILE_CATEGORIES.map(cat => ({
    ...cat,
    files: materials.filter(mat => {
      const ext = mat.file.name.split('.').pop()?.toLowerCase() || '';
      if (cat.key !== 'other') {
        const isClassified = FILE_CATEGORIES.slice(0, FILE_CATEGORIES.findIndex(c => c.key === cat.key)).some(prevCat => prevCat.match(ext));
        return !isClassified && cat.match(ext);
      }
      const isClassified = FILE_CATEGORIES.slice(0, -1).some(prevCat => prevCat.match(ext));
      return !isClassified;
    })
  })).filter(cat => cat.files.length > 0);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !hasRole(['professor'])) {
    return null;
  }

  return (
    <div className="">
      <Breadcrumb pageName="Material de Apoyo" description="Gestión de archivos y recursos para la materia" />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Material de Apoyo</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Archivos y recursos para tus estudiantes</p>
            </div>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleUpload}
                accept="*"
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    Subir Material
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Kanban de archivos */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-8 min-w-[900px]">
              {materialsByCategory.map(cat => (
                <div
                  key={cat.key}
                  className="flex-1 min-w-[320px] max-w-[380px] bg-gradient-to-b from-gray-100/80 to-gray-50 dark:from-gray-900/80 dark:to-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">{cat.icon}</span>
                    <span className="font-bold text-xl text-gray-800 dark:text-gray-100 tracking-wide">{cat.label}</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    {cat.files.map((mat: SupportMaterial) => (
                      <div
                        key={mat.id}
                        className="flex items-center gap-3 bg-white/90 dark:bg-gray-800/80 rounded-xl shadow px-4 py-3 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow group"
                      >
                        <a
                          href={mat.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 font-medium text-blue-700 dark:text-blue-300 truncate hover:underline"
                          title={mat.file.name}
                        >
                          {mat.file.name}
                        </a>
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {new Date(mat.submitted_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                        </span>
                        <button
                          onClick={() => handleDelete(mat.id)}
                          className="ml-1 p-1 rounded-full bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-300 transition-colors opacity-70 group-hover:opacity-100"
                          title="Eliminar archivo"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 