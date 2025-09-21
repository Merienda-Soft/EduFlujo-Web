import { httpRequestFactory } from './HttpRequestFactory';

export const getStudentCredentials = async (managementId: number, courseId: number) => {
  try {
    const { url, config } = httpRequestFactory.createRequest(`/credentials/credentials?management=${managementId}&courseId=${courseId}`);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error al obtener las credenciales');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};
