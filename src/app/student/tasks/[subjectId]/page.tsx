"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon, AcademicCapIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { getTasksByStudentId } from "../../../../utils/tasksService";
import { getCurrentManagementData, getManagementGlobal, subscribe } from "../../../../utils/globalState";
import Swal from "sweetalert2";

const STATUS_FILTERS = {
  ALL: "Todas",
  PENDING: "Pendientes",
  SUBMITTED: "Entregadas",
  RETURNED: "Devueltas",
};

const STATUS_COLORS = {
  0: "bg-orange-500",
  1: "bg-green-500",
  2: "bg-blue-500", 
};

export default function StudentTasksPage() {
  const managementGlobal = getManagementGlobal();
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const studentId = searchParams.get("studentId");
  const courseId = searchParams.get("courseId");
  const subjectId = params.subjectId;
  const [selectedManagement, setSelectedManagement] = useState(getCurrentManagementData()?.id);
  const [selectedManagementName] = useState(getCurrentManagementData()?.management);
  const materiaName = searchParams.get("materiaName");

  const [searchValue, setSearchValue] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 5;

  const monthNames = useMemo(
    () => [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ],
    []
  );

  const fetchTasks = useCallback(async () => {
    if (!studentId || !courseId || !subjectId || !selectedManagement) {
      console.error("Missing required IDs:", { studentId, courseId, subjectId, selectedManagement });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await getTasksByStudentId(
        studentId,
        courseId,
        subjectId.toString(),
        selectedManagement.toString()
      );

      if (response.ok && response.data) {
        const transformedTasks = response.data.map((task) => ({
          ...task,
          createDate: new Date(task.end_date),
          status: task.assignments?.[0]?.status ?? 0,
        }));
        setTasks(transformedTasks);
        console.log("Transformed Tasks: ", transformedTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      Swal.fire("Error", "Error al cargar las tareas");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [studentId, courseId, subjectId, selectedManagement]);

  useEffect(() => {
    if (selectedManagement) {
      fetchTasks();
    }
  }, [fetchTasks, selectedManagement]);

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

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const taskCreateDate = task.createDate;
      const matchesSearch = task.name
        .toLowerCase()
        .includes(searchValue.toLowerCase());
      const matchesMonth =
        taskCreateDate.getMonth() === currentDate.getMonth() &&
        taskCreateDate.getFullYear() === currentDate.getFullYear();
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PENDING" && task.status === 0) ||
        (statusFilter === "SUBMITTED" && task.status === 1) ||
        (statusFilter === "RETURNED" && task.status === 2);

      return matchesSearch && matchesMonth && matchesStatus;
    });
  }, [tasks, searchValue, currentDate, statusFilter]);

  // Pagination logic
  const totalTasks = filteredTasks.length;
  const totalPages = Math.ceil(totalTasks / tasksPerPage);
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * tasksPerPage;
    return filteredTasks.slice(startIndex, startIndex + tasksPerPage);
  }, [filteredTasks, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 lg:pt-[150px]">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tareas</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gestión {selectedManagementName} - {materiaName}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push(`/student/support-material?subjectId=${subjectId}&courseId=${courseId}&studentId=${studentId}&managementId=${selectedManagement}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Material de Apoyo
            </button>
          </div>
        </div>
      </div>

      {/* Filtros y buscador sticky */}
      <div className="bg-white dark:bg-gray-800 shadow sticky top-[72px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 flex flex-col md:flex-row gap-2 md:items-center">
            <input
              type="text"
              placeholder="Buscar tarea..."
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {Object.entries(STATUS_FILTERS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setStatusFilter(key);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors duration-150 ${
                    statusFilter === key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>{label}</span>
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
              {monthNames[currentDate.getMonth()]}
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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-6"></div>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">Cargando tareas...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-80">
            <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mb-4 text-gray-400 dark:text-gray-600">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-2a2 2 0 00-2 2v5a2 2 0 002 2z" />
            </svg>
            <p className="text-xl text-gray-500 dark:text-gray-400 font-semibold">No hay tareas para este mes</p>
            <p className="text-base text-gray-400 dark:text-gray-500">¡No hay tareas asignadas para este período!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedTasks.map((task) => {
              const isLate = new Date(task.end_date) < new Date() && task.status === 0;
              return (
                <div
                  key={task.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 flex flex-col md:flex-row md:items-center gap-6 group transition-all duration-200 hover:shadow-lg"
                >
                  {/* Icono de tarea */}
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                  </div>

                  {/* Contenido principal */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isLate ? "bg-red-500" : "bg-green-500"}`} />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {task.name}
                        </h3>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[task.status]}`}>
                        {task.status === 0 ? "Pendiente" : task.status === 1 ? "Entregada" : "Devuelta"}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      {task.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Creada: {new Date(task.createDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>Entrega: {new Date(task.end_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AcademicCapIcon className="h-4 w-4" />
                        <span>{task.dimension.dimension}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Peso:</span>
                        <span>{task.weight}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Botón de acción */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => router.push(`/student/tasks/${subjectId}/${task.id}?courseId=${courseId}&studentId=${studentId}&managementId=${selectedManagement}`)}
                      className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                    >
                      Ver Detalles
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando <span className="font-medium">{(currentPage - 1) * tasksPerPage + 1}</span> a <span className="font-medium">
                    {Math.min(currentPage * tasksPerPage, totalTasks)}
                  </span> de <span className="font-medium">{totalTasks}</span> tareas
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Anterior
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 border rounded-md text-sm font-medium ${
                            currentPage === pageNum
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"
                  >
                    Siguiente
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}