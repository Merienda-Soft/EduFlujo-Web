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
    console.log('Response:', response.data);
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
      if (!response.ok) throw new Error('Error al obtener las inscripciones');
      return await response.json();
    } catch (error) {
      console.error('Error al obtener las inscripciones:', error);
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
       console.error('Error al crear la inscripción:', error);
       throw error;
     }
};

export const createTutorShip = async (tutorshipData) => {
  console.log('Inscripcion Data:', tutorshipData);
  try {
    const { url, config } = httpRequestFactory.createRequest('/tutor-student/request', 'POST', tutorshipData);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al crear la inscripción');
     return await response.json();
   } catch (error) {
     console.error('Error al crear la inscripción:', error);
     throw error;
   }
};

export const updateTutor = async (tutorshipData) => {
  try {
    const { url, config } = httpRequestFactory.createRequest('/tutor-student', 'PUT', tutorshipData);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al crear la inscripción');
     return await response.json();
   } catch (error) {
     console.error('Error al crear la inscripción:', error);
     throw error;
   }
};