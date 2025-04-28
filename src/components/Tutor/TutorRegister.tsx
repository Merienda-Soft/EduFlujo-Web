'use client';
import { useState, useRef } from 'react';
import { validateDocument, createTutor } from '../../utils/tutorshipService';
import { uploadTutorDocuments } from '../../utils/firebaseService';
import Swal from 'sweetalert2';

interface DocumentValidationResult {
    success: boolean;
    is_valid: boolean;
    front_score: number;
    back_score: number;
    details?: any; 
    error: string;
}

const TutorRegister = () => {
  // Estado para los datos del tutor
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
      
      const formData = new FormData();
      formData.append('front_image', frontImage);
      formData.append('back_image', backImage);
      const result = await validateDocument(frontImage, backImage);
      console.log('Validation Result:', result);
      if (result.success) {
        setValidationResult(result);

        Swal.fire({
          icon: result.is_valid ? 'success' : 'warning',
          title: result.is_valid ? 'Documento válido' : 'Documento no válido',
          text: result.is_valid 
            ? 'Puedes continuar con el registro del tutor' 
            : 'Las imágenes no parecen ser de un documento válido',
        });
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
      
      // Primero subimos las imágenes a Firebase
      const uploadResult = await uploadTutorDocuments(
        {
          name: tutorData.name,
          lastname: tutorData.lastname,
          second_lastname: tutorData.second_lastname
        },
        frontImage,
        backImage
      );
  
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Error al subir imágenes');
      }
  
      const createTutorData = {
        ...tutorData,
        url_imagefront: uploadResult.frontImageUrl || '',
        url_imageback: uploadResult.backImageUrl || ''
      };
  
      const result = await createTutor(createTutorData);
      
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Registro exitoso',
          text: 'El tutor ha sido registrado correctamente',
        });
        
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Registro de Tutor
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Complete todos los campos para registrar un nuevo tutor
          </p>
        </div>

        <div className="p-6">
          {/* Sección de Documentos */}
          <div className="mb-8">
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
          </div>

          {/* Formulario de datos del tutor */}
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                        Datos Personales del Tutor
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
                            Nombres
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={tutorData.name}
                            onChange={handleInputChange}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                        </div>
                        
                        <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
                            Apellido Paterno
                        </label>
                        <input
                            type="text"
                            name="lastname"
                            value={tutorData.lastname}
                            onChange={handleInputChange}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                        </div>
                        
                        <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
                            Apellido Materno
                        </label>
                        <input
                            type="text"
                            name="second_lastname"
                            value={tutorData.second_lastname}
                            onChange={handleInputChange}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
                            Carnet de Identidad
                        </label>
                        <input
                            type="text"
                            name="ci"
                            value={tutorData.ci}
                            onChange={handleInputChange}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                        </div>
                        
                        <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
                            Fecha de Nacimiento
                        </label>
                        <input
                            type="date"
                            name="birth_date"
                            value={tutorData.birth_date}
                            onChange={handleInputChange}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                        </div>
                        
                        <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
                            Género
                        </label>
                        <select
                            name="gender"
                            value={tutorData.gender}
                            onChange={handleInputChange}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                            <option value="O">Otro</option>
                        </select>
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
                        Correo Electrónico
                        </label>
                        <input
                        type="email"
                        name="email"
                        value={tutorData.email}
                        onChange={handleInputChange}
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
                            País
                        </label>
                        <input
                            type="text"
                            name="pais"
                            value={tutorData.pais}
                            onChange={handleInputChange}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                        </div>
                        
                        <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
                            Departamento
                        </label>
                        <input
                            type="text"
                            name="departamento"
                            value={tutorData.departamento}
                            onChange={handleInputChange}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                        </div>
                        
                        <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
                            Provincia
                        </label>
                        <input
                            type="text"
                            name="provincia"
                            value={tutorData.provincia}
                            onChange={handleInputChange}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
                        Localidad
                        </label>
                        <input
                        type="text"
                        name="localidad"
                        value={tutorData.localidad}
                        onChange={handleInputChange}
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={!validationResult?.is_valid || isSubmitting}
                className={`px-8 py-3 rounded-md text-white font-medium ${
                  (!validationResult?.is_valid || isSubmitting)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } transition`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </span>
                ) : 'Registrar Tutor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TutorRegister;