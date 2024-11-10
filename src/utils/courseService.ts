// src/utils/courseService.ts
export const createCourse = async (courseData: { name: string; materias: string[] }) => {
    try {
      const response = await fetch('http://localhost:3001/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });
  
      if (!response.ok) {
        throw new Error('Failed to create course');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  };

  export const getCourseById = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/courses/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  };
  
  export const updateCourse = async (courseId: string, courseData: { name: string; materias: string[] }) => {
    try {
      const response = await fetch(`http://localhost:3001/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });
  
      if (!response.ok) {
        throw new Error('Error al actualizar el curso');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error actualizando el curso:', error);
      throw error;
    }
  };
  
  export const deleteCourse = async (Id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/courses/${Id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ __v: 1 }), 
      });
  
      if (!response.ok) {
        throw new Error('Error al eliminar el curso');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error eliminando el curso:', error);
      throw error;
    }
  };
  
  
  //Materias
  export const getMaterias = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/subjects');
    
      if (!response.ok) {
        throw new Error('Failed to fetch materias');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error fetching materias:', error);
      throw error;
    }
  };

  export const createMateria = async (materiaData: { name: string }) => {
    try {
      const response = await fetch('http://localhost:3001/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materiaData),
      });
  
      if (!response.ok) {
        throw new Error('Failed to create materia');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error creating materia:', error);
      throw error;
    }
};

export const updateMateriaState = async (id: string, deleted: number) => {
  try {
    const response = await fetch(`http://localhost:3001/api/subjects/state`, {
      method: 'PATCH', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, deleted }), 
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar el estado de la materia');
    }

    return await response.json();
  } catch (error) {
    console.error('Error actualizando el estado de la materia:', error);
    throw error;
  }
};