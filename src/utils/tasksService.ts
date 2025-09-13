import { httpRequestFactory } from './HttpRequestFactory';
import {EvaluationToolType} from '../types/evaluation';
import { getCurrentUserId } from './globalState';

export const getProfessorByEmail = async (email) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(`/professors/${email}`);
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al obtener los datos del profesor');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getActivities = async (materiaId: string, cursoId: string, teacherId: string, managementId: string) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(
            `/tasks/professor/${teacherId}/course/${cursoId}/subject/${materiaId}/management/${managementId}`
        );
        console.log(url, config);
        const response = await fetch(url, config);
        console.log(response);
        if (response.status === 404) {
            throw new Error('NO_TASKS');
        }

        if (!response.ok) {
            throw new Error(`Error al obtener las actividades: ${response.status}`);
        }

        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const createActivity = async (data: {
  task: any;
  tool?: {
    type: EvaluationToolType;
    methodology: any;
  } | null;
}) => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    throw new Error('Usuario no autenticado');
  }
  
  const { url, config } = httpRequestFactory.createRequest('/tasks', 'POST', {
    ...data,
    task: {
      ...data.task,
      created_by: currentUserId
    }
  });
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al crear la tarea');
  }

  return await response.json();
};

export const updateActivity = async (activityId: number, data: {
  task: any;
    tool?: {
        type: EvaluationToolType;
        methodology: any;
    } | null;
  }) => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }
    const requestData = {
      task: {
        ...data.task,
        updated_by: currentUserId
      },
      tool: data.tool,
      updated_by: currentUserId
    };

    console.log("Request data structure:", JSON.stringify(requestData, null, 2));

    const { url, config } = httpRequestFactory.createRequest(
      `/tasks/${activityId}`,
      'PUT',
      requestData
    );

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar la actividad');
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};export const deleteActivity = async (idActivity: string) => {
    try {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            throw new Error('Usuario no autenticado');
        }
        
        const { url, config } = httpRequestFactory.createRequest(`/tasks/delete/${idActivity}`, 'POST', {
            deleted_by: currentUserId
        });
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`Error al eliminar la actividad: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getActivityByIdWithAssignments = async (idActivity) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(`/tasks/${idActivity}/assignments`);
        const response = await fetch(url, config);
        console.log(response)
        if (!response.ok) throw new Error('Error al obtener la tarea con asignaciones');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const updateTaskGrades = async (activityId, studentsData) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(
            `/tasks/${activityId}/grade`,
            'POST',
            { students: studentsData }
        );
        const response = await fetch(url, config);
        return response;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getTaskByIdWithAssignmentsForStudent = async (taskId: string, studentId: string) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(`/tasks/${taskId}/student/${studentId}`);
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al obtener la tarea para el estudiante');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getTasksByStudentId = async (studentId: string, courseId: string, subjectId: string, managementId: string) => {
    console.log('getTasksByStudentId');
    try {
        const { url, config } = httpRequestFactory.createRequest(
            `/tasks/student/${studentId}/course/${courseId}/subject/${subjectId}/management/${managementId}`
        );
        const response = await fetch(url, config);
        
        if (response.status === 404) {
            throw new Error('NO_TASKS');
        }

        if (!response.ok) {
            throw new Error(`Error al obtener las tareas: ${response.status}`);
        }
        console.log("JSON: ", response)

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const submitTaskFiles = async (taskId: string, studentId: string, files: Array<{ name: string, url: string }>) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(
            '/tasks/submit',
            'POST',
            { taskId, studentId, files }
        );
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al enviar la tarea');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const cancelSubmitTaskFiles = async (taskId: string, studentId: string) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(
            '/tasks/cancel-submit',
            'POST',
            { taskId, studentId }
        );
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al cancelar el envío de la tarea');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getTasksReportByCourse = async (courseId: string, professorId: string, managementId: string, quarter?: string) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(
            `/tasks/course/${courseId}/professor/${professorId}/management/${managementId}`
        );
        console.log(url, config)
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`Error al obtener el reporte: ${response.status}`);
        }

        const data = await response.json();
        console.log(data)
        if (!data.ok) {
            throw new Error(data.error || 'Error al obtener el reporte');
        }

        // Función auxiliar para descargar archivo
        const downloadFile = (url: string, fileName: string) => {
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        const { reports } = data.data;
        if (!reports || !Array.isArray(reports)) {
            throw new Error('No se recibieron los reportes correctamente');
        }

        // Si se especifica un trimestre, descargar solo ese reporte
        if (quarter) {
            const quarterReport = reports.find(r => r.quarter === Number(quarter));
            if (!quarterReport) {
                throw new Error(`No se encontró el reporte para el trimestre ${quarter}`);
            }
            downloadFile(quarterReport.url, quarterReport.fileName);
            return { success: true };
        }

        // Si no se especifica trimestre, descargar todos con delay
        reports.forEach((report, index) => {
            if (report.url) {
                setTimeout(() => {
                    downloadFile(report.url, report.fileName);
                }, index * 1000); // 1 segundo de delay entre cada descarga
            }
        });
        
        return { success: true };
    } catch (error) {
        console.error(error);
        throw error;
    }
};
