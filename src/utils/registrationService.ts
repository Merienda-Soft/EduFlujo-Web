import axios from 'axios';
import { httpRequestFactory } from './HttpRequestFactory';
import { getCurrentUserId } from './globalState';

//URL SERVICE PDF
const SERVICE_URL = process.env.NEXT_PUBLIC_SERVICE_URL;

//UPLOAD PDF

export const uploadPdf = async (file) => {
    const formData = new FormData();
    formData.append('pdf', file); 
  
    try {
      const response = await axios.post(`${SERVICE_URL}/upload_pdf`, formData, {
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
  
  // INSCRIPCIONES
  
  export const getInscripciones = async () => {
    try {
      const { url, config } = httpRequestFactory.createRequest('/registration');
      const response = await fetch(url, config);
      if (!response.ok) throw new Error('Error al obtener las inscripciones');
      return await response.json();
    } catch (error) {
      console.error('Error al obtener las inscripciones:', error);
      throw error;
    }
  };
  
  export const getInscriptionsByCourseId = async (cursoId: number) => {
    try {
      const { url, config } = httpRequestFactory.createRequest(`/registration/course/${cursoId}`);
      const response = await fetch(url, config);
      if (!response.ok) throw new Error('Error al obtener las inscripciones para el curso');
      return await response.json();
    } catch (error) {
      console.error('Error al obtener las inscripciones por curso:', error);
      throw error;
    }
  };
  
  export const createInscripcion = async (inscripcionData) => {
    console.log('Inscripcion Data:', inscripcionData);
    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        throw new Error('Usuario no autenticado');
      }
      
      const { url, config } = httpRequestFactory.createRequest('/registration', 'POST', {
        ...inscripcionData,
        created_by: currentUserId
      });
      const response = await fetch(url, config);
      if (!response.ok) throw new Error('Error al crear la inscripción');
       return await response.json();
     } catch (error) {
       console.error('Error al crear la inscripción:', error);
       throw error;
     }
  };
  
  
  export const updateInscripcion = async (registrationUpdates) => {
    console.log('registrationUpdates SERVICES:', registrationUpdates); 
    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        throw new Error('Usuario no autenticado');
      }
      
      const { url, config } = httpRequestFactory.createRequest(`/registration`, 'PUT', {
        ...registrationUpdates,
        updated_by: currentUserId
      });
      const response = await fetch(url, config);
      if (!response.ok) throw new Error('Error al actualizar la inscripción');
      return await response.json();
    } catch (error) {
      console.error(`Error al actualizar la inscripción`, error);
      throw error;
    }
  };
  
  export const deleteInscripcion = async (id: string) => {
    try {
      const { url, config } = httpRequestFactory.createRequest(`/registration/${id}`, 'DELETE');
      const response = await fetch(url, config);
      if (!response.ok) throw new Error('Error al eliminar la inscripción');
      return await response.json();
    } catch (error) {
      console.error(`Error al eliminar la inscripción con ID ${id}:`, error);
      throw error;
    }
  };
  
  export const getStudentsByCourseAndSubject = async (courseId: string, subjectId: string) => {
    try {
      const { url, config } = httpRequestFactory.createRequest(`/registration/students?courseid=${courseId}&materiaid=${subjectId}`);
      const response = await fetch(url, config);
      if (!response.ok) throw new Error('Error al obtener estudiantes por curso y materia');
      return await response.json();
    } catch (error) {
      console.error('Error al obtener estudiantes por curso y materia:', error);
      throw error;
    }
  };