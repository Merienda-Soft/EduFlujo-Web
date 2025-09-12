import { httpRequestFactory } from './HttpRequestFactory';
import { getCurrentUserId } from './globalState';

// CURSOS

export const createCourse = async (courseData) => {
  console.log("CourseData:", courseData);
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }
    
    const { url, config } = httpRequestFactory.createRequest('/course', 'POST', {
      ...courseData,
      created_by: currentUserId
    });
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error('Failed to create course');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

export const getCourseById = async (id: number) => {
  try {
    const { url, config } = httpRequestFactory.createRequest(`/course/${id}`);
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error('Failed to fetch course');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
};

export const updateCourse = async (courseId: number, courseData) => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }
    
    const { url, config } = httpRequestFactory.createRequest(`/course/${courseId}`, 'PUT', {
      ...courseData,
      updated_by: currentUserId
    });
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error('Error al actualizar el curso');
    }

    return await response.json();
  } catch (error) {
    console.error('Error actualizando el curso:', error);
    throw error;
  }
};

export const deleteCourse = async (id: string) => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }
    
    const { url, config } = httpRequestFactory.createRequest(`/course/${id}`, 'DELETE', {
      deleted_by: currentUserId
    });
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error('Error al eliminar el curso');
    }

    return await response.json();
  } catch (error) {
    console.error('Error eliminando el curso:', error);
    throw error;
  }
};

//----------------------------------------------------//

// MATERIAS

export const getMaterias = async () => {
  try {
    const { url, config } = httpRequestFactory.createRequest('/subject');
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error('Failed to fetch materias');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching materias:', error);
    throw error;
  }
};

export const createMateria = async (materiaData: { name: string }) => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }
    
    const { url, config } = httpRequestFactory.createRequest('/subject', 'POST', {
      ...materiaData,
      created_by: currentUserId
    });
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error('Failed to create materia');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating materia:', error);
    throw error;
  }
};

export const updateMateriaState = async (id: string, deleted: number) => {
  try {
    const { url, config } = httpRequestFactory.createRequest('/subjects/state', 'PATCH', { id, deleted });
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar el estado de la materia');
    }

    return await response.json();
  } catch (error) {
    console.error('Error actualizando el estado de la materia:', error);
    throw error;
  }
};