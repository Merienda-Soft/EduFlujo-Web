import { httpRequestFactory } from './HttpRequestFactory';
import { getCurrentUserId } from './globalState';

export interface SupportMaterialFile {
  name: string;
  url: string;
}

export interface SupportMaterial {
  id: number;
  file: SupportMaterialFile;
  submitted_at: string;
}

export const uploadSupportMaterial = async (courseId: number, subjectId: number, managementId: number, fileData: SupportMaterialFile) => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }
    
    const { url, config } = httpRequestFactory.createRequest(
      `/content/${courseId}/${subjectId}/${managementId}`,
      'POST',
      { 
        file: fileData,
        created_by: currentUserId
      }
    );
    const response = await fetch(url, config);
    const responseText = await response.text();
    try {
      const data = JSON.parse(responseText);
      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar el archivo');
      }
      return { ok: true, data };
    } catch (parseError) {
      throw new Error('Error en la respuesta del servidor');
    }
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const getSupportMaterials = async (courseId: number, subjectId: number, managementId: number) => {
  const { url, config } = httpRequestFactory.createRequest(
    `/content/${courseId}/${subjectId}/${managementId}`
  );
  const response = await fetch(url, config);
  return response.json();
};

export const deleteSupportMaterial = async (id: number) => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }
    
    const { url, config } = httpRequestFactory.createRequest(
      `/content/${id}`,
      'DELETE',
      { deleted_by: currentUserId }
    );
    const response = await fetch(url, config);
    const responseText = await response.text();
    try {
      const data = JSON.parse(responseText);
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar el archivo');
      }
      return { ok: true, data };
    } catch (parseError) {
      throw new Error('Error en la respuesta del servidor');
    }
  } catch (error) {
    return { ok: false, error: error.message };
  }
}; 