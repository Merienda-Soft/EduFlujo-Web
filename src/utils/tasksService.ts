import { httpRequestFactory } from './HttpRequestFactory';

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

export const createActivity = async (activityData) => {
    try {
        const { url, config } = httpRequestFactory.createRequest('/tasks', 'POST', activityData);
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`Error al crear la actividad: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const updateActivity = async (activityId, activityData) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(
            `/tasks/${activityId}`,
            'PUT',
            activityData
        );

        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`Error al actualizar las calificaciones: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const deleteActivity = async (idActivity: string) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(`/tasks/delete/${idActivity}`, 'POST');
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
            `/tasks/course/${courseId}/professor/${professorId}/management/${managementId}?download=true${quarter ? `&quarter=${quarter}` : ''}`
        );
        
        // Modificar el config para aceptar blob
        config.headers = {
            ...config.headers,
            'Accept': 'application/octet-stream'
        };

        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`Error al obtener el reporte: ${response.status}`);
        }

        // Obtener el blob de la respuesta
        const blob = await response.blob();
        
        // Crear URL del blob
        const downloadUrl = window.URL.createObjectURL(blob);
        
        // Crear un elemento <a> temporal para la descarga
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Obtener el nombre del archivo del header Content-Disposition si existe
        const contentDisposition = response.headers.get('Content-Disposition');
        const fileName = contentDisposition
            ? contentDisposition.split('filename=')[1]?.replace(/["']/g, '')
            : `reporte_trimestre_${quarter || '1'}.xlsx`;
            
        link.setAttribute('download', fileName);
        
        // Agregar el link al documento, hacer click y removerlo
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar la URL del blob
        window.URL.revokeObjectURL(downloadUrl);
        
        return { success: true };
    } catch (error) {
        console.error(error);
        throw error;
    }
};
