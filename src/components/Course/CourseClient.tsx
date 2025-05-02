'use client';
import { useState, useEffect } from 'react';
import AddSubjectModal from '../../components/Subject/AddSubjectModal';
import ManageSubjectsModal from '../../components/Subject/ManageSubjectsModal';
import CoursesList from '../../components/Course/CoursesList';
import { managementGlobal } from '../../utils/globalState';

const CourseClient = () => {
  const [showSubjectModal, setShowSubjectModal] = useState(false); 
  const [showManageSubjectsModal, setShowManageSubjectsModal] = useState(false); 
  const currentYear = new Date().getFullYear();
  const isCurrentYear = currentYear === managementGlobal.year; 

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl">Cursos y Materias</h1>
        <div className="space-x-4">
        </div>
      </div>

      {/* Modales */}
      <AddSubjectModal show={showSubjectModal} onClose={() => setShowSubjectModal(false)} />
      <ManageSubjectsModal show={showManageSubjectsModal} onClose={() => setShowManageSubjectsModal(false)} />

      {/* Lista de cursos */}
      <CoursesList />
    </div>
  );
};

export default CourseClient;