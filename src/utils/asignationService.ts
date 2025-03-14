import { httpRequestFactory } from './HttpRequestFactory';

// PROFESORES

export const getProfesores = async () => {
  try {
    const { url, config } = httpRequestFactory.createRequest('/teachers');
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al obtener los profesores');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getProfesorById = async (id: string) => {
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
    const { url, config } = httpRequestFactory.createRequest('/teachers', 'POST', profesorData);
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
    const { url, config } = httpRequestFactory.createRequest(`/teachers/${id}`, 'PUT', profesorData);
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
    const { url, config } = httpRequestFactory.createRequest(`/teachers/${id}`, 'DELETE');
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
    const { url, config } = httpRequestFactory.createRequest('/asignaciones');
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al obtener las asignaciones');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getAsignacionesByCurso = async (cursoId: string) => {
  try {
    const { url, config } = httpRequestFactory.createRequest(`/asignaciones/curso/${cursoId}`);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al obtener las asignaciones para el curso');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createAsignacion = async (asignacionData: any) => {
  try {
    const { url, config } = httpRequestFactory.createRequest('/asignaciones', 'POST', asignacionData);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al crear la asignación');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateAsignacion = async (id: string, asignacionData: any) => {
  try {
    const { url, config } = httpRequestFactory.createRequest(`/asignaciones/${id}`, 'PUT', asignacionData);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al actualizar la asignación');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};