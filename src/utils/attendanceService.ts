import { httpRequestFactory } from './HttpRequestFactory';
import { getCurrentUserId } from './globalState';

interface Student {
  student_id: number;
  name: string;
  lastname: string;
  second_lastname?: string;
}

interface AttendanceRecord {
  id: number;
  student_id: number;
  status: string;
}

interface AttendanceData {
  id?: number;
  attendance_date: string;
  quarter: string;
  management_id: number;
  subject_id: number;
  professor_id: number;
  course_id: number;
  records?: AttendanceRecord[];
}

interface UpdateAttendanceData {
  attendance_id: number;
  students: {
    student_id: number;
    status_attendance: string;
  }[];
}

export const getStudentsByCourse = async (courseId: string) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(`/students/course/${courseId}`);
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al obtener los estudiantes del curso');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const registerAttendance = async (attendanceData: AttendanceData, recordsData: { student_id: number; status_attendance: string }[]) => {
    try {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            throw new Error('Usuario no autenticado');
        }
        
        const { url, config } = httpRequestFactory.createRequest(
            '/attendance/register',
            'POST',
            {
                attendance: {
                    ...attendanceData,
                    created_by: currentUserId
                },
                records: recordsData
            }
        );
        console.log(url, config);
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al registrar la asistencia');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getAttendanceByCourseSubjectDate = async (courseId: Number, subjectId: Number, date: string) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(
            `/attendance/course/${courseId}/subject/${subjectId}/date/${date}`
        );
        console.log(url, config);
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al obtener la asistencia');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const updateAttendanceRecord = async (updateData: UpdateAttendanceData) => {
    try {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            throw new Error('Usuario no autenticado');
        }
        
        const { url, config } = httpRequestFactory.createRequest(
            '/attendance/attendance/batch-update',
            'PUT',
            {
                ...updateData,
                updated_by: currentUserId
            }
        );
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al actualizar la asistencia');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}; 