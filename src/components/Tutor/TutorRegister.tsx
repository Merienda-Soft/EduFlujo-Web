'use client';
import { useState, useRef } from 'react';
import { validateDocument, createTutor } from '../../utils/tutorshipService';
import { uploadTutorDocuments } from '../../utils/firebaseService';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentValidationResult {
  success: boolean;
  is_valid: boolean;
  front_score: number;
  back_score: number;
  details?: any;
  error: string;
}

const TutorRegister = () => {
  const [tutorData, setTutorData] = useState({
    name: '',
    lastname: '',
    second_lastname: '',
    gender: 'M',
    ci: '',
    birth_date: '',
    email: '',
    pais: 'BOLIVIA',
    departamento: '',
    provincia: '',
    localidad: '',
    url_imagefront: '',
    url_imageback: ''
  });

  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [backPreview, setBackPreview] = useState<string>('');
  const [validationResult, setValidationResult] = useState<DocumentValidationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'validation' | 'form'>('validation');

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTutorData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.match('image.*')) {
        Swal.fire({
          icon: 'error',
          title: 'Formato inválido',
          text: 'Por favor sube una imagen válida (JPEG, PNG)',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo muy grande',
          text: 'La imagen no debe exceder los 5MB',
        });
        return;
      }

      if (type === 'front') {
        setFrontImage(file);
        setFrontPreview(URL.createObjectURL(file));
      } else {
        setBackImage(file);
        setBackPreview(URL.createObjectURL(file));
      }

      setValidationResult(null);
    }
  };

  const validateDocuments = async () => {
    if (!frontImage || !backImage) {
      Swal.fire({
        icon: 'error',
        title: 'Imágenes faltantes',
        text: 'Por favor sube ambas imágenes del documento',
      });
      return;
    }

    try {
      setIsValidating(true);
      
      const result = await validateDocument(frontImage, backImage);
      
      if (result.success) {
        setValidationResult(result);
        
        if (result.is_valid) {
          setCurrentStep('form');
        }

      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: result.error || 'Error al validar el documento',
        });
      }
    } catch (error) {
      console.error('Error al validar documento:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al validar el documento',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validationResult || !validationResult.is_valid) {
      Swal.fire({
        icon: 'error',
        title: 'Documento no validado',
        text: 'Por favor valida primero tus documentos de identidad',
      });
      return;
    }

    if (!frontImage || !backImage) {
      Swal.fire({
        icon: 'error',
        title: 'Imágenes faltantes',
        text: 'No se encontraron las imágenes para subir',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const uploadResult = await uploadTutorDocuments(
        {
          name: tutorData.name,
          lastname: tutorData.lastname,
          second_lastname: tutorData.second_lastname,
          birthdate: tutorData.birth_date
        },
        frontImage,
        backImage
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Error al subir imágenes');
      }

      const result = await createTutor({
        ...tutorData,
        url_imagefront: uploadResult.frontImageUrl || '',
        url_imageback: uploadResult.backImageUrl || ''
      });
      
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Registro exitoso',
          text: `Se envio un correo de confirmación al correo proporcionado ${tutorData.email}, recuerda verificar tu bandeja de entrada para activar tu cuenta.`,
        });
        
        // Resetear formulario
        setTutorData({
          name: '',
          lastname: '',
          second_lastname: '',
          gender: 'M',
          ci: '',
          birth_date: '',
          email: '',
          pais: 'BOLIVIA',
          departamento: '',
          provincia: '',
          localidad: '',
          url_imagefront: '',
          url_imageback: ''
        });
        setFrontImage(null);
        setBackImage(null);
        setFrontPreview('');
        setBackPreview('');
        setValidationResult(null);
        setCurrentStep('validation');
        if (frontInputRef.current) frontInputRef.current.value = '';
        if (backInputRef.current) backInputRef.current.value = '';
      } else {
        throw new Error(result.error || 'Error al registrar el tutor');
      }
    } catch (error) {
      console.error('Error al registrar tutor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Ocurrió un error al registrar el tutor',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBackToValidation = () => {
    setCurrentStep('validation');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Registro de Tutor
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {currentStep === 'validation' 
              ? 'Valida primero tus documentos de identidad' 
              : 'Completa tus datos personales'}
          </p>
        </div>

        <div className="p-6">
          {/* Sección de Validación */}
          <AnimatePresence>
            {currentStep === 'validation' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Validación de Documento de Identidad
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Anverso del Documento
                    </label>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                      {frontPreview ? (
                        <>
                          <img 
                            src={frontPreview} 
                            alt="Anverso del documento" 
                            className="max-h-64 object-contain mb-4"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFrontImage(null);
                              setFrontPreview('');
                              if (frontInputRef.current) frontInputRef.current.value = '';
                            }}
                            className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Cambiar imagen
                          </button>
                        </>
                      ) : (
                        <>
                          <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Sube una imagen del anverso
                          </p>
                          <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 px-4 py-2 rounded-md text-sm font-medium transition">
                            Seleccionar archivo
                            <input
                              type="file"
                              ref={frontInputRef}
                              onChange={(e) => handleImageChange(e, 'front')}
                              className="hidden"
                              accept="image/*"
                            />
                          </label>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reverso del Documento
                    </label>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                      {backPreview ? (
                        <>
                          <img 
                            src={backPreview} 
                            alt="Reverso del documento" 
                            className="max-h-64 object-contain mb-4"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setBackImage(null);
                              setBackPreview('');
                              if (backInputRef.current) backInputRef.current.value = '';
                            }}
                            className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Cambiar imagen
                          </button>
                        </>
                      ) : (
                        <>
                          <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Sube una imagen del reverso
                          </p>
                          <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 px-4 py-2 rounded-md text-sm font-medium transition">
                            Seleccionar archivo
                            <input
                              type="file"
                              ref={backInputRef}
                              onChange={(e) => handleImageChange(e, 'back')}
                              className="hidden"
                              accept="image/*"
                            />
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={validateDocuments}
                    disabled={!frontImage || !backImage || isValidating}
                    className={`px-6 py-2 rounded-md text-white font-medium ${
                      (!frontImage || !backImage || isValidating) 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } transition`}
                  >
                    {isValidating ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Validando...
                      </span>
                    ) : 'Validar Documento'}
                  </button>
                  {validationResult && (
                      <div className={`p-3 rounded-lg flex items-center ${
                          validationResult.is_valid 
                              ? 'text-green-800 dark:text-green-200' 
                              : 'text-red-800 dark:text-red-200'
                      }`}>
                          <svg className={`w-5 h-5 mr-2 ${
                              validationResult.is_valid ? 'text-green-500 dark:text-green-400' : 'text-yellow-500 dark:text-yellow-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={validationResult.is_valid ? "M5 13l4 4L19 7" : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"}></path>
                          </svg>
                          <div>
                              <p className="font-medium">
                                  {validationResult.is_valid ? 'Documento válido' : 'Documento no válido'}
                              </p>
                          </div>
                      </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sección del Formulario */}
          <AnimatePresence>
            {currentStep === 'form' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleSubmit}>
                  {/* Botón para volver atrás */}
                  <button
                    type="button"
                    onClick={goBackToValidation}
                    className="mb-6 flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver a validación de documentos
                  </button>

                  {/* Vista previa de documentos validados */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                      Documentos Validados
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Anverso</p>
                        {frontPreview && (
                          <img 
                            src={frontPreview} 
                            alt="Anverso validado" 
                            className="max-h-40 object-contain border border-gray-200 dark:border-gray-600 rounded-lg"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Reverso</p>
                        {backPreview && (
                          <img 
                            src={backPreview} 
                            alt="Reverso validado" 
                            className="max-h-40 object-contain border border-gray-200 dark:border-gray-600 rounded-lg"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Formulario de datos personales */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 pb-2">
                      Datos del Tutor
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Sección Nombre Completo */}
                      <h3>Datos Personales:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <input
                            type="text"
                            name="name"
                            value={tutorData.name}
                            onChange={handleInputChange}
                            placeholder="Nombres"
                            required
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                                      hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                                      transition duration-200 placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                        
                        <div>
                          <input
                            type="text"
                            name="lastname"
                            value={tutorData.lastname}
                            onChange={handleInputChange}
                            placeholder="Apellido Paterno"
                            required
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                                      hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                                      transition duration-200 placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                        
                        <div>
                          <input
                            type="text"
                            name="second_lastname"
                            value={tutorData.second_lastname}
                            onChange={handleInputChange}
                            placeholder="Apellido Materno"
                            required
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                                      hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                                      transition duration-200 placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                      </div>
                      
                      {/* Sección Documentos */}
                      <h3>Datos de Identidad:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <input
                            type="text"
                            name="ci"
                            value={tutorData.ci}
                            onChange={handleInputChange}
                            placeholder="Carnet de Identidad"
                            required
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                                      hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                                      transition duration-200 placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                        
                        <div>
                          <input
                            type="date"
                            name="birth_date"
                            value={tutorData.birth_date}
                            onChange={handleInputChange}
                            required
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                                      hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                                      transition duration-200 text-gray-700 dark:text-gray-300"
                          />
                        </div>
                        
                        <div>
                          <select
                            name="gender"
                            value={tutorData.gender}
                            onChange={handleInputChange}
                            required
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                                      hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                                      transition duration-200 text-gray-700 dark:text-gray-300"
                          >
                            <option value="" disabled hidden>Seleccione género</option>
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                            <option value="O">Otro</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Ubicación */}
                      <h3>Ubicación y Contacto:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <input
                            type="text"
                            name="pais"
                            value={tutorData.pais}
                            onChange={handleInputChange}
                            placeholder="País"
                            required
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                                      hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                                      transition duration-200 placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                        
                        <div>
                          <input
                            type="text"
                            name="departamento"
                            value={tutorData.departamento}
                            onChange={handleInputChange}
                            placeholder="Departamento"
                            required
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                                      hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                                      transition duration-200 placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                        
                        <div>
                          <input
                            type="text"
                            name="provincia"
                            value={tutorData.provincia}
                            onChange={handleInputChange}
                            placeholder="Provincia"
                            required
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                                      hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                                      transition duration-200 placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                      </div>
                      
                      {/* Adicional */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <input
                            type="text"
                            name="localidad"
                            value={tutorData.localidad}
                            onChange={handleInputChange}
                            placeholder="Localidad"
                            required
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                                      hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                                      transition duration-200 placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <input
                            type="email"
                            name="email"
                            value={tutorData.email}
                            onChange={handleInputChange}
                            placeholder="Correo Electrónico"
                            required
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                                      hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                                      transition duration-200 placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-6 py-2 rounded-md text-white font-medium ${
                        isSubmitting
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      } transition`}
                    >
                      {isSubmitting ? 'Registrando...' : 'Registrar Tutor'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TutorRegister;