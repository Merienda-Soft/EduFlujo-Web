'use client';
import { useState, useEffect } from 'react';
import { getMaterias } from '../../utils/courseService';
import { createManagement } from '../../utils/managementService';
import Swal from 'sweetalert2';

interface Materia {
  _id: string;
  name: string;
}

const StartManagement = () => {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [selectedMaterias, setSelectedMaterias] = useState<string[]>([]);
  const [paralelos, setParalelos] = useState<{ [key: string]: number }>({});
  const [cursos, setCursos] = useState<{ [key: string]: string[] }>({});
  const [showCursosGenerados, setShowCursosGenerados] = useState<boolean>(false);

  useEffect(() => {
    const getCurrentYear = () => {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      setCurrentYear(year);
      setStartDate(`${year}-02-01`);
      setEndDate(`${year}-12-15`);
    };

    getCurrentYear();
  }, []);

  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        const materiasData = await getMaterias();
        setMaterias(materiasData);
        const allMateriaIds = materiasData.map((materia) => materia._id);
        setSelectedMaterias(allMateriaIds);
      } catch (error) {
        console.error('Error fetching materias:', error);
      }
    };

    fetchMaterias();
  }, []);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  const handleMateriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setSelectedMaterias((prevSelectedMaterias) =>
      checked
        ? [...prevSelectedMaterias, value]
        : prevSelectedMaterias.filter((id) => id !== value)
    );
  };

  const handleParaleloChange = (e: React.ChangeEvent<HTMLInputElement>, grado: string) => {
    const { value } = e.target;
    const parsedValue = parseInt(value, 10);

    if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 9) {
      Swal.fire({
        icon: 'error',
        title: 'Valor inválido',
        text: 'El número de paralelos debe estar entre 0 y 9.',
      });
      return;
    }

    setParalelos((prevParalelos) => ({
      ...prevParalelos,
      [grado]: parsedValue,
    }));
  };

  const handleActualizarCursos = () => {
    const grados = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto'];
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (const grado of grados) {
      const cantidadParalelos = paralelos[grado];

      if (cantidadParalelos === undefined || isNaN(cantidadParalelos) || cantidadParalelos < 0 || cantidadParalelos > 9) {
        Swal.fire({
          icon: 'error',
          title: 'Valor inválido',
          text: 'El número de paralelos debe estar entre 0 y 9.',
        });
        return;
      }
    }

    const nuevosCursos: { [key: string]: string[] } = {};
    grados.forEach((grado) => {
      const cantidadParalelos = paralelos[grado] || 0;
      nuevosCursos[grado] = [];
      for (let i = 0; i < cantidadParalelos; i++) {
        nuevosCursos[grado].push(`${grado} ${letras[i]}`);
      }
    });

    setCursos(nuevosCursos);
    setShowCursosGenerados(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cursosArray = Object.keys(cursos).flatMap((grado) =>
      cursos[grado].map((curso) => ({ name: curso }))
    );

    const managementData = {
      year: currentYear,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      cursos: cursosArray,
      materias: selectedMaterias,
    };

    try {
      const response = await createManagement(managementData);
      console.log('Gestión creada con éxito:', response);
      Swal.fire({
        icon: 'success',
        title: 'Gestión creada con éxito',
        text: `La gestión para el año ${managementData.year} ha sido creada exitosamente.`,
      });
    } catch (error) {
      console.error('Error al crear la gestión:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al crear la gestión',
        text: 'Hubo un error al intentar crear la gestión. Por favor, inténtalo de nuevo.',
      });
    }
  };

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
            <div className="flex flex-wrap -mx-3">
              <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                <label className="block text-gray-700 dark:text-gray-300 text-lg font-medium mb-2" htmlFor="startDate">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={handleStartDateChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="w-full md:w-1/2 px-3">
                <label className="block text-gray-700 dark:text-gray-300 text-lg font-medium mb-2" htmlFor="endDate">
                  Fecha de Finalización
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={handleEndDateChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            </div>
          </div>

          {/* Sección de Materias */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Malla Curricular</h2>
            <div className="flex flex-wrap">
              {materias.map((materia) => (
                <div key={materia._id} className="w-full md:w-1/2 px-3 mb-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value={materia._id}
                      checked={selectedMaterias.includes(materia._id)}
                      onChange={handleMateriaChange}
                      className="form-checkbox h-5 w-5 text-primary cursor-pointer"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">{materia.name}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Sección de Paralelos */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Paralelos por Grado</h2>
            <div className="flex flex-wrap items-center">
              {['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto'].map((grado) => (
                <div key={grado} className="flex items-center mr-6 mb-4">
                  <span className="mr-2 text-gray-700 dark:text-gray-300">{grado}</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={paralelos[grado] || ''}
                    onChange={(e) => handleParaleloChange(e, grado)}
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
                {Object.keys(cursos).map((grado) => (
                  <div key={grado}>
                    <h3 className="text-gray-700 dark:text-gray-300 font-bold mb-2">{grado} Grado</h3>
                    <ul className="list-disc pl-5">
                      {cursos[grado].map((curso, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">{curso}</li>
                      ))}
                    </ul>
                  </div>
                ))}
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