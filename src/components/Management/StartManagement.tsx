'use client';
import { useState, useEffect } from 'react';
import { getMaterias } from '../../utils/courseService';
import { createManagement, getDegree } from '../../utils/managementService';
import Swal from 'sweetalert2';

interface Materia {
  id: number;
  subject: string;
  is_tecnical: number;
  status: number;
}

interface Degree {
  id: number;
  degree: string;
}

interface GradeCourseData {
  grade: number;
  courseCount: number;
  parallels: string[];
}

const StartManagement = () => {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [firstQuarterStart, setFirstQuarterStart] = useState<string>('');
  const [firstQuarterEnd, setFirstQuarterEnd] = useState<string>('');
  const [secondQuarterStart, setSecondQuarterStart] = useState<string>('');
  const [secondQuarterEnd, setSecondQuarterEnd] = useState<string>('');
  const [thirdQuarterStart, setThirdQuarterStart] = useState<string>('');
  const [thirdQuarterEnd, setThirdQuarterEnd] = useState<string>('');
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [selectedMaterias, setSelectedMaterias] = useState<number[]>([]);
  const [paralelos, setParalelos] = useState<{ [key: string]: number }>({});
  const [gradeCourseData, setGradeCourseData] = useState<GradeCourseData[]>([]);
  const [showCursosGenerados, setShowCursosGenerados] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getCurrentYear = () => {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      setCurrentYear(year);
      
      // Set default dates
      setStartDate(`${year}-01-01`);
      setEndDate(`${year}-12-31`);
      
      // Set quarter dates
      setFirstQuarterStart(`${year}-02-01`);
      setFirstQuarterEnd(`${year}-04-31`);
      setSecondQuarterStart(`${year}-05-01`);
      setSecondQuarterEnd(`${year}-08-30`);
      setThirdQuarterStart(`${year}-09-01`);
      setThirdQuarterEnd(`${year}-11-30`);
    };

    getCurrentYear();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch degrees and materias in parallel
        const [degreesData, materiasData] = await Promise.all([
          getDegree(),
          getMaterias()
        ]);

        setDegrees(degreesData);
        setMaterias(materiasData);
        
        // Initialize paralelos with degree ids
        const initialParalelos: { [key: string]: number } = {};
        degreesData.forEach(degree => {
          initialParalelos[degree.id] = 0;
        });
        setParalelos(initialParalelos);
        
        // Select all materias by default
        const allMateriaIds = materiasData.map((materia) => materia.id);
        setSelectedMaterias(allMateriaIds);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los datos iniciales',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(e.target.value);
  };

  const handleMateriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const materiaId = parseInt(value, 10);
    
    setSelectedMaterias((prevSelectedMaterias) =>
      checked
        ? [...prevSelectedMaterias, materiaId]
        : prevSelectedMaterias.filter((id) => id !== materiaId)
    );
  };

  const handleParaleloChange = (e: React.ChangeEvent<HTMLInputElement>, degreeId: number) => {
    const { value } = e.target;
    const parsedValue = parseInt(value, 10);

    if (isNaN(parsedValue)) {
      Swal.fire({
        icon: 'error',
        title: 'Valor inválido',
        text: 'Debe ingresar un número válido',
      });
      return;
    }

    setParalelos((prevParalelos) => ({
      ...prevParalelos,
      [degreeId]: parsedValue,
    }));
  };

  const handleActualizarCursos = () => {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Validate all inputs first
    for (const degree of degrees) {
      const cantidadParalelos = paralelos[degree.id];

      if (cantidadParalelos === undefined || isNaN(cantidadParalelos)) {
        Swal.fire({
          icon: 'error',
          title: 'Valor inválido',
          text: `Debe ingresar un número válido para el ${degree.degree}`,
        });
        return;
      }
    }

    // Generate gradeCourseData
    const newGradeCourseData: GradeCourseData[] = degrees.map((degree) => {
      const cantidadParalelos = paralelos[degree.id] || 0;
      const parallels = [];
      
      for (let i = 0; i < cantidadParalelos; i++) {
        parallels.push(letras[i]);
      }

      return {
        grade: degree.id,
        courseCount: cantidadParalelos,
        parallels
      };
    });

    setGradeCourseData(newGradeCourseData);
    setShowCursosGenerados(true);
  };

  const formatDateToISO = (dateString: string) => {
    const date = new Date(dateString);
    
    // For start dates, set to beginning of day (00:00:00.000)
    if (dateString === startDate || dateString === firstQuarterStart || 
        dateString === secondQuarterStart || dateString === thirdQuarterStart) {
      date.setHours(0, 0, 0, 0);
    }
    else {
      date.setHours(23, 59, 59, 999);
    }
    
    return date.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentYear) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se ha establecido el año de gestión',
      });
      return;
    }

    const managementData = {
      management: currentYear,
      start_date: formatDateToISO(startDate),
      end_date: formatDateToISO(endDate),
      first_quarter_start: formatDateToISO(firstQuarterStart),
      first_quarter_end: formatDateToISO(firstQuarterEnd),
      second_quarter_start: formatDateToISO(secondQuarterStart),
      second_quarter_end: formatDateToISO(secondQuarterEnd),
      third_quarter_start: formatDateToISO(thirdQuarterStart),
      third_quarter_end: formatDateToISO(thirdQuarterEnd),
    };

    const requestData = {
      managementData,
      gradeCourseData,
      subjectIds: selectedMaterias
    };

    try {
      const response = await createManagement(requestData);
      console.log('Gestión creada con éxito:', response);
      Swal.fire({
        icon: 'success',
        title: 'Gestión creada con éxito',
        text: `La gestión para el año ${currentYear} ha sido creada exitosamente.`,
      });
      window.location.href = '/course';
    } catch (error) {
      console.error('Error al crear la gestión:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al crear la gestión',
        text: 'Hubo un error al intentar crear la gestión. Por favor, inténtalo de nuevo.',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Cargando datos iniciales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestión {currentYear}</h1>
      </div>
      <div className="bg-white dark:bg-gray-900 bg-opacity-100 p-8 rounded-md shadow-lg">
        <form onSubmit={handleSubmit}>
          {/* Sección de Fechas */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Fechas de la Gestión</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-lg font-medium mb-2" htmlFor="startDate">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => handleDateChange(e, setStartDate)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-lg font-medium mb-2" htmlFor="endDate">
                  Fecha de Finalización
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => handleDateChange(e, setEndDate)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Trimestres</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Primer Trimestre */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Primer Trimestre</h4>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Inicio</label>
                  <input
                    type="date"
                    value={firstQuarterStart}
                    onChange={(e) => handleDateChange(e, setFirstQuarterStart)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Fin</label>
                  <input
                    type="date"
                    value={firstQuarterEnd}
                    onChange={(e) => handleDateChange(e, setFirstQuarterEnd)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                  />
                </div>
              </div>

              {/* Segundo Trimestre */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Segundo Trimestre</h4>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Inicio</label>
                  <input
                    type="date"
                    value={secondQuarterStart}
                    onChange={(e) => handleDateChange(e, setSecondQuarterStart)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Fin</label>
                  <input
                    type="date"
                    value={secondQuarterEnd}
                    onChange={(e) => handleDateChange(e, setSecondQuarterEnd)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                  />
                </div>
              </div>

              {/* Tercer Trimestre */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Tercer Trimestre</h4>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Inicio</label>
                  <input
                    type="date"
                    value={thirdQuarterStart}
                    onChange={(e) => handleDateChange(e, setThirdQuarterStart)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Fin</label>
                  <input
                    type="date"
                    value={thirdQuarterEnd}
                    onChange={(e) => handleDateChange(e, setThirdQuarterEnd)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Materias */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Malla Curricular</h2>
            <div className="flex flex-wrap">
              {materias.map((materia) => (
                <div key={materia.id} className="w-full md:w-1/2 px-3 mb-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value={materia.id}
                      checked={selectedMaterias.includes(materia.id)}
                      onChange={handleMateriaChange}
                      className="form-checkbox h-5 w-5 text-primary cursor-pointer"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">{materia.subject}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Sección de Paralelos */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Paralelos por Grado</h2>
            <div className="flex flex-wrap items-center">
              {degrees.map((degree) => (
                <div key={`degree-${degree.id}`} className="flex items-center mr-6 mb-4">
                  <span className="mr-2 text-gray-700 dark:text-gray-300">{degree.degree}</span>
                  <input
                    type="number"
                    min="0"
                    value={paralelos[degree.id] || ''}
                    onChange={(e) => handleParaleloChange(e, degree.id)}
                    className="shadow appearance-none border rounded w-20 py-2 px-3 text-gray-800 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={handleActualizarCursos}
                className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition duration-300 mb-4 ml-5"
              >
                Actualizar Cursos
              </button>
            </div>
          </div>

          {/* Sección de Cursos Generados */}
          {showCursosGenerados && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Cursos Generados</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {gradeCourseData.map((gradeData) => {
                  const degree = degrees.find(d => d.id === gradeData.grade);
                  return (
                    <div key={`grade-${gradeData.grade}`}>
                      <h3 className="text-gray-700 dark:text-gray-300 font-bold mb-2">
                        {degree ? degree.degree : `Grado ${gradeData.grade}`}
                      </h3>
                      <ul className="list-disc pl-5">
                        {gradeData.parallels.map((parallel, index) => (
                          <li key={index} className="text-gray-700 dark:text-gray-300">
                            {degree ? degree.degree : `Grado ${gradeData.grade}`} {parallel}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Total: {gradeData.courseCount} paralelo(s)
                      </p>
                    </div>
                  );
                })}
              </div>
              <hr className="my-8 border-gray-200 dark:border-gray-700" />
            </div>
          )}

          {/* Botón de Guardar */}
          <div className="flex justify-center">
            <button
              type="submit"
              className={`bg-primary text-white px-8 py-3 rounded-md transition duration-300 ${
                showCursosGenerados ? 'hover:bg-primary-dark' : 'opacity-50 cursor-not-allowed'
              }`}
              disabled={!showCursosGenerados}
            >
              Guardar Gestión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartManagement;