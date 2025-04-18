import axios from 'axios';
import { httpRequestFactory } from './HttpRequestFactory';

//URL SERVICE PDF
const SERVICE_PDF_URL = process.env.NEXT_PUBLIC_SERVICE_PDF_URL

//UPLOAD PDF

export const uploadPdf = async (file) => {
    const formData = new FormData();
    formData.append('pdf', file); 
  
    try {
      const response = await axios.post(SERVICE_PDF_URL, formData, {
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
      const { url, config } = httpRequestFactory.createRequest(`/registration/curso/${cursoId}`);
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
      const { url, config } = httpRequestFactory.createRequest('/registration', 'POST', inscripcionData);
      const response = await fetch(url, config);
      if (!response.ok) throw new Error('Error al crear la inscripción');
       return await response.json();
     } catch (error) {
       console.error('Error al crear la inscripción:', error);
       throw error;
     }
  };
  
  
  export const updateInscripcion = async (id: string, inscripcionData: any) => {
    try {
      const { url, config } = httpRequestFactory.createRequest(`/registration/${id}`, 'PUT', inscripcionData);
      const response = await fetch(url, config);
      if (!response.ok) throw new Error('Error al actualizar la inscripción');
      return await response.json();
    } catch (error) {
      console.error(`Error al actualizar la inscripción con ID ${id}:`, error);
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