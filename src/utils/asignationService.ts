const API_URL = 'http://localhost:3001/api/teachers'; 

// Obtener todos los profesores
export const getProfesores = async () => {
  try {
    const response = await fetch(`${API_URL}`);
    if (!response.ok) throw new Error('Error al obtener los profesores');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getProfesorById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Error al obtener el profesor');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getProfesorByEmail = async (email) => {
  try {
    const response = await fetch(`${API_URL}/email/${email}`);
    if (!response.ok) throw new Error('Error al obtener el profesor por email');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createProfesor = async (profesorData) => {
  try {
    console.log(profesorData)
    const response = await fetch(`http://localhost:3001/api/teachers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profesorData),
      
    });
    if (!response.ok) throw new Error('Error al crear el profesor');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateProfesor = async (id, profesorData) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profesorData),
    });
    if (!response.ok) throw new Error('Error al actualizar el profesor');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteProfesor = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar el profesor');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};


const BASE_URL = 'http://localhost:3001/api/asignaciones';

export const getAsignaciones = async () => {
  try {
    const response = await fetch(`${BASE_URL}`);
    if (!response.ok) throw new Error('Error al obtener las asignaciones');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getAsignacionesByCurso = async (cursoId) => {
  try {
    const response = await fetch(`${BASE_URL}/curso/${cursoId}`);
    if (!response.ok) throw new Error('Error al obtener las asignaciones para el curso');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createAsignacion = async (asignacionData) => {
  console.log(asignacionData)
  try {
    const response = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(asignacionData),
    });
    if (!response.ok) throw new Error('Error al crear la asignación');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateAsignacion = async (id, asignacionData) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(asignacionData),
    });
    if (!response.ok) throw new Error('Error al actualizar la asignación');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};
