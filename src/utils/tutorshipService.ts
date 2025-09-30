'use client';
import { httpRequestFactory } from './HttpRequestFactory';
import axios from 'axios';
import { getCurrentUserId } from './globalState';
import { locationData } from '../components/AutoComplete/locationData';

const SERVICE_URL = process.env.NEXT_PUBLIC_SERVICE_URL;

export interface ExtractedDocumentData {
  name?: string;
  lastname?: string;
  second_lastname?: string;
  birth_date?: string;
  ci?: string;
  pais?: string;
  departamento?: string;
  provincia?: string;
  localidad?: string;
}

export interface DocumentValidationResult {
  success: boolean;
  is_valid: boolean;
  data: {
    raw_texts: {
      front: string | null;
      back: string | null;
    };
    validation_scores?: {
      front?: { [key: string]: number };
      back?: { [key: string]: number };
    };
  };
  details?: any;
  error: string;
}

export interface DocumentExtraction extends DocumentValidationResult {
  extractedData?: ExtractedDocumentData;
}

export const validateDocument = async (frontImage: File, backImage: File): Promise<DocumentExtraction> => {
  const formData = new FormData();
  formData.append('front_image', frontImage);
  formData.append('back_image', backImage);

  try {
    const response = await axios.post<DocumentValidationResult>(`${SERVICE_URL}/validate_document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Response from validate_document:', response.data);
    
    if (response.data.is_valid && response.data.data?.raw_texts) {
      const extractedData = extractDocumentData(response.data.data.raw_texts);
      return {
        ...response.data,
        extractedData 
      };
    }
    
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
      const currentUserId = getCurrentUserId();
      
      const { url, config } = httpRequestFactory.createRequest('/tutor-student/tutorship', 'POST', {
        ...tutorshipData,
        created_by: currentUserId
      });
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
    if (!response.ok) throw new Error('Los datos de estudiante no son correctos o no existen, Revise nuevamente antes de enviar');
    return await response.json();
  }
  catch (error) {
    console.error('Los datos de estudiante no son correctos o no existen, Revise nuevamente antes de enviar', error);
    throw error;
  }
};

export const createTutor = async (tutorshipData) => {
    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        throw new Error('Usuario no autenticado');
      }
      
      const { url, config } = httpRequestFactory.createRequest('/tutor-student', 'POST', {
        ...tutorshipData,
        created_by: currentUserId
      });
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
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }
    
    const { url, config } = httpRequestFactory.createRequest('/tutor-student/request', 'POST', {
      ...tutorshipData,
      created_by: currentUserId
    });
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
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }
    
    const { url, config } = httpRequestFactory.createRequest('/tutor-student', 'PUT', {
      ...tutorshipData,
      updated_by: currentUserId
    });
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

export const getStudentByEmail = async (email: string) => {
  try {
    const { url, config } = httpRequestFactory.createRequest(`/tutor-student/student/email/${email}`);
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

//Extract document data
type DocumentType = 'OLD_FORMAT' | 'NEW_FORMAT' | 'FOREIGN_FORMAT';

export const extractDocumentData = (rawTexts: {front: string | null, back: string | null}): ExtractedDocumentData => {
  const documentType = detectDocumentType(rawTexts.front);
  
  if (documentType === 'NEW_FORMAT') {
    return extractNewFormatData(rawTexts);
  } 
  if (documentType === 'FOREIGN_FORMAT') {
    return extractForeignFormatData(rawTexts);
  } else {
    return extractOldFormatData(rawTexts);
  }
};

const detectDocumentType = (frontText: string | null): DocumentType => {
  if (!frontText) return 'OLD_FORMAT';
  
  const lines = frontText.split('\n').map(line => line.trim());
  const checks = [
    { lineIndex: 3, text: 'CÉDULA DE IDENTIDAD DE EXTRANJERO', type: 'FOREIGN_FORMAT' },
    { lineIndex: 1, text: 'SERVICIO GENERAL DE IDENTIFICACIÓN PERSONAL IDENTIDAD', type: 'NEW_FORMAT' }
  ];
  
  for (const check of checks) {
    if (lines.length > check.lineIndex) {
      const similarity = calculateSimilarity(lines[check.lineIndex].toUpperCase(), check.text);
      console.log(`Line ${check.lineIndex} similarity (${check.type}):`, similarity, 'Text:', lines[check.lineIndex]);
      
      if (similarity > 0.7) return check.type as DocumentType;
    }
  }
  
  return 'OLD_FORMAT';
};

const extractOldFormatData = (rawTexts: {front: string | null, back: string | null}): ExtractedDocumentData => {
  const result: ExtractedDocumentData = {};
  
  if (rawTexts.back) {
    const nameMatch = rawTexts.back.match(/A: ([A-ZÑ ]+) fl/);
    if (nameMatch) {
      const fullName = nameMatch[1].trim();
      const nameParts = fullName.split(' ');
      result.name = nameParts.slice(0, -2).join(' '); 
      result.lastname = nameParts[nameParts.length - 2];
      result.second_lastname = nameParts[nameParts.length - 1]; 
    }

    const birthDateMatch = rawTexts.back.match(/Nacido el (\d+ de \w+ de \d{4})/);
    if (birthDateMatch) {
      const spanishDate = birthDateMatch[1];
      const months: {[key: string]: string} = {
        'Enero': '01', 'Febrero': '02', 'Marzo': '03', 'Abril': '04',
        'Mayo': '05', 'Junio': '06', 'Julio': '07', 'Agosto': '08',
        'Septiembre': '09', 'Octubre': '10', 'Noviembre': '11', 'Diciembre': '12'
      };
      
      const parts = spanishDate.split(' de ');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = months[parts[1]] || '01';
        const year = parts[2];
        result.birth_date = `${year}-${month}-${day}`;
      }
    }

    const ciMatch = rawTexts.front?.match(/No (\d{7})/);
    if (ciMatch) {
      result.ci = ciMatch[1];
    }

    const locationMatch = rawTexts.back.match(/-En ([A-Z ]+) - ([A-Z ]+) -([A-Z ]+)\. gb/);
    if (locationMatch) {
      const rawDepartamento = locationMatch[1].trim();
      const rawProvincia = locationMatch[2].trim();
      const rawLocalidad = locationMatch[3].trim();
      
      result.pais = 'BOLIVIA';
      result.departamento = correctLocationData(rawDepartamento, 'departamento');
      result.provincia = correctLocationData(rawProvincia, 'provincia');
      result.localidad = correctLocationData(rawLocalidad, 'localidad');
    }
  }

  return result;
};

const extractNewFormatData = (rawTexts: {front: string | null, back: string | null}): ExtractedDocumentData => {
  const result: ExtractedDocumentData = {};
  
  if (rawTexts.front) {
    const lines = rawTexts.front.split('\n').filter(line => line.trim() !== '');
    
    let nameLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('NOMBRES')) {
        nameLineIndex = i;
        break;
      }
    }
    
    if (nameLineIndex !== -1 && lines[nameLineIndex + 1]) {
      result.name = lines[nameLineIndex + 1].trim();
    }

    let lastnameLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('APELLIDOS')) {
        lastnameLineIndex = i;
        break;
      }
    }
    
    if (lastnameLineIndex !== -1 && lines[lastnameLineIndex + 1]) {
      const cleanedLastnameLine = lines[lastnameLineIndex + 1].trim()
        .replace(/[-_=:;\.]/g, ' ') 
        .replace(/\s+/g, ' ')      
        .trim();
      
      const apellidos = cleanedLastnameLine.split(' ');
      if (apellidos.length >= 1) {
        result.lastname = apellidos[0];
        result.second_lastname = apellidos.length >= 2 ? apellidos.slice(1).join(' ') : '';
      }
    }

    let birthDateLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('FECHA DE NACIMIENTO')) {
        birthDateLineIndex = i;
        break;
      }
    }
    
    if (birthDateLineIndex !== -1 && lines[birthDateLineIndex + 1]) {
      const dateMatch = lines[birthDateLineIndex + 1].match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (dateMatch) {
        const day = dateMatch[1];
        const month = dateMatch[2];
        const year = dateMatch[3];
        result.birth_date = `${year}-${month}-${day}`;
      }
    }
    
    const ciMatch = rawTexts.front.match(/N\s*(\d{7,10})/);
    if (ciMatch) {
      result.ci = ciMatch[1];
    }
  }
  
  if (rawTexts.back) {
    const lines = rawTexts.back.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
      const locationMatch = line.match(/(?:EL\s+)?([A-ZÑÁÉÍÓÚÜ][A-ZÑÁÉÍÓÚÜ\s]+)-([A-ZÑÁÉÍÓÚÜ][A-ZÑÁÉÍÓÚÜ\s]+)-([A-ZÑÁÉÍÓÚÜ][A-ZÑÁÉÍÓÚÜ\s]+)/i);
      
      if (locationMatch) {
        let rawDepartamento = locationMatch[1].trim();
        let rawProvincia = locationMatch[2].trim();
        let rawLocalidad = locationMatch[3].trim();
        
        rawLocalidad = cleanLocalidadText(rawLocalidad);
        
        result.pais = 'BOLIVIA';
        result.departamento = correctLocationData(rawDepartamento, 'departamento');
        result.provincia = correctLocationData(rawProvincia, 'provincia');
        result.localidad = correctLocationData(rawLocalidad, 'localidad');
        break;
      }
    }
  }
  
  return result;
};

const extractForeignFormatData = (rawTexts: {front: string | null, back: string | null}): ExtractedDocumentData => {
  const result: ExtractedDocumentData = {};
  
  if (rawTexts.front) {
    const lines = rawTexts.front.split('\n').map(line => line.trim()).filter(line => line !== '');
    
    let nameLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Nombres, Apellidos:')) {
        nameLineIndex = i;
        break;
      }
    }
    
    if (nameLineIndex !== -1) {
      if (lines[nameLineIndex + 1]) {
        result.name = lines[nameLineIndex + 1].trim().replace(/[,]/g, '');
      }
      if (lines[nameLineIndex + 2]) {
        result.lastname = lines[nameLineIndex + 2].trim().replace(/[,]/g, '');
      }
      if (lines[nameLineIndex + 3]) {
        result.second_lastname = lines[nameLineIndex + 3].trim().replace(/[,]/g, '');
      }
    }
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Nacionalidad:')) {
        if (lines[i + 1]) {
          const paisLine = lines[i + 1].trim();
          const palabras = paisLine.split(/\s+/);
          if (palabras.length > 1) {
            result.pais = palabras.slice(1).join(' ').trim();
          }
        }
        break;
      }
    }
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Fecha de Nacimiento:')) {
        const dateMatch = lines[i].match(/Fecha de Nacimiento:\s*(\d+)\s+(\w{3})\s+(\d{4})/i);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const month = convertMonthAbbreviation(dateMatch[2]);
          const year = dateMatch[3];
          result.birth_date = `${year}-${month}-${day}`;
        }
        break;
      }
    }
    
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].startsWith('E-')) {
        result.ci = lines[i]; 
        break;
      }
    }
  }
  return result;
};

const convertMonthAbbreviation = (monthAbbr: string): string => {
  const months: {[key: string]: string} = {
    'ENE': '01', 'EN': '01',
    'FEB': '02', 'FB': '02',
    'MAR': '03', 'MR': '03',
    'ABR': '04', 'AB': '04',
    'MAY': '05', 'MY': '05',
    'JUN': '06', 'JN': '06',
    'JUL': '07', 'JL': '07',
    'AGO': '08', 'AG': '08',
    'SEP': '09', 'SP': '09',
    'OCT': '10', 'OC': '10',
    'NOV': '11', 'NV': '11',
    'DIC': '12', 'DC': '12'
  };
  
  return months[monthAbbr.toUpperCase()] || '01';
};

const cleanLocalidadText = (localidadText: string): string => {
  const cleaned = localidadText
    .replace(/\bEZ\b/g, '')
    .replace(/\n/g, ' ')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  return correctLocationData(cleaned, 'localidad');
};

const correctLocationData = (input: string, type: 'departamento' | 'provincia' | 'localidad'): string => {
  if (!input || input.trim() === '') return '';
  
  const cleanInput = input.trim().toUpperCase();
  const validData = locationData[type];
  
  if (validData.includes(cleanInput)) {
    return cleanInput;
  }
  
  let bestMatch = '';
  let bestScore = 0;
  
  for (const validLocation of validData) {
    const similarity = calculateSimilarity(cleanInput, validLocation);
    if (similarity > bestScore && similarity > 0.7) { // 70% de similitud mínima
      bestScore = similarity;
      bestMatch = validLocation;
    }
  }
  
  return bestMatch || cleanInput;
};

const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};