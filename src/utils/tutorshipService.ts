import { httpRequestFactory } from './HttpRequestFactory';
import axios from 'axios';

const SERVICE_URL = process.env.NEXT_PUBLIC_SERVICE_URL;


export const validateDocument = async (frontImage, backImage) => {
  const formData = new FormData();
  formData.append('front_image', frontImage);
  formData.append('back_image', backImage);

  try {
    const response = await axios.post(`${SERVICE_URL}/validate_document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Response from validate_document:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al validar documento:', error);
    throw error;
  }
};

export const getTutorShipByStatus = async (value: number) => {
    try {
      const { url, config } = httpRequestFactory.createRequest(`/tutor-student/${value}`);
      const response = await fetch(url, config);
      if (!response.ok) throw new Error('Error al obtener las tutorias');
      return await response.json();
    } catch (error) {
      console.error('Error al obtener las tutorias:', error);
      throw error;
    }
};

export const createTutorWithTutorship = async (tutorshipData) => {
    console.log('Tutorship data:', tutorshipData); 
    try {
      const { url, config } = httpRequestFactory.createRequest('/tutor-student/tutorship', 'POST', tutorshipData);
      const response = await fetch(url, config);
      const responseData = await response.json(); 
      if (!response.ok) throw new Error(responseData.error);
       return responseData;
     } catch (error) {
       console.error('Hubo un error al registrar los dato de tutor:', error);
       throw error;
     }
};

export const getStudentsRudeOrCi = async (studentData) => {
  try{
    const { url, config } = httpRequestFactory.createRequest('/tutor-student/students/rude_ci', 'POST', studentData);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al obtener la información del estudiante');
    return await response.json();
  }
  catch (error) {
    console.error('Error al obtener la información del estudiante:', error);
    throw error;
  }
};

export const createTutor = async (tutorshipData) => {
    try {
      const { url, config } = httpRequestFactory.createRequest('/tutor-student', 'POST', tutorshipData);
      const response = await fetch(url, config);
      if (!response.ok) throw new Error('Error al crear la inscripción');
       return await response.json();
     } catch (error) {
       console.error('Hubo un error al registrar los dato de tutor:', error);
       throw error;
     }
};

export const createTutorShip = async (tutorshipData) => {
  try {
    const { url, config } = httpRequestFactory.createRequest('/tutor-student/request', 'POST', tutorshipData);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Hubo un error al registrar la tutoria');
     return await response.json();
   } catch (error) {
     console.error('Hubo un error al registrar la tutoria:', error);
     throw error;
   }
};

export const updateTutor = async (tutorshipData) => {
  try {
    const { url, config } = httpRequestFactory.createRequest('/tutor-student', 'PUT', tutorshipData);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error en el proceso de actualización');
     return await response.json();
   } catch (error) {
     console.error('Error en el proceso de actualización:', error);
     throw error;
   }
};

export const getTutorByEmail = async (email: string) => {
  try {
    const { url, config } = httpRequestFactory.createRequest(`/tutor-student/email/${email}`);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al obtener la informacion del tutor');
    return await response.json();
  } catch (error) {
    console.error('Error al obtener la informacion del tutor:', error);
    throw error;
  }
};

export const getStudentsByCourse = async (course_id: number) => {
  try {
    const { url, config } = httpRequestFactory.createRequest(`/tutor-student/course/${course_id}`);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al obtener la informacion de los estudiantes');
    return await response.json();
  } catch (error) {
    console.error('Error al obtener la informacion de los estudiantes:', error);
    throw error;
  }
};

export const getCourseByDegree = async (degree_id: number) => {
  try {
    const { url, config } = httpRequestFactory.createRequest(`/course/degree/${degree_id}`);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al obtener la informacion de cursos por grado');
    return await response.json();
  } catch (error) {
    console.error('Error al obtener la informacion de cursos por grado:', error);
    throw error;
  }
};
