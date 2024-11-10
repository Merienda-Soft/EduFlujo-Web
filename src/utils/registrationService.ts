import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api/registration';
 
//Obteber todos los estudinates de un PDF
export const uploadPdf = async (file) => {
    const formData = new FormData();
    formData.append('pdf', file); 
  
    try {
      const response = await axios.post('http://127.0.0.1:5000/upload_pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al procesar el PDF:', error);
      throw error;
    }
  };

// Obtener todas las inscripciones
export const getInscripciones = async () => {
    try {
        const response = await axios.get(BASE_URL);
        return response.data;
    } catch (error) {
        console.error('Error al obtener las inscripciones:', error);
        throw error;
    }
};

// Obtener una inscripción por courseId
export const getInscriptionsByCourseId = async (cursoId) => {
    try {
        const response = await fetch(`http://localhost:3001/api/registration/curso/${cursoId}`);
        if (!response.ok) throw new Error('Error al obtener las asignaciones para el curso');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Crear una nueva inscripción
export const createInscripcion = async (inscripcionData) => {
    try {
      console.log(inscripcionData);
      const response = await fetch(`http://localhost:3001/api/registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inscripcionData),
      });
      if (!response.ok) throw new Error('Error al crear la inscripción');
      return await response.json();
    } catch (error) {
      console.error('Error al crear la inscripción:', error);
      throw error;
    }
};  

// Actualizar una inscripción
export const updateInscripcion = async (id, inscripcionData) => {
    try {
        const response = await axios.put(`${BASE_URL}/${id}`, inscripcionData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar la inscripción con ID ${id}:`, error);
        throw error;
    }
};

// Eliminar una inscripción
export const deleteInscripcion = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error al eliminar la inscripción con ID ${id}:`, error);
        throw error;
    }
};

// Obtener estudiantes por curso y materia
export const getStudentsByCourseAndSubject = async (courseId, subjectId) => {
    try {
        const response = await axios.get(`${BASE_URL}/students`, {
            params: {
                courseid: courseId,
                materiaid: subjectId
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error al obtener estudiantes por curso y materia:', error);
        throw error;
    }
};
