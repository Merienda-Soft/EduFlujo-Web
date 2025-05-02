'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getYearManagements, cloneManagement } from '../../utils/managementService';
import { DatePicker, Spin, message, Button, Card, Form, Row, Col, Typography, Input } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Management {
  id: number;
  management: number;
  start_date: string;
  end_date: string;
  first_quarter_start: string;
  first_quarter_end: string;
  second_quarter_start: string;
  second_quarter_end: string;
  third_quarter_start: string;
  third_quarter_end: string;
  status: number;
}

interface CloneResults {
  success: boolean;
  new_management_id: string;
  new_management_year: string;

  results: {
    new_courses: string;
    new_curricula: string;
    new_assignments: string;
    new_registrations: string;
  };
}

const AcademicYear = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [sourceManagement, setSourceManagement] = useState<Management | null>(null);
  const [managements, setManagements] = useState<Management[]>([]);
  const [results, setResults] = useState<CloneResults | null>(null);

  useEffect(() => {
    fetchManagements();
  }, []);

  const fetchManagements = async () => {
    try {
      setLoading(true);
      const data = await getYearManagements();
      setManagements(data);
      
      const activeManagements = data.filter((m: Management) => m.status === 1);
      
      if (activeManagements.length > 0) {
        const mostRecent = activeManagements.sort((a, b) => 
          new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
        )[0];
        
        setSourceManagement(mostRecent);
        prefillFormDates(mostRecent);
      } else {
        message.warning('No se encontraron gestiones activas');
      }
    } catch (error) {
      console.error('Error fetching managements:', error);
      message.error('Error al cargar las gestiones');
    } finally {
      setLoading(false);
    }
  };

  const prefillFormDates = (management: Management) => {
    if (!management) return;
    
    const nextYear = management.management + 1;
    
    form.setFieldsValue({
      newManagementYear: nextYear,
      quarterDates: {
        start_date: dayjs(`${nextYear}-01-01`),
        end_date: dayjs(`${nextYear}-12-31`),
        first_quarter_start: dayjs(management.first_quarter_start).add(1, 'year'),
        first_quarter_end: dayjs(management.first_quarter_end).add(1, 'year'),
        second_quarter_start: dayjs(management.second_quarter_start).add(1, 'year'),
        second_quarter_end: dayjs(management.second_quarter_end).add(1, 'year'),
        third_quarter_start: dayjs(management.third_quarter_start).add(1, 'year'),
        third_quarter_end: dayjs(management.third_quarter_end).add(1, 'year')
      }
    });
  };

  const handleSubmit = async () => {
    try {
      if (!sourceManagement) {
        throw new Error('No hay gestión seleccionada');
      }

      setLoading(true);
      setProgress('Validando datos...');
      
      const values = await form.validateFields();
      
      const formatDate = (date: dayjs.Dayjs) => date.toISOString();
      
      const quarterDates = {
        start_date: formatDate(values.quarterDates.start_date),
        end_date: formatDate(values.quarterDates.end_date),
        first_quarter_start: formatDate(values.quarterDates.first_quarter_start),
        first_quarter_end: formatDate(values.quarterDates.first_quarter_end),
        second_quarter_start: formatDate(values.quarterDates.second_quarter_start),
        second_quarter_end: formatDate(values.quarterDates.second_quarter_end),
        third_quarter_start: formatDate(values.quarterDates.third_quarter_start),
        third_quarter_end: formatDate(values.quarterDates.third_quarter_end)
      };

      setProgress('Clonando estructura académica...');
      const response = await cloneManagement({
        sourceManagementId: sourceManagement.id,
        newManagementYear: values.newManagementYear,
        quarterDates
      });

      const steps = [
        'Creando cursos...',
        'Asignando materias...',
        'Configurando paralelos...',
        'Finalizando proceso...'
      ];
      
      for (const step of steps) {
        setProgress(step);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      setResults(response);
      console.log('Clonación exitosa:', response);
      message.success('Gestión clonada exitosamente!');
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      message.error(`Error: ${error.message || 'Ocurrió un error al clonar la gestión'}`);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  if (loading && !sourceManagement) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Cargando gestiones...</p>
        </div>
      </div>
    );
  }

  if (!sourceManagement) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card 
          className="bg-white dark:bg-gray-900 p-8 rounded-md shadow-lg"
        >
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Clonar Gestión Académica
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              No se encontró ninguna gestión activa para clonar.
            </p>
            <Button 
              type="primary" 
              onClick={fetchManagements}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-md transition duration-300"
            >
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Clonar Gestión Académica
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-900 bg-opacity-100 p-8 rounded-md shadow-lg">
        {results ? (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Proceso completado exitosamente
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Nueva gestión creada para el año: <strong className="text-primary">{results.new_management_year}</strong>
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { title: 'Cursos creados', value: results.results.new_courses },
                { title: 'Materias asignadas', value: results.results.new_curricula },
                { title: 'Profesores asignados', value: results.results.new_assignments },
                { title: 'Estudiantes matriculados', value: results.results.new_registrations }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                    {item.title}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => {
                  setResults(null);
                  fetchManagements();
                }}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-2 rounded-md transition duration-300"
              >
                Crear otra gestión
              </Button>
              <Button 
                type="primary" 
                onClick={() => router.push('/course')}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-md transition duration-300"
              >
                Ir a Cursos
              </Button>
            </div>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              newManagementYear: sourceManagement.management + 1
            }}
          >
            <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Configuración de la Nueva Gestión
              </h2>

              <Form.Item 
                label={<span className="text-gray-700 dark:text-gray-300 text-lg font-medium">Año de la nueva gestión</span>}
                name="newManagementYear"
                rules={[{ 
                  required: true, 
                  message: 'Este campo es requerido',
                  validator: (_, value) => {
                    if (value <= sourceManagement.management) {
                      return Promise.reject('El año debe ser mayor al actual');
                    }
                    return Promise.resolve();
                  }
                }]}
              >
                <Input 
                  type="number" 
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min={sourceManagement.management + 1}
                />
              </Form.Item>
            </div>

            <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Fechas de la Gestión
              </h2>
              
              <Row gutter={16} className="mb-6">
                <Col span={12}>
                  <Form.Item
                    label={<span className="text-gray-700 dark:text-gray-300">Fecha de inicio</span>}
                    name={['quarterDates', 'start_date']}
                    rules={[{ required: true, message: 'Este campo es requerido' }]}
                  >
                    <DatePicker 
                      className="w-full shadow appearance-none border rounded py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      disabledDate={(current) => {
                        const year = form.getFieldValue('newManagementYear');
                        return current && current.year() !== year;
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={<span className="text-gray-700 dark:text-gray-300">Fecha de fin</span>}
                    name={['quarterDates', 'end_date']}
                    rules={[{ 
                      required: true, 
                      message: 'Este campo es requerido',
                      validator: (_, value) => {
                        const startDate = form.getFieldValue(['quarterDates', 'start_date']);
                        if (value && startDate && value.isBefore(startDate)) {
                          return Promise.reject('La fecha de fin debe ser posterior a la de inicio');
                        }
                        return Promise.resolve();
                      }
                    }]}
                  >
                    <DatePicker 
                      className="w-full shadow appearance-none border rounded py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      disabledDate={(current) => {
                        const year = form.getFieldValue('newManagementYear');
                        return current && current.year() !== year;
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Trimestres
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Primer Trimestre */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Primer Trimestre</h4>
                  <Form.Item
                    label={<span className="text-sm text-gray-600 dark:text-gray-400">Inicio</span>}
                    name={['quarterDates', 'first_quarter_start']}
                    rules={[{ 
                      required: true, 
                      message: 'Este campo es requerido',
                      validator: (_, value) => {
                        const startDate = form.getFieldValue(['quarterDates', 'start_date']);
                        if (value && startDate && value.isBefore(startDate)) {
                          return Promise.reject('Debe ser posterior a la fecha de inicio de gestión');
                        }
                        return Promise.resolve();
                      }
                    }]}
                  >
                    <DatePicker 
                      className="w-full shadow appearance-none border rounded py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                      disabledDate={(current) => {
                        const year = form.getFieldValue('newManagementYear');
                        return current && current.year() !== year;
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    label={<span className="text-sm text-gray-600 dark:text-gray-400">Fin</span>}
                    name={['quarterDates', 'first_quarter_end']}
                    rules={[{ 
                      required: true, 
                      message: 'Este campo es requerido',
                      validator: (_, value) => {
                        const startDate = form.getFieldValue(['quarterDates', 'first_quarter_start']);
                        if (value && startDate && value.isBefore(startDate)) {
                          return Promise.reject('Debe ser posterior a la fecha de inicio');
                        }
                        return Promise.resolve();
                      }
                    }]}
                  >
                    <DatePicker 
                      className="w-full shadow appearance-none border rounded py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                      disabledDate={(current) => {
                        const year = form.getFieldValue('newManagementYear');
                        return current && current.year() !== year;
                      }}
                    />
                  </Form.Item>
                </div>

                {/* Segundo Trimestre */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Segundo Trimestre</h4>
                  <Form.Item
                    label={<span className="text-sm text-gray-600 dark:text-gray-400">Inicio</span>}
                    name={['quarterDates', 'second_quarter_start']}
                    rules={[{ 
                      required: true, 
                      message: 'Este campo es requerido',
                      validator: (_, value) => {
                        const prevEnd = form.getFieldValue(['quarterDates', 'first_quarter_end']);
                        if (value && prevEnd && value.isBefore(prevEnd)) {
                          return Promise.reject('Debe ser posterior al primer trimestre');
                        }
                        return Promise.resolve();
                      }
                    }]}
                  >
                    <DatePicker 
                      className="w-full shadow appearance-none border rounded py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                      disabledDate={(current) => {
                        const year = form.getFieldValue('newManagementYear');
                        return current && current.year() !== year;
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    label={<span className="text-sm text-gray-600 dark:text-gray-400">Fin</span>}
                    name={['quarterDates', 'second_quarter_end']}
                    rules={[{ 
                      required: true, 
                      message: 'Este campo es requerido',
                      validator: (_, value) => {
                        const startDate = form.getFieldValue(['quarterDates', 'second_quarter_start']);
                        if (value && startDate && value.isBefore(startDate)) {
                          return Promise.reject('Debe ser posterior a la fecha de inicio');
                        }
                        return Promise.resolve();
                      }
                    }]}
                  >
                    <DatePicker 
                      className="w-full shadow appearance-none border rounded py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                      disabledDate={(current) => {
                        const year = form.getFieldValue('newManagementYear');
                        return current && current.year() !== year;
                      }}
                    />
                  </Form.Item>
                </div>

                {/* Tercer Trimestre */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Tercer Trimestre</h4>
                  <Form.Item
                    label={<span className="text-sm text-gray-600 dark:text-gray-400">Inicio</span>}
                    name={['quarterDates', 'third_quarter_start']}
                    rules={[{ 
                      required: true, 
                      message: 'Este campo es requerido',
                      validator: (_, value) => {
                        const prevEnd = form.getFieldValue(['quarterDates', 'second_quarter_end']);
                        if (value && prevEnd && value.isBefore(prevEnd)) {
                          return Promise.reject('Debe ser posterior al segundo trimestre');
                        }
                        return Promise.resolve();
                      }
                    }]}
                  >
                    <DatePicker 
                      className="w-full shadow appearance-none border rounded py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                      disabledDate={(current) => {
                        const year = form.getFieldValue('newManagementYear');
                        return current && current.year() !== year;
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    label={<span className="text-sm text-gray-600 dark:text-gray-400">Fin</span>}
                    name={['quarterDates', 'third_quarter_end']}
                    rules={[{ 
                      required: true, 
                      message: 'Este campo es requerido',
                      validator: (_, value) => {
                        const startDate = form.getFieldValue(['quarterDates', 'third_quarter_start']);
                        if (value && startDate && value.isBefore(startDate)) {
                          return Promise.reject('Debe ser posterior a la fecha de inicio');
                        }
                        const endDate = form.getFieldValue(['quarterDates', 'end_date']);
                        if (value && endDate && value.isAfter(endDate)) {
                          return Promise.reject('No puede ser posterior a la fecha de fin de gestión');
                        }
                        return Promise.resolve();
                      }
                    }]}
                  >
                    <DatePicker 
                      className="w-full shadow appearance-none border rounded py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                      disabledDate={(current) => {
                        const year = form.getFieldValue('newManagementYear');
                        return current && current.year() !== year;
                      }}
                    />
                  </Form.Item>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                disabled={loading}
                className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-md transition duration-300"
              >
                Crear Nueva Gestión
              </Button>
            </div>

            {progress && (
              <div className="text-center mt-4">
                <Spin tip={progress} className="dark:text-gray-300" />
              </div>
            )}
          </Form>
        )}
      </div>
    </div>
  );
};

export default AcademicYear;