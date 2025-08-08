'use client';
import { useState } from 'react';
import AddSubjectModal from '../../components/Subject/AddSubjectModal';
import ManageSubjectsModal from '../../components/Subject/ManageSubjectsModal';
import CoursesList from '../../components/Course/CoursesList';
import { getCurrentManagementData } from '../../utils/globalState';

const CourseClient = () => {
  const [showSubjectModal, setShowSubjectModal] = useState(false); 
  const [showManageSubjectsModal, setShowManageSubjectsModal] = useState(false);
  const currentManagement = getCurrentManagementData();

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Modals */}
      <AddSubjectModal show={showSubjectModal} onClose={() => setShowSubjectModal(false)} />
      <ManageSubjectsModal show={showManageSubjectsModal} onClose={() => setShowManageSubjectsModal(false)} />

      <CoursesList key={currentManagement.id} />
    </div>
  );
};

export default CourseClient;