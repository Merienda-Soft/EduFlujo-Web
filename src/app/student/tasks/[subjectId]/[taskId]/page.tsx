"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { getTaskByIdWithAssignmentsForStudent, submitTaskFiles, cancelSubmitTaskFiles } from "../../../../../utils/tasksService";
import { CalendarIcon, ClockIcon, AcademicCapIcon, DocumentIcon, XMarkIcon, ArrowUpTrayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Swal from "sweetalert2";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../../../utils/firebase/firebaseConfig';

export default function TaskDetailPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const studentId = searchParams.get("studentId") || "";
  const courseId = searchParams.get("courseId");
  const managementId = searchParams.get("managementId");
  const taskId = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId || "";

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submittedFiles, setSubmittedFiles] = useState([]);

  const fetchTaskDetails = useCallback(async () => {
    try {
      const response = await getTaskByIdWithAssignmentsForStudent(taskId, studentId);
      if (response.ok && response.data) {
        setTask(response.data);
        const assignment = response.data.assignments?.[0];
        if (assignment && assignment.files) {
          setSubmittedFiles(assignment.files);
        }
      } else {
        throw new Error('No se pudo cargar la tarea');
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Error al cargar los detalles de la tarea");
    } finally {
      setLoading(false);
    }
  }, [taskId, studentId]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const totalFiles = selectedFiles.length;
      const uploadedFiles = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        // 1. Subir a Firebase Storage
        const storageRef = ref(storage, `student-tasks/${studentId}/${taskId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        // 2. Obtener la URL pública de descarga
        const url = await getDownloadURL(storageRef);
        uploadedFiles.push({
          name: file.name,
          url
        });
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      const response = await submitTaskFiles(taskId, studentId, uploadedFiles);
      
      if (response.ok) {
        await fetchTaskDetails();
        setSelectedFiles([]);
        setUploadProgress(0);
        Swal.fire("Éxito", "Tarea enviada correctamente");
      } else {
        throw new Error('Error al enviar la tarea');
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Error al enviar la tarea");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelSubmit = async () => {
    try {
      const response = await cancelSubmitTaskFiles(taskId, studentId);
      if (response.ok) {
        await fetchTaskDetails();
        Swal.fire("Éxito", "Envío cancelado correctamente");
      } else {
        throw new Error('Error al cancelar el envío');
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Error al cancelar el envío de la tarea");
    }
  };

  const handleOpenFile = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 lg:pt-[150px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const assignment = task?.assignments?.[0];
  const qualification = assignment?.qualification?.trim() || '-';
  const comment = assignment?.comment || '';
  const isSubmitted = assignment?.status === 1 || assignment?.status === 2;
  const isLate = new Date(task?.end_date) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 lg:pt-[150px]">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{task?.name}</h1>
              <div className="mt-2 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLate ? "bg-red-500" : "bg-green-500"}`} />
                <span className={`text-sm font-medium ${isLate ? "text-red-500" : "text-green-500"}`}>
                  {isLate ? 'Vencida' : 'En tiempo'}
                </span>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Descripción</h2>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {task?.description}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detalles</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Fecha límite: {new Date(task?.end_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Calificación: {qualification}
                  </span>
                </div>
                {comment && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Comentario del profesor
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {comment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submission Section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Entrega de tarea
              </h2>

              {isSubmitted ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircleIcon className="h-6 w-6" />
                    <span className="font-medium">Tarea entregada</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Archivos enviados:
                    </h3>
                    {submittedFiles.length > 0 ? (
                      <div className="space-y-2">
                        {submittedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <DocumentIcon className="h-5 w-5 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                {file.name}
                              </span>
                            </div>
                            <button
                              onClick={() => handleOpenFile(file.url)}
                              className="text-blue-500 hover:text-blue-600"
                            >
                              Ver
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No hay archivos enviados
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleCancelSubmit}
                    disabled={assignment.status === 2}
                    className={`w-full px-4 py-2 rounded-md text-white font-medium ${
                      assignment.status === 2
                        ? 'bg-red-400 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    Cancelar Envío
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Seleccionar archivos
                      </span>
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <DocumentIcon className="h-5 w-5 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                              {file.name}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={selectedFiles.length === 0 || isUploading}
                    className={`w-full px-4 py-2 rounded-md text-white font-medium ${
                      selectedFiles.length === 0 || isUploading
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Subiendo... {Math.round(uploadProgress)}%</span>
                      </div>
                    ) : (
                      'Enviar tarea'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 