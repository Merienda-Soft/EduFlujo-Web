'use client';

import { useUserRoles } from '../../utils/roleUtils';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Breadcrumb from '../../components/Common/Breadcrumb';
import { getProfessorByEmail, getActivities } from '../../utils/tasksService';
import { getYearManagements } from '../../utils/managementService';
import { getManagementGlobal, setManagementGlobal, subscribe } from '../../utils/globalState';
import { getStudentCredentials } from '../../utils/credentialsService';
import Cookies from 'js-cookie';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon, AcademicCapIcon, EyeIcon, EyeSlashIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';

// Iconos por materia
const subjectIcons: Record<string, JSX.Element> = {
  matematicas: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4h2a2 2 0 012 2v2m0 0V6a2 2 0 00-2-2h-2m2 2v2m0 0H6m0 0V6a2 2 0 012-2h2m-2 2v2m0 0v2m0 0H4a2 2 0 00-2 2v2m0 0v2a2 2 0 002 2h2m0-2v2m0 0h2a2 2 0 002-2v-2m0 0v-2m0 0h2a2 2 0 002 2v2m0 0v2a2 2 0 01-2 2h-2" /></svg>
  ),
  lenguaje: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20l9-5-9-5-9 5 9 5zm0-10V4m0 0L3 9m9-5l9 5" /></svg>
  ),
  ciencias: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m4 0h-1v4h-1m-4 0h1v-4h1m-4 0h1v4h1" /></svg>
  ),
  historia: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  ingles: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
  ),
  // ... puedes agregar más materias aquí
};
const getSubjectIcon = (nombre: string) => {
  const key = nombre.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, "");
  return subjectIcons[key] || (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
  );
};

// Task filters
const TASK_FILTERS = {
  ALL: 'Todas',
  ACTIVE: 'Creadas',
  TO_REVIEW: 'Para Revisar'
};

