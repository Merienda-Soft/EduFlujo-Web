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
        const response = await fetch(url, config);
        
        if (response.status === 404) {
            throw new Error('NO_TASKS');
        }

        if (!response.ok) {
            throw new Error(`Error al obtener las actividades: ${response.status}`);
        }

        return await response.json();
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
