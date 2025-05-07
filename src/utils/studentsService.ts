import { httpRequestFactory } from './HttpRequestFactory';

export const getStudents = async (id: number, role: string, managementId: number) => {
  try {
    const { url, config } = httpRequestFactory.createRequest(
      `/tutor-student/${id}/${role}/courses-subjects?managementId=${managementId}`
    );
    const response = await fetch(url, config);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error en getStudents:', error);
    throw error;
  }
}; 