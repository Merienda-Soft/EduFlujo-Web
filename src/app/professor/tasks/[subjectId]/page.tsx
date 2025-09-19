'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon, AcademicCapIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getActivities, createActivity, updateActivity, deleteActivity, getWeightsByDimension } from '../../../../utils/tasksService';
import { useUser } from '@auth0/nextjs-auth0/client';
import { getProfessorByEmail } from '../../../../utils/tasksService';
import { getManagementGlobal, subscribe, isCurrentManagementActive } from '../../../../utils/globalState';
import Swal from 'sweetalert2';
import {EvaluationToolType, RubricData, ChecklistData, AutoEvaluationBuilderData} from '../../../../types/evaluation';
import EvaluationToolSelector from '../../../../components/Task/Evaluation/EvaluationToolSelector';
import ChecklistBuilder from '../../../../components/Task/Evaluation/ChecklistBuilder';
import RubricBuilder from '../../../../components/Task/Evaluation/RubricBuilder';
import AutoEvaluationBuilder from '../../../../components/Task/Evaluation/AutoEvaluationBuilder';

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
  const managementGlobal = getManagementGlobal();
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
  const [selectedManagement, setSelectedManagement] = useState(managementGlobal?.id);
  const [dimensionWeights, setDimensionWeights] = useState({});
  const [loadingWeights, setLoadingWeights] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    startDate: '',
    ponderacion: '',
    descripcion: '',
    tipo: '1',
    type: 0,
    isPastTask: false
  });
  
  const [evaluationTool, setEvaluationTool] = useState<{
    type: EvaluationToolType | null;
    data: RubricData | ChecklistData | AutoEvaluationBuilderData | null;
  }>({ type: null, data: null });

  // Estado para edición
  const [editTask, setEditTask] = useState(null);
  const [updating, setUpdating] = useState(false);

  const DIMENSION_OPTIONS = [
    { value: '1', text: 'Ser' },
    { value: '2', text: 'Saber' },
    { value: '3', text: 'Hacer' },
    { value: '4', text: 'Decidir' },
    { value: '5', text: 'Autoevaluación' },
  ];

  const courseIdRaw = searchParams?.get('courseId');
  const courseId = courseIdRaw && !isNaN(Number(courseIdRaw)) ? Number(courseIdRaw) : null;

  // Función para mapear los datos de evaluación desde el backend al frontend
  const mapEvaluationToolFromBackend = (backendData) => {
    if (!backendData || !backendData.evaluationTool) {
      return { type: null, data: null };
    }

    const { type, methodology } = backendData.evaluationTool;

    // Mapear tipo de herramienta
    let mappedType = null;
    if (type === 1) {
      mappedType = EvaluationToolType.RUBRIC;
    } else if (type === 2) {
      mappedType = EvaluationToolType.CHECKLIST;
    } else if (type === 3) {
      mappedType = EvaluationToolType.AUTO_EVALUATION;
    }

    if (!methodology) {
      return {
        type: mappedType,
        data: mappedType === EvaluationToolType.RUBRIC 
          ? { title: 'Rúbrica de Evaluación', criteria: [] }
          : mappedType === EvaluationToolType.CHECKLIST
          ? { title: 'Lista de Cotejo', items: [] }
          : mappedType === EvaluationToolType.AUTO_EVALUATION
          ? { title: 'Autoevaluación', dimensions: [{ name: 'SER', criteria: [] }, { name: 'DECIDIR', criteria: [] }] }
          : null
      };
    }

    let mappedData = null;
    try {
      const methodologyData = typeof methodology === 'string' 
        ? JSON.parse(methodology) 
        : methodology;

      if (mappedType === EvaluationToolType.RUBRIC) {
        if (methodologyData.criteria && Array.isArray(methodologyData.criteria)) {
          mappedData = {
            title: methodologyData.title || 'Rúbrica de Evaluación',
            criteria: methodologyData.criteria.map(criterion => ({
              name: criterion.name || '',
              weight: criterion.weight || 0,
              levels: criterion.levels && Array.isArray(criterion.levels) 
                ? criterion.levels.map(level => ({
                    description: level.description || '',
                    score: level.score || 0
                  }))
                : [
                    { description: 'Excelente', score: 5 },
                    { description: 'Bueno', score: 3 },
                    { description: 'Regular', score: 1 }
                  ]
            }))
          };
        }
      } else if (mappedType === EvaluationToolType.CHECKLIST) {
        if (methodologyData.items && Array.isArray(methodologyData.items)) {
          mappedData = {
            title: methodologyData.title || 'Lista de Cotejo',
            items: methodologyData.items.map(item => ({
              description: item.description || '',
              required: item.required !== undefined ? item.required : true
            }))
          };
        }
      } else if (mappedType === EvaluationToolType.AUTO_EVALUATION) {
        if (methodologyData.dimensions && Array.isArray(methodologyData.dimensions)) {
          mappedData = {
            title: methodologyData.title || 'Autoevaluación',
            dimensions: methodologyData.dimensions.map(dimension => ({
              name: dimension.name,
              criteria: dimension.criteria && Array.isArray(dimension.criteria)
                ? dimension.criteria.map(criterion => ({
                    description: criterion.description || '',
                    levels: criterion.levels && Array.isArray(criterion.levels)
                      ? criterion.levels.map(level => ({
                          name: level.name || '',
                          value: level.value || 0,
                          selected: level.selected || false
                        }))
                      : [
                          { name: 'Si', value: 3, selected: false },
                          { name: 'A veces', value: 2, selected: false },
                          { name: 'No', value: 1, selected: false }
                        ]
                  }))
                : []
            }))
          };
        }
      }
    } catch (error) {
      console.error('Error parsing evaluation methodology:', error);
    }

    if (!mappedData) {
      mappedData = mappedType === EvaluationToolType.RUBRIC 
        ? { title: 'Rúbrica de Evaluación', criteria: [] }
        : mappedType === EvaluationToolType.CHECKLIST
        ? { title: 'Lista de Cotejo', items: [] }
        : mappedType === EvaluationToolType.AUTO_EVALUATION
        ? { title: 'Autoevaluación', dimensions: [{ name: 'SER', criteria: [] }, { name: 'DECIDIR', criteria: [] }] }
        : null;
    }

    return { type: mappedType, data: mappedData };
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      startDate: '',
      ponderacion: '',
      descripcion: '',
      tipo: '1',
      type: 0,
      isPastTask: false
    });
    setEvaluationTool({ type: null, data: null });
  };

  const openEditModal = (task) => {
    console.log('Abriendo modal de edición con task:', task);
    
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);
    const isPastTask = startDate < new Date();

    setFormData({
      name: task.name || '',
      date: task.endDate ? task.endDate.slice(0, 10) : '',
      startDate: task.startDate ? task.startDate.slice(0, 10) : '',
      ponderacion: String(task.weight || 0),
      descripcion: task.description || '',
      tipo: String(task.dimension_id || '1'),
      type: task.type || 0,
      isPastTask: isPastTask
    });

    // Mapear herramienta de evaluación
    const mappedEvaluationTool = mapEvaluationToolFromBackend(task);
    console.log('Herramienta de evaluación mapeada:', mappedEvaluationTool);
    
    setEvaluationTool(mappedEvaluationTool);
    setEditTask(task);
    setFormError('');
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditTask(null);
    setFormError('');
    resetForm();
  };

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
      if (!professor || !params.subjectId || !courseId || !selectedManagement) return;
      setLoading(true);
      setError('');
      try {
        const activities = await getActivities(
          params.subjectId.toString(),
          courseId.toString(),
          professor.id.toString(),
          selectedManagement.toString()
        );
        console.log('ACTIVITIES:', activities)
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
  }, [professor, params.subjectId, courseId, selectedManagement]);

  // Load dimension weights
  useEffect(() => {
    const loadDimensionWeights = async () => {
      if (!professor || !params.subjectId || !courseId || !selectedManagement || !currentDate) return;
      setLoadingWeights(true);
      try {
        const today = new Date();
        const dateForWeights = new Date(
          currentDate.getFullYear(), 
          currentDate.getMonth(), 
          today.getDate()
        ).toISOString().split('T')[0];
        
        const weights = await getWeightsByDimension(
          professor.id.toString(),
          courseId.toString(),
          params.subjectId.toString(),
          selectedManagement.toString(),
          dateForWeights
        );
        setDimensionWeights(weights.weightByDimension || {});
      } catch (error) {
        console.error('Error loading dimension weights:', error);
        setDimensionWeights({});
      } finally {
        setLoadingWeights(false);
      }
    };
    loadDimensionWeights();
  }, [professor, params.subjectId, courseId, selectedManagement, currentDate]);

  useEffect(() => {
    const currentMonth = new Date().getMonth();
    setCurrentDate(new Date(managementGlobal?.year || new Date().getFullYear(), currentMonth, 1));
  }, [selectedManagement]);

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

  // Validaciones de ponderación por dimensión
  const validateDimensionWeight = (dimensionId, newWeight) => {
    const currentWeight = dimensionWeights[dimensionId]?.weight || 0;
    const availableWeight = 100 - currentWeight;
    
    if (currentWeight >= 100) {
      return {
        isValid: false,
        message: `La dimensión ya tiene el 100% asignado. Ajusta otras tareas de esta dimensión.`
      };
    }
    
    if (newWeight > availableWeight) {
      return {
        isValid: false,
        message: `La ponderación no puede ser mayor a ${availableWeight}% (disponible en esta dimensión).`
      };
    }
    
    return { isValid: true, message: '' };
  };

  const getDimensionName = (dimensionId) => {
    const names = { '1': 'SER', '2': 'SABER', '3': 'HACER', '4': 'DECIDIR', '5': 'AUTOEVALUACIÓN' };
    return names[dimensionId] || '';
  };

  const isAutoEvaluationExists = () => {
    return (dimensionWeights['5']?.weight || 0) > 0;
  };

  const handleInputChange = (field, value) => {
    if (field === 'tipo' && value === '5') {
      setFormData(prev => ({ ...prev, [field]: value, ponderacion: '100' }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    if (field === 'ponderacion' && formData.tipo && formData.tipo !== '5') {
      const weightValue = Number(value);
      if (!isNaN(weightValue) && weightValue > 0) {
        const validation = validateDimensionWeight(formData.tipo, weightValue);
        if (!validation.isValid) {
          // Solo mostrar como advertencia, no bloquear
          setFormError(validation.message);
        } else {
          setFormError('');
        }
      }
    }
    
    if (field === 'tipo') {
      const isAutoEvaluationDimension = value === '5';
      const currentToolType = evaluationTool.type;
      
      // Limpiar errores previos
      setFormError('');
      
      if (isAutoEvaluationDimension && currentToolType !== EvaluationToolType.AUTO_EVALUATION) {
        setEvaluationTool({ type: null, data: null });
      }
      else if (!isAutoEvaluationDimension && currentToolType === EvaluationToolType.AUTO_EVALUATION) {
        setEvaluationTool({ type: null, data: null });
      }
    }
  };

  const handleCheckboxToggle = () => {
    setFormData(prev => ({ ...prev, type: prev.type === 0 ? 1 : 0 }));
  };

  const validateForm = () => {
    const { name, date, startDate, ponderacion, descripcion, isPastTask } = formData;
    if (!name || !ponderacion || !descripcion) {
      setFormError('Por favor, completa todos los campos requeridos.');
      return false;
    }
    if (!courseId) {
      setFormError('No se pudo identificar el curso. Intenta ingresar desde la lista de cursos.');
      return false;
    }
    const pondValue = Number(ponderacion);
    if (isNaN(pondValue) || pondValue < 1 || pondValue > 100) {
      setFormError('La ponderación debe ser un número entre 1 y 100.');
      return false;
    }

    // Validar fechas según el tipo de tarea
    if (isPastTask) {
      if (!startDate || !date) {
        setFormError('Por favor, completa ambas fechas para la tarea pasada.');
        return false;
      }
      const start = new Date(startDate);
      const end = new Date(date);
      if (end < start) {
        setFormError('La fecha de fin debe ser posterior a la fecha de inicio.');
        return false;
      }
    } else {
      if (!date) {
        setFormError('Por favor, ingresa la fecha de entrega.');
        return false;
      }
      const now = new Date();
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      if (endDate <= now) {
        setFormError('La fecha de entrega debe ser posterior a la fecha y hora actual.');
        return false;
      }
    }

    if (formData.type === 1) {
      if (!evaluationTool.type) {
        setFormError('Seleccione una herramienta de evaluación');
        return false;
      }

      if (evaluationTool.type === EvaluationToolType.RUBRIC) {
        const rubric = evaluationTool.data as RubricData;
        if (rubric.criteria.length === 0) {
          setFormError('La rúbrica debe tener al menos un criterio');
          return false;
        }
      } else if (evaluationTool.type === EvaluationToolType.CHECKLIST) {
        const checklist = evaluationTool.data as ChecklistData;
        if (checklist.items.length === 0) {
          setFormError('La lista de cotejo debe tener al menos un ítem');
          return false;
        }
      } else if (evaluationTool.type === EvaluationToolType.AUTO_EVALUATION) {
        const autoEvaluation = evaluationTool.data as AutoEvaluationBuilderData;
        if (autoEvaluation.dimensions.every(dimension => dimension.criteria.length === 0)) {
          setFormError('La autoevaluación debe tener al menos un criterio en alguna dimensión');
          return false;
        }
        for (const dimension of autoEvaluation.dimensions) {
          for (const criterion of dimension.criteria) {
            if (criterion.levels.length === 0) {
              setFormError('Cada criterio debe tener al menos un nivel de evaluación');
              return false;
            }
          }
        }
      }
    }

    setFormError('');
    return true;
  };

  // Función para recargar tareas desde el backend
  const fetchTasks = async (professorId, subjectId, courseId, retry = 0) => {
    try {
      const activities = await getActivities(
        subjectId.toString(),
        courseId.toString(),
        professorId.toString(),
        selectedManagement.toString()
      );
      const normalized = activities.map(normalizeTask);
      setTasks(normalized);
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

  // Función para recargar pesos por dimensión
  const fetchDimensionWeights = async () => {
    if (!professor || !params.subjectId || !courseId || !selectedManagement || !currentDate) return;
    try {
      // Usar año y mes del currentDate pero día actual
      const today = new Date();
      const dateForWeights = new Date(
        currentDate.getFullYear(), 
        currentDate.getMonth(), 
        today.getDate()
      ).toISOString().split('T')[0];
      
      const weights = await getWeightsByDimension(
        professor.id.toString(),
        courseId.toString(),
        params.subjectId.toString(),
        selectedManagement.toString(),
        dateForWeights
      );
      setDimensionWeights(weights.weightByDimension || {});
    } catch (error) {
      console.error('Error loading dimension weights:', error);
    }
  };

  const isEditing = !!editTask;
  const modalTitle = isEditing ? 'Editar Tarea' : 'Nueva Tarea';
  const modalButton = isEditing ? (updating ? 'Actualizando...' : 'Actualizar Tarea') : (creating ? 'Creando...' : 'Crear Tarea');

  const handleCreateOrUpdateTask = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const pondValue = Number(formData.ponderacion);
    const dimensionId = formData.tipo;
    
    if (dimensionId === '5' && !editTask && isAutoEvaluationExists()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Autoevaluación ya existe',
        text: 'Ya existe una autoevaluación para este trimestre. Solo se permite una autoevaluación por trimestre.',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    // Validar pesos por dimensión (solo para dimensiones que no sean autoevaluación en edición)
    if (dimensionId !== '5') {
      const currentWeight = dimensionWeights[dimensionId]?.weight || 0;
      const availableWeight = 100 - currentWeight;
      
      if (currentWeight >= 100 && !editTask) {
        await Swal.fire({
          icon: 'error',
          title: 'Dimensión completa',
          text: `La dimensión ${getDimensionName(dimensionId)} ya tiene el 100% asignado. Ajusta otras tareas de esta dimensión.`,
          confirmButtonText: 'Entendido'
        });
        return;
      }
      
      if (pondValue > availableWeight) {
        await Swal.fire({
          icon: 'error',
          title: 'Ponderación excedida',
          text: `La ponderación no puede ser mayor a ${availableWeight}% (disponible en la dimensión ${getDimensionName(dimensionId)}).`,
          confirmButtonText: 'Entendido'
        });
        return;
      }
    }

    if (formData.type === 1 && !evaluationTool.type) {
      setFormError('Seleccione una herramienta de evaluación');
      return;
    }
    
    if (isEditing) {
      setUpdating(true);
    } else {
      setCreating(true);
    }
    
    setFormError('');
    
    try {
      const now = new Date();
      const startDate = formData.isPastTask ? formData.startDate : now.toISOString();
      const endDate = new Date(formData.date);
      endDate.setHours(23, 59, 59, 999);
      const endDateISO = endDate.toISOString();

      if (isEditing) {
        const updatePayload = {
          task: {
            id: editTask.id,
            name: formData.name,
            description: formData.descripcion,
            dimension_id: Number(formData.tipo),
            management_id: Number(selectedManagement),
            professor_id: Number(professor.id),
            subject_id: Number(params.subjectId),
            course_id: courseId,
            weight: Number(formData.ponderacion),
            is_autoevaluation: 0,
            quarter: 'Q1',
            type: formData.type,
            start_date: formData.isPastTask ? formData.startDate : editTask.startDate,
            end_date: endDateISO
          }
        };
        
        const update_payload = {
          task: updatePayload,
          tool: evaluationTool.type ? {
            type: evaluationTool.type,
            methodology: evaluationTool.data
          } : null
        };

        await updateActivity(editTask.id, update_payload);
        
        Swal.fire({
          icon: 'success',
          title: 'Tarea actualizada',
          text: 'La tarea se actualizó correctamente.',
          timer: 1800,
          showConfirmButton: false
        });
      } else {
        const taskPayload = {
          name: formData.name,
          description: formData.descripcion,
          dimension_id: Number(formData.tipo),
          management_id: Number(selectedManagement),
          professor_id: Number(professor.id),
          subject_id: Number(params.subjectId),
          course_id: courseId,
          weight: Number(formData.ponderacion),
          is_autoevaluation: 0,
          quarter: 'Q1',
          type: formData.type,
          start_date: startDate,
          end_date: endDateISO
        };

        const payload = {
          task: taskPayload,
          tool: evaluationTool.type ? {
            type: evaluationTool.type,
            methodology: evaluationTool.data
          } : null
        };

        const createdTask = await createActivity(payload);

        Swal.fire({
          icon: 'success',
          title: 'Tarea creada',
          text: 'La tarea se creó correctamente y se notificó a los estudiantes.',
          timer: 1800,
          showConfirmButton: false
        });
      }
      
      closeModal();
      await fetchTasks(professor.id, params.subjectId, courseId);
      await fetchDimensionWeights();
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
      await fetchDimensionWeights(); // Recargar pesos después de eliminar
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
    evaluationTool: task.assignments?.[0] ? {
      type: task.assignments[0].type,
      methodology: task.assignments[0].evaluation_methodology
    } : null
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
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push(`/professor/attendance?subjectId=${params.subjectId}&courseId=${courseId}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Asistencias
            </button>
            <button
              onClick={() => router.push(`/professor/support-material?subjectId=${params.subjectId}&courseId=${courseId}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Material de Apoyo
            </button>
            {isCurrentManagementActive() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={!courseId}
                title={!courseId ? 'No se puede crear tarea sin curso válido' : 'Nueva Tarea'}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nueva Tarea
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal para crear o editar tarea */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl h-[700px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <form 
              onSubmit={handleCreateOrUpdateTask} 
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Cabecera sticky */}
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {modalTitle}
                  </h2>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre de la Tarea *</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                    value={formData.name} 
                    onChange={e => handleInputChange('name', e.target.value)} 
                    required 
                    maxLength={100} 
                  />
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="past-task"
                      checked={formData.isPastTask}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          isPastTask: e.target.checked,
                          startDate: e.target.checked ? prev.startDate : '',
                          date: e.target.checked ? prev.date : ''
                        }));
                      }}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <label htmlFor="past-task" className="text-sm text-gray-700 dark:text-gray-300">
                      Crear tarea pasada
                    </label>
                  </div>
                  {formData.isPastTask ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Fecha de Inicio *</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={formData.startDate}
                          onChange={e => handleInputChange('startDate', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Fecha de Fin *</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={formData.date}
                          onChange={e => handleInputChange('date', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Fecha de Entrega *</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.date}
                        onChange={e => handleInputChange('date', e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Ponderación (%) *
                    {formData.tipo === '5' && (
                      <span className="ml-2 text-cyan-600 text-xs">(Autoevaluación: 100% automático)</span>
                    )}
                  </label>
                  <input 
                    type="number" 
                    min={1} 
                    max={100} 
                    step={1}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      formData.tipo === '5' ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''
                    }`}
                    value={formData.ponderacion} 
                    onChange={e => {
                      if (formData.tipo === '5') return; // No permitir cambios en autoevaluación
                      const value = e.target.value;
                      if (value === '' || (Number(value) >= 1 && Number(value) <= 100)) {
                        handleInputChange('ponderacion', value);
                      }
                    }} 
                    onKeyPress={(e) => {
                      if (formData.tipo === '5') {
                        e.preventDefault();
                        return;
                      }
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    disabled={formData.tipo === '5'}
                    required 
                  />
                  {formData.tipo && formData.tipo !== '5' && (
                    <div className="mt-1 text-xs text-gray-500">
                      Disponible: {Math.max(0, 100 - (dimensionWeights[formData.tipo]?.weight || 0))}% 
                      (Total usado: {dimensionWeights[formData.tipo]?.weight || 0}%)
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Área de Evaluación *</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                    value={formData.tipo} 
                    onChange={e => handleInputChange('tipo', e.target.value)} 
                    required
                  >
                    {DIMENSION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.text}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Descripción *</label>
                  <textarea 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                    value={formData.descripcion} 
                    onChange={e => handleInputChange('descripcion', e.target.value)} 
                    rows={3} 
                    required 
                    maxLength={500} 
                  />
                </div>

                <div className="mb-6 border-t pt-4">
                  <h3 className="font-bold mb-3 text-lg">Herramienta de Evaluación</h3>
                  
                  <EvaluationToolSelector 
                    selectedType={evaluationTool.type}
                    selectedDimension={formData.tipo}
                    onChange={(type) => {
                      if (type !== evaluationTool.type) {
                        setEvaluationTool({
                          type,
                          data: type === EvaluationToolType.RUBRIC 
                            ? { title: 'Rúbrica de Evaluación', criteria: [] }
                            : type === EvaluationToolType.CHECKLIST
                            ? { title: 'Lista de Cotejo', items: [] }
                            : type === EvaluationToolType.AUTO_EVALUATION
                            ? { title: 'Autoevaluación', dimensions: [{ name: 'SER', criteria: [] }, { name: 'DECIDIR', criteria: [] }] }
                            : null
                        });
                      }
                    }} 
                  />

                  {evaluationTool.type === EvaluationToolType.RUBRIC && (
                    <div className="mt-4">
                      <RubricBuilder 
                        key={`rubric-${isEditing ? editTask?.id : 'new'}`}
                        initialData={evaluationTool.data as RubricData}
                        onChange={(data) => setEvaluationTool(prev => ({ ...prev, data }))}
                      />
                    </div>
                  )}

                  {evaluationTool.type === EvaluationToolType.CHECKLIST && (
                    <div className="mt-4">
                      <ChecklistBuilder 
                        key={`checklist-${isEditing ? editTask?.id : 'new'}`}
                        initialData={evaluationTool.data as ChecklistData}
                        onChange={(data) => setEvaluationTool(prev => ({ ...prev, data }))}
                      />
                    </div>
                  )}

                  {evaluationTool.type === EvaluationToolType.AUTO_EVALUATION && (
                    <div className="mt-4">
                      <AutoEvaluationBuilder 
                        key={`autoevaluation-${isEditing ? editTask?.id : 'new'}`}
                        initialData={evaluationTool.data as AutoEvaluationBuilderData}
                        onChange={(data) => setEvaluationTool(prev => ({ ...prev, data }))}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer sticky */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                {/* Solo mostrar checkbox si NO es autoevaluación */}
                {formData.tipo !== '5' && (
                  <div className="mb-6 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="only-grade" 
                      checked={formData.type === 1} 
                      onChange={handleCheckboxToggle} 
                      className="form-checkbox h-5 w-5 text-blue-600" 
                    />
                    <label htmlFor="only-grade" className="text-sm text-gray-700 dark:text-gray-300">
                      Tarea solo para calificar (sin entrega de alumnos)
                    </label>
                  </div>
                )}
                
                {formError && (
                  <div className="mb-4 text-red-500 text-sm font-medium">{formError}</div>
                )}
                
                <button 
                  type="submit" 
                  disabled={creating || updating} 
                  className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {modalButton}
                </button>
              </div>
            </form>
          </div>
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
        {/* Resumen de pesos por dimensión */}
        <div className="flex justify-end mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-900 p-4">
            {loadingWeights ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Cargando pesos...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {DIMENSION_OPTIONS.map((dimension) => {
                  const weight = dimensionWeights[dimension.value]?.weight || 0;
                  const isAutoEval = dimension.value === '5';
                  
                  const dimensionColors = {
                    '1': { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700' },      // SER - Azul
                    '2': { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700' },   // SABER - Verde
                    '3': { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700' }, // HACER - Morado
                    '4': { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700' }, // DECIDIR - Naranja
                    '5': { bg: 'bg-cyan-500', light: 'bg-cyan-100', text: 'text-cyan-700' }        // AUTOEVALUACIÓN - Cyan
                  };
                  
                  const colors = dimensionColors[dimension.value];
                  
                  return (
                    <div key={dimension.value} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 p-2">
                          {dimension.text}
                        </span>
                        {isAutoEval ? (
                          <span className={`text-xs font-semibold ${weight > 0 ? colors.text : 'text-gray-500'}`}>
                            {weight > 0 ? 'Activa' : 'Inactiva'}
                          </span>
                        ) : (
                          <span className={`text-xs font-semibold ${colors.text}`}>
                            {weight}%
                          </span>
                        )}
                      </div>
                      
                      {isAutoEval ? (
                        <div className={`h-2 rounded-full ${weight > 0 ? colors.bg : 'bg-gray-300'}`}></div>
                      ) : (
                        <div className={`h-2 rounded-full ${colors.light} relative overflow-hidden`}>
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${colors.bg}`}
                            style={{ width: `${Math.min(weight, 100)}%` }}
                          ></div>
                          {weight > 100 && (
                            <div className="absolute inset-0 h-full bg-red-500 opacity-20 rounded-full"></div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {loading && !hasFetched ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-6"></div>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">Cargando actividades...</p>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-16 text-lg font-semibold">{error}</div>
        ) : (filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-80">
            <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mb-4 text-gray-400 dark:text-gray-600">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-2a2 2 0 00-2 2v5a2 2 0 002 2z" />
            </svg>
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
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${getTaskStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-3 min-h-[48px]">
                      {task.description}
                    </p>
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
                      Calificar
                    </button>
                    {isCurrentManagementActive() && (
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
                    )}
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
        .evaluation-builder {
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
          background-color: #f8fafc;
        }
        
        .evaluation-builder.dark {
          background-color: #1e293b;
          border-color: #334155;
        }
        
        .criteria-item, .checklist-item {
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        .dark .criteria-item, .dark .checklist-item {
          background-color: #1e293b;
          border-color: #334155;
        }
      `}</style>
    </div>
  );
}