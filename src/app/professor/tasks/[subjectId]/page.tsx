'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon, AcademicCapIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getActivities, createActivity, updateActivity, deleteActivity } from '../../../../utils/tasksService';
import { useUser } from '@auth0/nextjs-auth0/client';
import { getProfessorByEmail } from '../../../../utils/tasksService';
import { managementGlobal } from '../../../../utils/globalState';
import Swal from 'sweetalert2';

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

export default function TasksPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const [professor, setProfessor] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [currentDate, setCurrentDate] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    ponderacion: '',
    descripcion: '',
    tipo: '1',
    type: 0 // 0 = tarea para entregar, 1 = tarea solo para calificar
  });

  // Estado para edición
  const [editTask, setEditTask] = useState(null);
  const [updating, setUpdating] = useState(false);

  const DIMENSION_OPTIONS = [
    { value: '1', text: 'Ser' },
    { value: '2', text: 'Saber' },
    { value: '3', text: 'Hacer' },
    { value: '4', text: 'Decidir' },
  ];

  // Extract courseId from query string robustly
  const courseIdRaw = searchParams?.get('courseId');
  const courseId = courseIdRaw && !isNaN(Number(courseIdRaw)) ? Number(courseIdRaw) : null;

  // Load professor data
  useEffect(() => {
    const loadProfessor = async () => {
      if (!user?.email) return;
      try {
        const data = await getProfessorByEmail(user.email);
        setProfessor(data.professor);
      } catch (error) {
        setError('Error al cargar los datos del profesor');
      }
    };
    loadProfessor();
  }, [user]);

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      if (!professor || !params.subjectId || !courseId) return;
      setLoading(true);
      setError('');
      try {
        const activities = await getActivities(
          params.subjectId.toString(),
          courseId.toString(),
          professor.id.toString(),
          managementGlobal?.id.toString()
        );
        const normalized = activities.map(normalizeTask);
        setTasks(normalized);
      } catch (error) {
        if (error.message === 'NO_TASKS') {
          setTasks([]);
        } else {
          setError('Error al cargar las actividades');
        }
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    };
    loadTasks();
  }, [professor, params.subjectId, courseId]);

  useEffect(() => {
    const currentMonth = new Date().getMonth();
    setCurrentDate(new Date(managementGlobal?.year || new Date().getFullYear(), currentMonth, 1));
  }, []);

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
      const taskEndDate = new Date(task.endDate);
      const matchesMonth = taskEndDate.getMonth() === currentDate.getMonth() && 
                          taskEndDate.getFullYear() === currentDate.getFullYear();
      if (!matchesMonth) return false;
      switch (filterKey) {
        case 'ACTIVE':
          return taskEndDate > now && task.type !== 1;
        case 'TO_REVIEW':
          return taskEndDate <= now || task.type === 1;
        default: // 'ALL'
          return true;
      }
    }).length;
  };

  const filteredTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter(task => {
      const taskEndDate = new Date(task.endDate);
      const matchesSearch = task.name.toLowerCase().includes(searchValue.toLowerCase());
      const matchesMonth = taskEndDate.getMonth() === currentDate.getMonth() && 
                          taskEndDate.getFullYear() === currentDate.getFullYear();
      let matchesFilter = true;
      switch (taskFilter) {
        case 'ACTIVE':
          matchesFilter = taskEndDate > now && task.type !== 1;
          break;
        case 'TO_REVIEW':
          matchesFilter = taskEndDate <= now || task.type === 1;
          break;
        default: // 'ALL'
          matchesFilter = true;
      }
      return matchesSearch && matchesMonth && matchesFilter;
    });
  }, [tasks, searchValue, currentDate, taskFilter]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxToggle = () => {
    setFormData(prev => ({ ...prev, type: prev.type === 0 ? 1 : 0 }));
  };

  const validateForm = () => {
    const { name, date, ponderacion, descripcion } = formData;
    if (!name || !date || !ponderacion || !descripcion) {
      setFormError('Por favor, completa todos los campos requeridos.');
      return false;
    }
    if (!courseId) {
      setFormError('No se pudo identificar el curso. Intenta ingresar desde la lista de cursos.');
      return false;
    }
    const pondValue = Number(ponderacion);
    if (isNaN(pondValue) || pondValue <= 0 || pondValue > 100) {
      setFormError('La ponderación debe ser un número entre 1 y 100.');
      return false;
    }
    // Validar fechas
    const now = new Date();
    const endDate = new Date(formData.date);
    endDate.setHours(23, 59, 59, 999);
    if (endDate <= now) {
      setFormError('La fecha de entrega debe ser posterior a la fecha y hora actual.');
      return false;
    }
    setFormError('');
    return true;
  };

  // Función para recargar tareas desde el backend (con pequeño delay si es necesario)
  const fetchTasks = async (professorId, subjectId, courseId, retry = 0) => {
    try {
      const activities = await getActivities(
        subjectId.toString(),
        courseId.toString(),
        professorId.toString(),
        managementGlobal?.id.toString()
      );
      const normalized = activities.map(normalizeTask);
      setTasks(normalized);
      // Si acabamos de crear/editar y la tarea no aparece, reintenta una vez después de 500ms
      if (retry < 1 && editTask === null && showCreateModal === false && formData.name && !normalized.some(t => t.name === formData.name)) {
        setTimeout(() => fetchTasks(professorId, subjectId, courseId, retry + 1), 500);
      }
    } catch (error) {
      if (error.message === 'NO_TASKS') {
        setTasks([]);
      } else {
        setError('Error al cargar las actividades');
      }
    }
  };

  // MODAL: Crear/Editar tarea
  const isEditing = !!editTask;
  const modalTitle = isEditing ? 'Editar Tarea' : 'Nueva Tarea';
  const modalButton = isEditing ? (updating ? 'Actualizando...' : 'Actualizar Tarea') : (creating ? 'Creando...' : 'Crear Tarea');

  const openEditModal = (task) => {
    setEditTask(task);
    setFormData({
      name: task.name,
      date: task.endDate ? task.endDate.slice(0, 10) : '',
      ponderacion: String(task.weight),
      descripcion: task.description,
      tipo: String(task.dimension_id),
      type: task.type
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditTask(null);
    setFormError('');
    setFormData({ name: '', date: '', ponderacion: '', descripcion: '', tipo: '1', type: 0 });
  };

  const handleCreateOrUpdateTask = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (isEditing) {
      setUpdating(true);
    } else {
      setCreating(true);
    }
    setFormError('');
    try {
      const now = new Date();
      const startDate = isEditing ? editTask.startDate : now.toISOString();
      const endDate = new Date(formData.date);
      endDate.setHours(23, 59, 59, 999);
      const endDateISO = endDate.toISOString();
      if (isEditing) {
        // UPDATE
        const updatePayload = {
            id: editTask.id,
            name: formData.name,
            description: formData.descripcion,
            dimension_id: Number(formData.tipo),
            management_id: Number(managementGlobal?.id),
            professor_id: Number(professor.id),
            subject_id: Number(params.subjectId),
            course_id: courseId,
            weight: Number(formData.ponderacion),
            is_autoevaluation: 0,
            quarter: 'Q1',
            start_date: editTask.startDate,
            end_date: endDateISO
        };
        await updateActivity(editTask.id, updatePayload);
        Swal.fire({
          icon: 'success',
          title: 'Tarea actualizada',
          text: 'La tarea se actualizó correctamente.',
          timer: 1800,
          showConfirmButton: false
        });
      } else {
        // CREATE
        const newTask = {
          task: {
            name: formData.name,
            description: formData.descripcion,
            dimension_id: Number(formData.tipo),
            management_id: Number(managementGlobal?.id),
            professor_id: Number(professor.id),
            subject_id: Number(params.subjectId),
            course_id: courseId,
            weight: Number(formData.ponderacion),
            is_autoevaluation: 0,
            quarter: 'Q1',
            type: formData.type,
            start_date: startDate,
            end_date: endDateISO
          }
        };
        await createActivity(newTask);
        Swal.fire({
          icon: 'success',
          title: 'Tarea creada',
          text: 'La tarea se creó correctamente.',
          timer: 1800,
          showConfirmButton: false
        });
      }
      closeModal();
      await fetchTasks(professor.id, params.subjectId, courseId);
    } catch (error) {
      setFormError(isEditing ? 'No se pudo actualizar la tarea.' : 'No se pudo crear la tarea. Intenta nuevamente.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: isEditing ? 'No se pudo actualizar la tarea.' : 'No se pudo crear la tarea. Intenta nuevamente.'
      });
    } finally {
      setCreating(false);
      setUpdating(false);
    }
  };

  // Eliminar tarea con Swal
  const handleDeleteTask = async (taskId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;
    try {
      await deleteActivity(taskId);
      Swal.fire({
        icon: 'success',
        title: 'Eliminada',
        text: 'La tarea fue eliminada.',
        timer: 1500,
        showConfirmButton: false
      });
      await fetchTasks(professor.id, params.subjectId, courseId);
    } catch (error) {
      setError('Error al eliminar la tarea');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la tarea.'
      });
    }
  };

  const normalizeTask = (task) => ({
    ...task,
    createDate: task.create_date,
    endDate: task.end_date,
    dimension: task.dimension?.dimension || '',
    subject: task.subject?.subject || '',
    // ...otros campos que uses en el render
  });

  // Función para determinar el estado de la tarea
  const getTaskStatus = (task) => {
    const now = new Date();
    const endDate = new Date(task.endDate);
    if (endDate > now && task.type !== 1) return 'Creada';
    return 'Para Revisar';
  };
  const getTaskStatusColor = (status) => {
    return status === 'Creada' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  // Proteger el render hasta que currentDate esté definido
  if (!currentDate) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 lg:pt-[150px]">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tareas</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gestión {managementGlobal?.year}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={!courseId}
            title={!courseId ? 'No se puede crear tarea sin curso válido' : 'Nueva Tarea'}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Modal para crear tarea */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleCreateOrUpdateTask} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-fadeIn">
            <button type="button" onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none">×</button>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{modalTitle}</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre de la Tarea *</label>
              <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required maxLength={100} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Fecha de Entrega *</label>
              <input type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.date} onChange={e => handleInputChange('date', e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Ponderación (%) *</label>
              <input type="number" min={1} max={100} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.ponderacion} onChange={e => handleInputChange('ponderacion', e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Área de Evaluación *</label>
              <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.tipo} onChange={e => handleInputChange('tipo', e.target.value)} required>
                {DIMENSION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.text}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Descripción *</label>
              <textarea className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.descripcion} onChange={e => handleInputChange('descripcion', e.target.value)} rows={3} required maxLength={500} />
            </div>
            <div className="mb-6 flex items-center gap-2">
              <input type="checkbox" id="only-grade" checked={formData.type === 1} onChange={handleCheckboxToggle} className="form-checkbox h-5 w-5 text-blue-600" />
              <label htmlFor="only-grade" className="text-sm text-gray-700 dark:text-gray-300">Tarea solo para calificar (sin entrega de alumnos)</label>
            </div>
            {formError && <div className="mb-4 text-red-500 text-sm font-medium">{formError}</div>}
            <button type="submit" disabled={creating || updating} className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition disabled:opacity-60 disabled:cursor-not-allowed">
              {modalButton}
            </button>
          </form>
        </div>
      )}

      {/* Filtros y buscador sticky */}
      <div className="bg-white dark:bg-gray-800 shadow sticky top-[72px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 flex flex-col md:flex-row gap-2 md:items-center">
            <input
              type="text"
              placeholder="Buscar tarea..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {Object.entries(TASK_FILTERS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTaskFilter(key)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors duration-150 ${
                    taskFilter === key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
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
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-700"
              title="Mes anterior"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[100px] text-center">
              {MONTH_NAMES[currentDate.getMonth()]}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-700"
              title="Mes siguiente"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && !hasFetched ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-6"></div>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">Cargando actividades...</p>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-16 text-lg font-semibold">{error}</div>
        ) : (filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-80">
            <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mb-4 text-gray-400 dark:text-gray-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-2a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg>
            <p className="text-xl text-gray-500 dark:text-gray-400 font-semibold">No hay tareas para este mes</p>
            <p className="text-base text-gray-400 dark:text-gray-500">¡Crea tu primera tarea para este curso!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            {filteredTasks.map((task) => {
              const status = getTaskStatus(task);
              return (
                <div
                  key={task.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between group transition-all duration-200 hover:shadow-xl relative"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${
                        task.type === 1
                          ? 'bg-purple-500'
                          : task.endDate > new Date()
                            ? 'bg-green-500'
                            : 'bg-red-500'
                      }`} />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {task.name}
                      </h3>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${getTaskStatusColor(status)}`}>{status}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-3 min-h-[48px]">{task.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Creada: {task.start_date ? new Date(task.start_date).toLocaleDateString() : ''}</span>
                      </div>
                      {task.type !== 1 && (
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>Entrega: {task.endDate ? new Date(task.endDate).toLocaleDateString() : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 justify-between">
                    <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <AcademicCapIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {task.dimension}
                      </span>
                    </div>
                    <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">
                      {task.weight}%
                    </div>
                    <button
                      className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold transition"
                      title="Calificar tarea"
                      onClick={() => router.push(`/professor/tasks/${params.subjectId}/${task.id}/grade?courseId=${courseId}`)}
                    >
                      Ir a Calificar =&gt;
                    </button>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                        title="Editar tarea"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                        title="Eliminar tarea"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
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
    </div>
  );
} 