// Month names
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function ProfessorCoursesPage() {
  const { hasRole } = useUserRoles();
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [assignments, setAssignments] = useState([]);
  const [professor, setProfessor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [managements, setManagements] = useState([]);
  const [selectedManagement, setSelectedManagement] = useState(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [popoverIdx, setPopoverIdx] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [currentDate, setCurrentDate] = useState(() => {
    const currentMonth = new Date().getMonth();
    return new Date(getManagementGlobal()?.year || new Date().getFullYear(), currentMonth, 1);
  });
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [credentialsData, setCredentialsData] = useState([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [credentialsError, setCredentialsError] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

  // Inicializar gestión activa desde cookie o globalState
  useEffect(() => {
    let initialManagement = null;
    const stored = Cookies.get('managementGlobal');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.year === 'number' && typeof parsed.id === 'number') {
          initialManagement = parsed.id;
        }
      } catch {}
    }
    if (!initialManagement && getManagementGlobal()?.id) {
      initialManagement = getManagementGlobal().id;
    }
    setSelectedManagement(initialManagement);
  }, []);

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

  // Cargar gestiones
  useEffect(() => {
    const fetchManagements = async () => {
      try {
        const data = await getYearManagements();
        setManagements(data);
      } catch {}
    };
    fetchManagements();
  }, []);

  // Cargar cursos del profesor según gestión seleccionada
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email || !selectedManagement) return;
      setLoading(true);
      try {
        const data = await getProfessorByEmail(user.email);
        setProfessor(data.professor);
        // Filtrar por la gestión seleccionada
        const filtered = (data.professor.assignments || []).filter(a => a.management_id === selectedManagement);
        setAssignments(filtered);
      } catch (e) {
        setError('No se pudieron cargar los cursos.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.email && selectedManagement) fetchData();
  }, [user, selectedManagement]);

  useEffect(() => {
    if (!isLoading && !hasRole(['professor'])) {
      router.push('/');
    }
  }, [isLoading, hasRole, router]);

  // Cerrar popover al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPopoverIdx(null);
      }
    }
    if (popoverIdx !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverIdx]);

  const handleSubjectClick = (subjectId: number, courseId: number) => {
    if (!subjectId || !courseId) return;
    router.push(`/professor/tasks/${subjectId}?courseId=${Number(courseId)}`);
  };

  const openCredentialsModal = async (courseId: number) => {
    setCredentialsModalOpen(true);
    setLoadingCredentials(true);
    setCredentialsError('');
    try {
      const data = await getStudentCredentials(selectedManagement, courseId);
      setCredentialsData(data);
    } catch (e) {
      setCredentialsError('No se pudieron cargar las credenciales.');
    } finally {
      setLoadingCredentials(false);
    }
  };

  const togglePasswordVisibility = (index: number) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const copyPasswordToClipboard = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      // Aquí podrías agregar un toast o notificación de éxito
    } catch (err) {
      console.error('Error al copiar la contraseña:', err);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (newDate.getMonth() === 0) {
        newDate.setMonth(11);
      } else {
        newDate.setMonth(prev.getMonth() - 1);
      }
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (newDate.getMonth() === 11) {
        newDate.setMonth(0);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getTaskCountByFilter = (filterKey) => {
    const now = new Date();
    return tasks.filter(task => {
      const taskCreateDate = new Date(task.createDate);
      const matchesMonth = taskCreateDate.getMonth() === currentDate.getMonth() && 
                          taskCreateDate.getFullYear() === currentDate.getFullYear();
      
      if (!matchesMonth) return false;

      switch (filterKey) {
        case 'ACTIVE':
          return task.end_date > now && task.type !== 1;
        case 'TO_REVIEW':
          return task.end_date <= now || task.type === 1;
        default: // 'ALL'
          return true;
      }
    }).length;
  };

  const filteredTasks = useMemo(() => {
    const now = new Date();
    
    return tasks.filter(task => {
      const taskCreateDate = new Date(task.createDate);
      const matchesSearch = task.name.toLowerCase().includes(searchValue.toLowerCase());
      const matchesMonth = taskCreateDate.getMonth() === currentDate.getMonth() && 
                         taskCreateDate.getFullYear() === currentDate.getFullYear();

      let matchesFilter = true;
      switch (taskFilter) {
        case 'ACTIVE':
          matchesFilter = task.end_date > now && task.type !== 1;
          break;
        case 'TO_REVIEW':
          matchesFilter = task.end_date <= now || task.type === 1;
          break;
        default: // 'ALL'
          matchesFilter = true;
      }

      return matchesSearch && matchesMonth && matchesFilter;
    });
  }, [tasks, searchValue, currentDate, taskFilter]);

  if (isLoading || loading) {
    return <div>Cargando...</div>;
  }

  if (!user || !hasRole(['professor'])) {
    return null;
  }

  return (
    <>
      <Breadcrumb pageName="Cursos" description="Lista de cursos y materias asignadas al profesor" />
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {assignments.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">No tienes cursos asignados en esta gestión.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.values(assignments.reduce((acc, a) => {
                const key = `${a.course?.course}-${a.course?.parallel?.trim()}`;
                if (!acc[key]) {
                  acc[key] = {
                    course: a.course?.course,
                    parallel: a.course?.parallel?.trim(),
                    courseId: a.course?.id,
                    materias: [],
                  };
                }
                acc[key].materias.push({
                  id: a.subject?.id,
                  nombre: a.subject?.subject,
                  quarter: a.quarter,
                });
                return acc;
              }, {} as Record<string, { course: string; parallel: string; courseId: number; materias: { id: number; nombre: string; quarter: string }[] }>))
                .map((c, idx) => c as { course: string; parallel: string; courseId: number; materias: { id: number; nombre: string; quarter: string }[] })
                .map((c, idx) => {
                  const isOpen = popoverIdx === idx;
                  return (
                    <div key={idx} className="relative">
                      <div className={`w-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-2 border-transparent hover:border-blue-400 transition-all duration-300 overflow-hidden flex flex-col ${isOpen ? 'ring-2 ring-blue-400' : ''}`}>
                        <button
                          className="w-full p-0 focus:outline-none group flex flex-col"
                          onClick={() => setPopoverIdx(isOpen ? null : idx)}
                          aria-expanded={isOpen}
                          tabIndex={0}
                          type="button"
                        >
                          <div className="w-full h-36 md:h-40 lg:h-44 bg-blue-100 dark:bg-blue-800 flex items-center justify-center overflow-hidden rounded-t-2xl">
                             <Image src='/images/cursos.jpg' alt="Curso" className="w-full h-full object-cover" width={500} height={500}/>
                          </div>
                          <div className="flex-1 flex flex-col items-center justify-center p-4">
                            <span className="text-xl font-bold text-primary mb-1 text-center w-full truncate">{c.course}</span>
                            <span className="text-base text-gray-600 dark:text-gray-300 mb-2">Paralelo: <span className="font-semibold">{c.parallel}</span></span>
                            <span className="text-sm text-blue-500 dark:text-blue-300 font-medium mt-2">{isOpen ? 'Escoge una materia' : 'Ver materias'}</span>
                          </div>
                        </button>
                        {isOpen && (
                          <div className="absolute inset-0 z-50 flex items-center justify-center">
                            <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50" />
                            <div
                              ref={popoverRef}
                              className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-900 border-2 border-blue-400 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-fadeIn"
                              style={{ minWidth: '80%', maxWidth: '90%' }}
                            >
                              <button
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
                                onClick={() => setPopoverIdx(null)}
                                aria-label="Cerrar"
                              >
                                ×
                              </button>
                              <div className="mb-4">
                                <span className="block text-xl font-bold text-primary mb-1">{c.course}</span>
                                <span className="block text-base text-gray-600 dark:text-gray-300">Paralelo: <span className="font-semibold">{c.parallel}</span></span>
                              </div>
                              <ul className="flex flex-col gap-3">
                                {c.materias.map((m) => (
                                  <li key={m.id}>
                                    <button
                                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100 text-lg font-semibold shadow hover:bg-blue-200 dark:hover:bg-blue-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                                      onClick={() => handleSubjectClick(m.id, c.courseId)}
                                      type="button"
                                      tabIndex={0}
                                    >
                                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-700 text-blue-700 dark:text-blue-100">
                                        {getSubjectIcon(m.nombre)}
                                      </span>
                                      <span className="text-lg font-semibold">{m.nombre}</span>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                              <button className="w-full flex items-center justify-center px-4 py-2 mt-4 text-sm font-semibold text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-800 rounded-lg shadow hover:bg-blue-200 dark:hover:bg-blue-700 transition" onClick={() => openCredentialsModal(c.courseId)}>Credenciales</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Tasks Modal */}
        {selectedSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50" />
            <div className="relative w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
                onClick={() => {
                  setSelectedSubject(null);
                  setTasks([]);
                }}
                aria-label="Cerrar"
              >
                ×
              </button>
              
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tareas</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Gestión {managements.find(m => m.id === selectedManagement)?.management}
                </p>
              </div>

              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar tarea..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>

                {/* Month Navigator */}
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                  >
                    <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {MONTH_NAMES[currentDate.getMonth()]}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                  >
                    <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>

                {/* Status Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {Object.entries(TASK_FILTERS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setTaskFilter(key)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap ${
                        taskFilter === key
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-sm ${
                        taskFilter === key
                          ? 'bg-white text-blue-500'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {getTaskCountByFilter(key)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {loadingTasks ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando actividades...</p>
                  </div>
                ) : tasksError ? (
                  <div className="text-red-500 text-center py-8">{tasksError}</div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No hay tareas para este mes
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${
                              task.type === 1
                                ? 'bg-purple-500'
                                : task.end_date > new Date()
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                            }`} />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {task.name}
                            </h3>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-3">
                            {task.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              <span>Creada: {new Date(task.createDate).toLocaleDateString()}</span>
                            </div>
                            {task.type !== 1 && (
                              <div className="flex items-center gap-1">
                                <ClockIcon className="h-4 w-4" />
                                <span>Entrega: {new Date(task.end_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                            <AcademicCapIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {task.dimension}
                            </span>
                          </div>
                          <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">
                            {task.weight}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Credentials Modal */}
        {credentialsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50" />
            <div className="relative w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
                onClick={() => {
                  setCredentialsModalOpen(false);
                  setCredentialsData([]);
                }}
                aria-label="Cerrar"
              >
                ×
              </button>
              
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Credenciales de Estudiantes</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Gestión {managements.find(m => m.id === selectedManagement)?.management}
                </p>
              </div>

              {/* Credentials List */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {loadingCredentials ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando credenciales...</p>
                  </div>
                ) : credentialsError ? (
                  <div className="text-red-500 text-center py-8">{credentialsError}</div>
                ) : credentialsData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No hay credenciales disponibles
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-transparent border-collapse">
                      <thead className="bg-gray-200 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                            Nombre Estudiante
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                            Contraseña
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                            
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {credentialsData.map((cred, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 bg-transparent">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {cred.fullName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {cred.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-mono">
                              {visiblePasswords[index] ? cred.temp_password : '••••••••'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              <div className="flex items-center justify-end">
                                <button
                                  onClick={() => togglePasswordVisibility(index)}
                                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1 rounded"
                                  title={visiblePasswords[index] ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                  {visiblePasswords[index] ? (
                                    <EyeSlashIcon className="h-6 w-6" />
                                  ) : (
                                    <EyeIcon className="h-6 w-6" />
                                  )}
                                </button>
                                <button
                                  onClick={() => copyPasswordToClipboard(cred.temp_password)}
                                  className="pl-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1 rounded"
                                  title="Copiar contraseña"
                                >
                                  <ClipboardDocumentIcon className="h-6 w-6" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease;
}
`}</style>
    </>
  );
}