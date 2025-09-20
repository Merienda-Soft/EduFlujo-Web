'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getYearManagements, cloneManagement } from '../../utils/managementService';
import { DatePicker, Spin, message, Button, Card, Form, Row, Col, Typography, Input, Steps, Progress, Result } from 'antd';
import dayjs from 'dayjs';
import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Step } = Steps;

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
  const [currentStep, setCurrentStep] = useState(0);
  const [sourceManagement, setSourceManagement] = useState<Management | null>(null);
  const [managements, setManagements] = useState<Management[]>([]);
  const [results, setResults] = useState<CloneResults | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    fetchManagements();
  }, []);

  const fetchManagements = async () => {
    try {
      setLoading(true);
      const data = await getYearManagements();
      setManagements(data);

      if (!data || data.length === 0) {
        message.warning('No se encontraron gestiones académicas.');
        setSourceManagement(null);
        return;
      }

      const mostRecent = data.slice().sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];

      if (mostRecent.status === 0) {
        setSourceManagement(mostRecent);
        prefillFormDates(mostRecent);
      } else {
        setSourceManagement(null);
        message.warning('No se encontraron gestiones académicas listas.');
      }
    } catch (error) {
      console.error('Error al obtener gestiones:', error);
      message.error('Error al cargar las gestiones académicas');
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
        throw new Error('No se ha seleccionado una gestión académica de origen');
      }

      setLoading(true);
      setShowProgress(true);
      setCurrentStep(0);
      
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

      // Simular pasos del proceso
      const steps = [
        { title: 'Validando datos', duration: 800 },
        { title: 'Creando estructura de gestión', duration: 1000 },
        { title: 'Clonando cursos', duration: 1200 },
        { title: 'Asignando materias', duration: 1500 },
        { title: 'Configurando paralelos', duration: 1800 },
        { title: 'Finalizando proceso', duration: 800 }
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      }

      // Llamada real a la API
      const response = await cloneManagement({
        sourceManagementId: sourceManagement.id,
        newManagementYear: values.newManagementYear,
        quarterDates
      });

      setResults(response);
      message.success('¡Gestión académica clonada con éxito!');
    } catch (error: any) {
      console.error('Error en handleSubmit:', error);
      message.error(`Error: ${error.message || 'No se pudo clonar la gestión académica'}`);
    } finally {
      setLoading(false);
      setShowProgress(false);
    }
  };

  if (loading && !sourceManagement) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Cargando gestiones académicas...</p>
        </div>
      </div>
    );
  }

  if (!sourceManagement) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border-0">
          <div className="text-start">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              No puedes crear una nueva gestión académica
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
              La gestión académica más reciente aún se encuentra activa. 
              <br />
              Para iniciar una nueva gestión con los datos correctos, primero debes cerrar la gestión actual.
              <br />
              <br />
              Una vez que la gestión anterior esté cerrada, podrás crear una nueva sin problemas.
              
            </p>
            <Button 
              type="primary" 
              onClick={fetchManagements}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition duration-300"
              size="large"
            >
              Intentar nuevamente
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Empezar un nuevo año académico
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Crea una nueva gestión académica basada en la gestión: {sourceManagement.management} y configura los trimestres y fechas importantes. NOTA: se creará una nueva gestión copiando la estructura de la gestión anterior.
        </p>
      </div>

      {showProgress ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="max-w-2xl mx-auto text-gray-800 dark:text-gray-300">
            <Steps 
              current={currentStep} 
              direction="vertical" 
              className="mb-8 text-gray-800 dark:text-gray-300"
            >
              <Step title={<span className="dark:text-white">Validando datos</span>} />
              <Step title={<span className="dark:text-white">Creando estructura</span>} />
              <Step title={<span className="dark:text-white">Clonando cursos</span>} />
              <Step title={<span className="dark:text-white">Asignando materias</span>} />
              <Step title={<span className="dark:text-white">Configurando paralelos</span>} />
              <Step title={<span className="dark:text-white">Finalizando proceso</span>} />
            </Steps>

            <Progress
              percent={Math.round(((currentStep + 1) / 6) * 100)}
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              className="mb-8"
            />

            <div className="text-center">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Procesando: {currentStep + 1} de 6...
              </p>
            </div>
          </div>
        </div>
      ) : results ? (
        (() => {
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
          return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-8">
                <Result
                  title={<span className="dark:text-white">¡Gestión académica creada exitosamente!</span>}
                  subTitle={<span className="dark:text-gray-300">La nueva gestión académica {results.new_management_year} ha sido configurada con todos los elementos necesarios.</span>}
                  icon={<CheckCircleFilled style={{ color: '#52c41a', fontSize: '72px' }} />}
                  extra={[]}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                  <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300">
                    <div className="flex items-center">
                      <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                        <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Cursos creados</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{results.results.new_courses}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300">
                    <div className="flex items-center">
                      <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full mr-4">
                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Materias asignadas</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{results.results.new_curricula}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-purple-100 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300">
                    <div className="flex items-center">
                      <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full mr-4">
                        <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Docentes asignados</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{results.results.new_assignments}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="border-0 shadow-sm bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300">
                    <div className="flex items-center">
                      <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full mr-4">
                        <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Estudiantes matriculados</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{results.results.new_registrations}</p>
                      </div>
                    </div>
                  </Card>

                  <div className="flex justify-center mt-8 col-span-full">
                    <Button
                      type="primary"
                      key="home"
                      onClick={() => {
                        window.location.href = '/';
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="large"
                    >
                      Ir a Inicio
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-0 p-8">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              newManagementYear: sourceManagement.management + 1
            }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Configuración de la nueva gestión
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
                  className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  min={sourceManagement.management + 1}
                  size="large"
                />
              </Form.Item>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Fechas de la gestión académica
              </h2>
              
              <Row gutter={24} className="mb-6">
                <Col span={12}>
                  <Form.Item
                    label={<span className="text-gray-700 dark:text-gray-300">Fecha de inicio</span>}
                    name={['quarterDates', 'start_date']}
                    rules={[{ required: true, message: 'Este campo es requerido' }]}
                  >
                    <DatePicker 
                      className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      disabledDate={(current) => {
                        const year = form.getFieldValue('newManagementYear');
                        return current && current.year() !== year;
                      }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={<span className="text-gray-700 dark:text-gray-300">Fecha de finalización</span>}
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
                      className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      disabledDate={(current) => {
                        const year = form.getFieldValue('newManagementYear');
                        return current && current.year() !== year;
                      }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Trimestres
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Primer Trimestre */}
                <Card className="border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800">
                  <div className="space-y-4">
                    <h4 className="font-bold text-lg text-gray-800 dark:text-white">Primer Trimestre</h4>
                    <Form.Item
                      label={<span className="text-gray-600 dark:text-gray-300">Fecha de Inicio</span>}
                      name={['quarterDates', 'first_quarter_start']}
                      rules={[{ 
                        required: true, 
                        message: 'Este campo es requerido',
                        validator: (_, value) => {
                          const startDate = form.getFieldValue(['quarterDates', 'start_date']);
                          if (value && startDate && value.isBefore(startDate)) {
                            return Promise.reject('Debe ser posterior al inicio de la gestión');
                          }
                          return Promise.resolve();
                        }
                      }]}
                    >
                      <DatePicker 
                        className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        disabledDate={(current) => {
                          const year = form.getFieldValue('newManagementYear');
                          return current && current.year() !== year;
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      label={<span className="text-gray-600 dark:text-gray-300">Fecha de Finalización</span>}
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
                        className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        disabledDate={(current) => {
                          const year = form.getFieldValue('newManagementYear');
                          return current && current.year() !== year;
                        }}
                      />
                    </Form.Item>
                  </div>
                </Card>

                {/* Segundo Trimestre */}
                <Card className="border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800">
                  <div className="space-y-4">
                    <h4 className="font-bold text-lg text-gray-800 dark:text-white">Segundo Trimestre</h4>
                    <Form.Item
                      label={<span className="text-gray-600 dark:text-gray-300">Fecha de Inicio</span>}
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
                        className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        disabledDate={(current) => {
                          const year = form.getFieldValue('newManagementYear');
                          return current && current.year() !== year;
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      label={<span className="text-gray-600 dark:text-gray-300">Fecha de Finalización</span>}
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
                        className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        disabledDate={(current) => {
                          const year = form.getFieldValue('newManagementYear');
                          return current && current.year() !== year;
                        }}
                      />
                    </Form.Item>
                  </div>
                </Card>

                {/* Tercer Trimestre */}
                <Card className="border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800">
                  <div className="space-y-4">
                    <h4 className="font-bold text-lg text-gray-800 dark:text-white">Tercer Trimestre</h4>
                    <Form.Item
                      label={<span className="text-gray-600 dark:text-gray-300">Fecha de Inicio</span>}
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
                        className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        disabledDate={(current) => {
                          const year = form.getFieldValue('newManagementYear');
                          return current && current.year() !== year;
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      label={<span className="text-gray-600 dark:text-gray-300">Fecha de finalización</span>}
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
                            return Promise.reject('No puede ser posterior al fin de la gestión');
                          }
                          return Promise.resolve();
                        }
                      }]}
                    >
                      <DatePicker 
                        className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        disabledDate={(current) => {
                          const year = form.getFieldValue('newManagementYear');
                          return current && current.year() !== year;
                        }}
                      />
                    </Form.Item>
                  </div>
                </Card>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg transition duration-300 text-lg"
                size="large"
              >
                Crear gestión académica
              </Button>
            </div>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default AcademicYear;