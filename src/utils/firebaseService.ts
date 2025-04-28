import { storage } from './firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

interface UploadResult {
  success: boolean;
  frontImageUrl?: string;
  backImageUrl?: string;
  error?: string;
}

interface ImageFile extends Blob {
  readonly name: string;
  readonly type: string;
}

const compressImage = async (imageFile: ImageFile): Promise<ImageFile> => {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/jpeg'
  };

  try {
    return await imageCompression(imageFile as File, options);
  } catch (error) {
    console.error('Error al comprimir imagen:', error);
    throw new Error('No se pudo comprimir la imagen');
  }
};

const validateImage = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
};

export const uploadTutorDocuments = async (
  tutorData: {
    name: string;
    lastname: string;
    second_lastname: string;
  },
  frontImage: File,
  backImage: File
): Promise<UploadResult> => {
  try {
    if (!validateImage(frontImage) || !validateImage(backImage)) {
      throw new Error('Solo se permiten imágenes JPEG, PNG o WEBP');
    }

    const [compressedFront, compressedBack] = await Promise.all([
      compressImage(frontImage),
      compressImage(backImage)
    ]);

    const folderName = `${tutorData.name}_${tutorData.lastname}_${tutorData.second_lastname}`
      .toLowerCase()
      .replace(/\s+/g, '_')
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Crear referencias en Storage
    const frontImageRef = ref(storage, `tutor/${folderName}/anverso.jpg`);
    const backImageRef = ref(storage, `tutor/${folderName}/reverso.jpg`);

    // Subir imágenes comprimidas
    const [frontSnapshot, backSnapshot] = await Promise.all([
      uploadBytes(frontImageRef, compressedFront),
      uploadBytes(backImageRef, compressedBack)
    ]);

    // Obtener URLs
    const [frontUrl, backUrl] = await Promise.all([
      getDownloadURL(frontSnapshot.ref),
      getDownloadURL(backSnapshot.ref)
    ]);

    return {
      success: true,
      frontImageUrl: frontUrl,
      backImageUrl: backUrl
    };
  } catch (error) {
    console.error('Error en uploadTutorDocuments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al subir documentos'
    };
  }
};