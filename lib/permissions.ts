export const checkPermissions = (user: any, classData: any, subjectId: string | null = null, teacherSubjects: any[] = []) => {
  if (!user) return { canEdit: false, canJustifyAbsences: false };
  
  const isAdmin = user.role === 'admin';
  const isHeadTeacher = classData?.head_teacher === user.id;
  const isDeputyHeadTeacher = classData?.deputy_head_teacher === user.id;
  
  const teachesSubject = subjectId ? teacherSubjects.some(ts => ts.subject_id === subjectId && ts.teacher_id === user.id) : false;

  return {
    canEdit: isAdmin || isHeadTeacher || isDeputyHeadTeacher,
    canJustifyAbsences: isAdmin || isHeadTeacher,
    canEnterHours: isAdmin || (isHeadTeacher || isDeputyHeadTeacher) && teachesSubject,
    isHeadTeacher,
    isDeputyHeadTeacher
  };
};
