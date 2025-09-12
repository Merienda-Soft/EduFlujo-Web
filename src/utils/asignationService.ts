import { httpRequestFactory } from './HttpRequestFactory';
import { getCurrentUserId } from './globalState';

// PROFESORES

export const getProfesores = async () => {
  try {
    const { url, config } = httpRequestFactory.createRequest('/professors');
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al obtener los profesores');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getProfesorById = async (id: number) => {
  try {
    const { url, config } = httpRequestFactory.createRequest(`/teachers/${id}`);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al obtener el profesor');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getProfesorByEmail = async (email: string) => {
  try {
    const { url, config } = httpRequestFactory.createRequest(`/teachers/email/${email}`);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al obtener el profesor por email');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createProfesor = async (profesorData: any) => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }
    
    const { url, config } = httpRequestFactory.createRequest('/professors', 'POST', {
      ...profesorData,
      created_by: currentUserId
    });
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al crear el profesor');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateProfesor = async (id: string, profesorData: any) => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }
    
    const { url, config } = httpRequestFactory.createRequest(`/teachers/${id}`, 'PUT', {
      ...profesorData,
      updated_by: currentUserId
    });
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al actualizar el profesor');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteProfesor = async (id: string) => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }
    
    const { url, config } = httpRequestFactory.createRequest(`/teachers/${id}`, 'DELETE', {
      deleted_by: currentUserId
    });
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al eliminar el profesor');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// ASIGNACIONES

export const getAsignaciones = async () => {
  try {
    const { url, config } = httpRequestFactory.createRequest('/assignment');
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al obtener las asignaciones');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getAsignacionesByCurso = async (cursoId: number) => {
  try {
    const { url, config } = httpRequestFactory.createRequest(`/assignment/course/${cursoId}`);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al obtener las asignaciones para el curso');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createAsignacion = async (asignacionData: any[]) => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }
    
    const assignmentsWithAudit = asignacionData.map(assignment => ({
      ...assignment,
      created_by: currentUserId
    }));
    
    const { url, config } = httpRequestFactory.createRequest('/assignment', 'POST', assignmentsWithAudit);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al crear las asignaciones');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateAsignacion = async (updates: any[]) => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }
    
    const updateData = {
      updates: updates,
      updated_by: currentUserId
    };
    
    const { url, config } = httpRequestFactory.createRequest(`/assignment`, 'PUT', updateData);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al actualizar las asignaciones');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};