'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { db, auth, handleFirestoreError } from '@/lib/firebase';
import { collection, query, getDocs, getDoc, doc, addDoc, deleteDoc, updateDoc, orderBy, where, writeBatch, setDoc } from 'firebase/firestore';
import { ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react';
import { useSearchParams, useParams } from 'next/navigation';
import { onAuthStateChanged, createUserWithEmailAndPassword, signOut, getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import firebaseConfig from '@/firebase-applet-config.json';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function AdministracijaContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const schoolId = params.id as string;
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const tab = searchParams.get('tab');
      if (tab) {
        setActiveTab(tab);
      }
    };
    init();
  }, [searchParams]);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [newFullName, setNewFullName] = useState('');

  // New student form state
  const [newStudentProgram, setNewStudentProgram] = useState('');
  const [newStudentClassId, setNewStudentClassId] = useState('');
  const [newStudentParentEmail, setNewStudentParentEmail] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // New class form state
  const [newClassName, setNewClassName] = useState('');
  const [newClassProgram, setNewClassProgram] = useState('');
  const [newClassHeadTeacher, setNewClassHeadTeacher] = useState('');
  const [newClassDeputyHeadTeacher, setNewClassDeputyHeadTeacher] = useState('');
  const [newClassYear, setNewClassYear] = useState('1. razred srednje škole');

  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<any[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectTeacherId, setNewSubjectTeacherId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Schools and Academic Years
  const [schools, setSchools] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newAcademicYearName, setNewAcademicYearName] = useState('');
  const [selectedClassIdForSubjects, setSelectedClassIdForSubjects] = useState('');
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [editingClass, setEditingClass] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            setUser({ id: userDoc.id, ...userDoc.data() });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${authUser.uid}`);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName) return;
    
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'subjects'), {
        name: newSubjectName,
        school_id: schoolId
      });
      const newSubject = { id: docRef.id, name: newSubjectName };
      setSubjects([...subjects, newSubject]);
      setNewSubjectName('');
      alert('Predmet uspješno dodan.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'subjects');
    }
    setLoading(false);
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovaj predmet?')) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'subjects', id));
      setSubjects(subjects.filter(s => s.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `subjects/${id}`);
    }
    setLoading(false);
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !newSubjectTeacherId) return;
    
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'subject_teachers'), {
        subject_id: selectedSubjectId,
        teacher_id: newSubjectTeacherId,
        school_id: schoolId
      });
      const newAssignment = { 
        id: docRef.id, 
        subject_id: selectedSubjectId, 
        teacher_id: newSubjectTeacherId 
      };
      setSubjectTeachers([...subjectTeachers, newAssignment]);
      setNewSubjectTeacherId('');
      setSelectedSubjectId('');
      alert('Nastavnik uspješno dodijeljen predmetu.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'subject_teachers');
    }
    setLoading(false);
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovu dodjelu?')) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'subject_teachers', id));
      setSubjectTeachers(subjectTeachers.filter(a => a.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `subject_teachers/${id}`);
    }
    setLoading(false);
  };

  const adminLinks = [
    'Škole',
    'Školske godine',
    'Korisnici',
    'Administracija predmeta',
    'Dodijeli nastavnicima predmete',
    'Razredni odjeli i grupe',
    'Dodijeli predmete razredu',
    'Administracija učenika',
    'Prijenos učenika u viši razred',
  ];

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('role'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setUsers(data);
      
      const names: Record<string, string> = {};
      data.forEach((u: any) => {
        if (u.full_name) names[u.id] = u.full_name;
      });
      setUserNames(names);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
    setLoading(false);
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'students'), where('school_id', '==', schoolId), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      // Fetch classes to get their names
      const classesSnapshot = await getDocs(query(collection(db, 'classes'), where('school_id', '==', schoolId)));
      const classesMap = new Map(classesSnapshot.docs.map(doc => [doc.id, doc.data().name]));

      const data = querySnapshot.docs.map(doc => {
        const studentData = doc.data();
        return { 
          id: doc.id, 
          ...studentData,
          classes: { name: classesMap.get(studentData.class_id) || '-' }
        };
      });
      setStudents(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'students');
    }
    setLoading(false);
  }, [schoolId]);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'classes'), where('school_id', '==', schoolId), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'classes');
    }
    setLoading(false);
  }, [schoolId]);

  useEffect(() => {
    const init = async () => {
      if (activeTab === 'Korisnici') {
        fetchUsers();
      } else if (activeTab === 'Administracija učenika') {
        fetchStudents();
        fetchClasses();
        fetchUsers();
      } else if (activeTab === 'Razredni odjeli i grupe' || activeTab === 'Prijenos učenika u viši razred' || activeTab === 'Dodijeli predmete razredu' || activeTab === 'Dodijeli nastavnicima predmete') {
        fetchClasses();
        fetchUsers();
      }
    };
    init();
  }, [activeTab, schoolId, fetchUsers, fetchStudents, fetchClasses]); // Added dependencies

  const hashPassword = async (password: string) => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    
    setLoading(true);
    try {
      // Check if user already exists in our local state/Firestore first to avoid unnecessary Auth calls
      const existingUser = users.find(u => u.email.toLowerCase() === newEmail.toLowerCase());
      if (existingUser) {
        alert('Korisnik s ovom e-mail adresom već postoji u sustavu.');
        setLoading(false);
        return;
      }

      // Use a secondary Firebase app instance to create the user
      // This prevents the primary app from signing out the admin
      const secondaryApp = getApps().find(app => app.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      
      // Sign out the new user from the secondary app immediately
      await signOut(secondaryAuth);
      
      // Add metadata to Firestore using the primary app (where admin is still logged in)
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: newEmail,
        role: newRole,
        full_name: newFullName,
        createdAt: new Date().toISOString()
      });

      const newUser = { id: userCredential.user.uid, email: newEmail, role: newRole, full_name: newFullName };
      setUsers([...users, newUser]);
      
        // Save full name to Firestore if needed later
        const updatedNames = { ...userNames, [userCredential.user.uid]: newFullName };
        setUserNames(updatedNames);

      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      alert('Korisnik uspješno stvoren.');
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.code === 'auth/email-already-in-use') {
        alert('Ova e-mail adresa je već u upotrebi. Korisnik vjerojatno već ima račun.');
      } else {
        alert('Greška pri stvaranju korisnika: ' + error.message);
      }
    }
    setLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovog korisnika?')) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'users', id));
      setUsers(users.filter(u => u.id !== id));
      alert('Korisnik uspješno obrisan.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
      alert('Greška pri brisanju korisnika.');
    }
    setLoading(false);
  };

  const [editingUser, setEditingUser] = useState<any>(null);

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setNewEmail(user.email);
    setNewRole(user.role);
    setNewFullName(userNames[user.id] || '');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        email: newEmail,
        role: newRole,
        full_name: newFullName
      });
      
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, email: newEmail, role: newRole, full_name: newFullName } : u));
      setUserNames(prev => ({ ...prev, [editingUser.id]: newFullName }));
      
      setEditingUser(null);
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      alert('Korisnik uspješno ažuriran.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${editingUser.id}`);
      alert('Greška pri ažuriranju korisnika.');
    }
    setLoading(false);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0 || !newStudentClassId) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const newStudentsData: any[] = [];

      for (const userId of selectedUserIds) {
        const userObj = users.find(u => u.id === userId);
        if (!userObj) continue;

        const studentData = { 
          name: userObj.full_name || userObj.email, 
          program: newStudentProgram, 
          class_id: newStudentClassId,
          parent_email: newStudentParentEmail,
          user_id: userId,
          school_id: schoolId
        };
        
        const docRef = doc(collection(db, 'students'));
        batch.set(docRef, studentData);
        newStudentsData.push({ id: docRef.id, ...studentData });
      }

      await batch.commit();

      // Fetch class name for UI
      const classDoc = await getDoc(doc(db, 'classes', newStudentClassId));
      const className = classDoc.exists() ? classDoc.data().name : '-';

      const studentsWithClassName = newStudentsData.map(s => ({
        ...s,
        classes: { name: className }
      }));

      setStudents([...students, ...studentsWithClassName]);
      setSelectedUserIds([]);
      setNewStudentProgram('');
      setNewStudentParentEmail('');
      alert('Učenici uspješno dodani.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'students');
      alert('Greška pri dodavanju učenika.');
    }
    setLoading(false);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovog učenika?')) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'students', id));
      setStudents(students.filter(s => s.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `students/${id}`);
      alert('Greška pri brisanju učenika.');
    }
    setLoading(false);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;
    
    setLoading(true);
    try {
      const classData = { 
        name: newClassName, 
        program: newClassProgram, 
        head_teacher: newClassHeadTeacher,
        deputy_head_teacher: newClassDeputyHeadTeacher,
        year: newClassYear,
        school_id: schoolId 
      };
      const docRef = await addDoc(collection(db, 'classes'), classData);

      setClasses([...classes, { id: docRef.id, ...classData }]);
      setNewClassName('');
      setNewClassProgram('');
      setNewClassHeadTeacher('');
      setNewClassDeputyHeadTeacher('');
      setNewClassYear('1. razred srednje škole');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'classes');
      alert('Greška pri dodavanju razreda.');
    }
    setLoading(false);
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !newClassName) return;
    
    setLoading(true);
    try {
      const classData = { 
        name: newClassName, 
        program: newClassProgram, 
        head_teacher: newClassHeadTeacher,
        deputy_head_teacher: newClassDeputyHeadTeacher,
        year: newClassYear
      };
      await updateDoc(doc(db, 'classes', editingClass.id), classData);

      setClasses(classes.map(c => c.id === editingClass.id ? { ...c, ...classData } : c));
      setEditingClass(null);
      setNewClassName('');
      setNewClassProgram('');
      setNewClassHeadTeacher('');
      setNewClassDeputyHeadTeacher('');
      setNewClassYear('1. razred srednje škole');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classes/${editingClass.id}`);
      alert('Greška pri ažuriranju razreda.');
    }
    setLoading(false);
  };

  const handleEditClass = (c: any) => {
    setEditingClass(c);
    setNewClassName(c.name);
    setNewClassProgram(c.program || '');
    setNewClassHeadTeacher(c.head_teacher || '');
    setNewClassDeputyHeadTeacher(c.deputy_head_teacher || '');
    setNewClassYear(c.year || '1. razred srednje škole');
  };

  const handleDeleteClass = async (id: string) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovaj razred?')) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'classes', id));
      setClasses(classes.filter(c => c.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `classes/${id}`);
      alert('Greška pri brisanju razreda.');
    }
    setLoading(false);
  };

  // Transfer students state
  const [transferSourceClassId, setTransferSourceClassId] = useState('');
  const [transferTargetClassId, setTransferTargetClassId] = useState('');
  const [transferStudents, setTransferStudents] = useState<any[]>([]);
  const [selectedTransferStudents, setSelectedTransferStudents] = useState<string[]>([]);

  const fetchTransferStudents = async (classId: string) => {
    if (!classId) {
      setTransferStudents([]);
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, 'students'), where('class_id', '==', classId), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransferStudents(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'students');
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      await fetchTransferStudents(transferSourceClassId);
    };
    init();
  }, [transferSourceClassId]);

  const handleTransferStudents = async () => {
    if (!transferTargetClassId || selectedTransferStudents.length === 0) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      selectedTransferStudents.forEach(studentId => {
        const studentRef = doc(db, 'students', studentId);
        batch.update(studentRef, { class_id: transferTargetClassId });
      });
      await batch.commit();

      alert('Učenici su uspješno prebačeni.');
      setTransferSourceClassId('');
      setTransferTargetClassId('');
      setSelectedTransferStudents([]);
      setTransferStudents([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'students');
      alert('Greška pri prebacivanju učenika.');
    }
    setLoading(false);
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName) return;
    
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'schools'), {
        name: newSchoolName,
        type: 'Srednja škola'
      });
      const newSchool = { id: docRef.id, name: newSchoolName, type: 'Srednja škola' };
      setSchools([...schools, newSchool]);
      setNewSchoolName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'schools');
    }
    setLoading(false);
  };

  const handleAddAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcademicYearName) return;
    
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'academic_years'), {
        name: newAcademicYearName,
        school_id: schoolId
      });
      const newYear = { id: docRef.id, name: newAcademicYearName };
      setAcademicYears([...academicYears, newYear]);
      setNewAcademicYearName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'academic_years');
    }
    setLoading(false);
  };

  const handleAssignSubjectToClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassIdForSubjects || !selectedSubjectId || !newSubjectTeacherId) return;
    
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'class_subjects'), {
        class_id: selectedClassIdForSubjects,
        subject_id: selectedSubjectId,
        teacher_id: newSubjectTeacherId,
        school_id: schoolId
      });
      const newAssignment = {
        id: docRef.id,
        class_id: selectedClassIdForSubjects,
        subject_id: selectedSubjectId,
        teacher_id: newSubjectTeacherId
      };
      setClassSubjects([...classSubjects, newAssignment]);
      alert('Predmet i nastavnik uspješno dodijeljeni razredu.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'class_subjects');
    }
    setLoading(false);
  };

  if (activeTab === 'Škole') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveTab(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl text-gray-800">Upravljanje školama</h2>
        </div>
        <div className="bg-white p-6 border border-gray-200 shadow-sm mb-8">
          <h3 className="text-lg font-bold mb-4">Dodaj novu školu</h3>
          <form onSubmit={handleAddSchool} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Naziv škole</label>
              <input type="text" value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)} className="w-full border border-gray-300 p-2" required />
            </div>
            <button type="submit" className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-6 py-2 flex items-center gap-2"><Plus size={18} /> Dodaj</button>
          </form>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm">
          {schools.map(s => (
            <div key={s.id} className="p-4 border-b border-gray-100 flex justify-between items-center">
              <span className="font-medium">{s.name}</span>
              <button onClick={() => {
                const updated = schools.filter(x => x.id !== s.id);
                setSchools(updated);
                localStorage.setItem('demo_schools', JSON.stringify(updated));
              }} className="text-red-500"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'Školske godine') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveTab(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl text-gray-800">Školske godine</h2>
        </div>
        <div className="bg-white p-6 border border-gray-200 shadow-sm mb-8">
          <h3 className="text-lg font-bold mb-4">Dodaj školsku godinu</h3>
          <form onSubmit={handleAddAcademicYear} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Naziv (npr. 2023/2024)</label>
              <input type="text" value={newAcademicYearName} onChange={(e) => setNewAcademicYearName(e.target.value)} className="w-full border border-gray-300 p-2" required />
            </div>
            <button type="submit" className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-6 py-2 flex items-center gap-2"><Plus size={18} /> Dodaj</button>
          </form>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm">
          {academicYears.map(y => (
            <div key={y.id} className="p-4 border-b border-gray-100 flex justify-between items-center">
              <span className="font-medium">{y.name}</span>
              <button onClick={() => {
                const updated = academicYears.filter(x => x.id !== y.id);
                setAcademicYears(updated);
              }} className="text-red-500"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'Dodijeli predmete razredu') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveTab(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl text-gray-800">Dodijeli predmete razredu</h2>
        </div>
        <div className="bg-white p-6 border border-gray-200 shadow-sm mb-8">
          <form onSubmit={handleAssignSubjectToClass} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Razred</label>
              <select value={selectedClassIdForSubjects} onChange={(e) => setSelectedClassIdForSubjects(e.target.value)} className="w-full border border-gray-300 p-2 bg-white" required>
                <option value="">-- Odaberi razred --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Predmet</label>
              <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="w-full border border-gray-300 p-2 bg-white" required>
                <option value="">-- Odaberi predmet --</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nastavnik</label>
              <select value={newSubjectTeacherId} onChange={(e) => setNewSubjectTeacherId(e.target.value)} className="w-full border border-gray-300 p-2 bg-white" required>
                <option value="">-- Odaberi nastavnika --</option>
                {users.filter(u => u.role === 'teacher' || u.role === 'admin').map(t => <option key={t.id} value={t.id}>{userNames[t.id] || t.email}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-6 py-2 flex items-center gap-2 w-full justify-center"><Plus size={18} /> Dodijeli</button>
            </div>
          </form>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm">
          {classSubjects.filter(cs => !selectedClassIdForSubjects || cs.class_id === selectedClassIdForSubjects).map(cs => {
            const cls = classes.find(c => c.id === cs.class_id);
            const sub = subjects.find(s => s.id === cs.subject_id);
            const tea = users.find(u => u.id === cs.teacher_id);
            return (
              <div key={cs.id} className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <span className="font-bold">{cls?.name}</span>: {sub?.name} ({userNames[tea?.id] || tea?.email})
                </div>
                <button onClick={() => {
                  const updated = classSubjects.filter(x => x.id !== cs.id);
                  setClassSubjects(updated);
                }} className="text-red-500"><Trash2 size={18} /></button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeTab === 'Korisnici') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveTab(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl text-gray-800">Upravljanje korisnicima</h2>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm mb-8">
          <h3 className="text-lg font-bold mb-4">{editingUser ? 'Uredi korisnika' : 'Dodaj novog korisnika'}</h3>
          <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Ime i prezime</label>
              <input 
                type="text" 
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                className="w-full border border-gray-300 p-2" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">E-mail (Korisničko ime)</label>
              <input 
                type="email" 
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full border border-gray-300 p-2" 
                required 
              />
            </div>
            {!editingUser && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Lozinka</label>
                <input 
                  type="text" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 p-2" 
                  required 
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Uloga</label>
              <select 
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full border border-gray-300 p-2 bg-white"
              >
                <option value="student">Učenik</option>
                <option value="teacher">Nastavnik</option>
                <option value="parent">Roditelj</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              {editingUser && (
                <button type="button" onClick={() => { setEditingUser(null); setNewEmail(''); setNewFullName(''); }} className="bg-gray-200 hover:bg-gray-300 px-6 py-2">Odustani</button>
              )}
              <button 
                type="submit" 
                disabled={loading}
                className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-6 py-2 flex items-center gap-2 disabled:opacity-50"
              >
                <Plus size={18} /> {editingUser ? 'Ažuriraj' : 'Dodaj'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-700">
            <div className="col-span-2">Ime i prezime / E-mail</div>
            <div>Uloga</div>
            <div className="text-right col-span-2">Akcije</div>
          </div>
          {loading && users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Učitavanje korisnika...</div>
          ) : (
            users.map(user => (
              <div key={user.id} className="grid grid-cols-5 gap-4 p-4 border-b border-gray-100 items-center">
                <div className="col-span-2">
                  <div className="font-medium">{userNames[user.id] || 'Nema imena'}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'parent' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div className="text-right col-span-2 flex justify-end gap-2">
                  <button 
                    onClick={() => handleEditUser(user)}
                    className="text-blue-500 hover:text-blue-700 p-2"
                    title="Uredi korisnika"
                  >
                    Uredi
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Obriši korisnika"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'Administracija učenika') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveTab(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl text-gray-800">Upravljanje učenicima</h2>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm mb-8">
          <h3 className="text-lg font-bold mb-4">Dodaj učenike u razred</h3>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Odaberi učenike (iz popisa korisnika)</label>
                <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto bg-gray-50">
                  {users.filter(u => u.role === 'student' && !students.some(s => s.user_id === u.id)).length === 0 ? (
                    <div className="text-sm text-gray-500 p-2 italic">Nema dostupnih učenika za dodavanje.</div>
                  ) : (
                    users.filter(u => u.role === 'student' && !students.some(s => s.user_id === u.id)).map(u => (
                      <label key={u.id} className="flex items-center gap-2 p-1 hover:bg-gray-100 cursor-pointer text-sm">
                        <input 
                          type="checkbox" 
                          checked={selectedUserIds.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds([...selectedUserIds, u.id]);
                            } else {
                              setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                            }
                          }}
                        />
                        <span>{userNames[u.id] || u.email}</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Odabrano: {selectedUserIds.length} učenika
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Razred</label>
                  <select 
                    value={newStudentClassId}
                    onChange={(e) => setNewStudentClassId(e.target.value)}
                    className="w-full border border-gray-300 p-2 bg-white"
                    required
                  >
                    <option value="">Odaberi razred</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Program (zajednički za sve odabrane)</label>
                  <input 
                    type="text" 
                    value={newStudentProgram}
                    onChange={(e) => setNewStudentProgram(e.target.value)}
                    className="w-full border border-gray-300 p-2" 
                    placeholder="npr. Opća gimnazija"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">E-mail roditelja (opcionalno)</label>
                  <input 
                    type="email" 
                    value={newStudentParentEmail}
                    onChange={(e) => setNewStudentParentEmail(e.target.value)}
                    className="w-full border border-gray-300 p-2" 
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={loading || selectedUserIds.length === 0}
                className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-8 py-2 flex items-center gap-2 disabled:opacity-50"
              >
                <Plus size={18} /> Dodaj odabrane učenike ({selectedUserIds.length})
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-700">
            <div className="col-span-2">Ime i prezime</div>
            <div>Razred</div>
            <div className="text-right">Akcije</div>
          </div>
          {loading && students.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Učitavanje učenika...</div>
          ) : (
            students.map(student => (
              <div key={student.id} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100 items-center">
                <div className="col-span-2 font-medium">{student.name}</div>
                <div>{student.classes?.name || '-'}</div>
                <div className="text-right">
                  <button 
                    onClick={() => handleDeleteStudent(student.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Obriši učenika"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'Razredni odjeli i grupe') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveTab(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl text-gray-800">Upravljanje razredima</h2>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm mb-8">
          <h3 className="text-lg font-bold mb-4">{editingClass ? 'Uredi razred' : 'Dodaj novi razred'}</h3>
          <form onSubmit={editingClass ? handleUpdateClass : handleAddClass} className="grid grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm text-gray-600 mb-1">Naziv</label>
              <input 
                type="text" 
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="w-full border border-gray-300 p-2" 
                placeholder="npr. 1.A"
                required 
              />
            </div>
            <div className="w-full">
              <label className="block text-sm text-gray-600 mb-1">Godina</label>
              <select 
                value={newClassYear}
                onChange={(e) => setNewClassYear(e.target.value)}
                className="w-full border border-gray-300 p-2 bg-white"
                required
              >
                <option value="1. razred srednje škole">1. razred srednje škole</option>
                <option value="2. razred srednje škole">2. razred srednje škole</option>
                <option value="3. razred srednje škole">3. razred srednje škole</option>
                <option value="4. razred srednje škole">4. razred srednje škole</option>
              </select>
            </div>
            <div className="w-full">
              <label className="block text-sm text-gray-600 mb-1">Razrednik</label>
              <select 
                value={newClassHeadTeacher}
                onChange={(e) => setNewClassHeadTeacher(e.target.value)}
                className="w-full border border-gray-300 p-2 bg-white"
              >
                <option value="">-- Odaberi razrednika --</option>
                {users.filter(u => u.role === 'teacher' || u.role === 'admin').map(t => (
                  <option key={t.id} value={t.id}>{userNames[t.id] || t.email}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-sm text-gray-600 mb-1">Zamjenik razrednika</label>
              <select 
                value={newClassDeputyHeadTeacher}
                onChange={(e) => setNewClassDeputyHeadTeacher(e.target.value)}
                className="w-full border border-gray-300 p-2 bg-white"
              >
                <option value="">-- Odaberi zamjenika --</option>
                {users.filter(u => u.role === 'teacher' || u.role === 'admin').map(t => (
                  <option key={t.id} value={t.id}>{userNames[t.id] || t.email}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Program</label>
              <select 
                value={newClassProgram}
                onChange={(e) => setNewClassProgram(e.target.value)}
                className="w-full border border-gray-300 p-2 bg-white"
              >
                <option value="">-- Odaberi program --</option>
                <option value="Kuhar/Kuharica">Kuhar/Kuharica</option>
                <option value="Konobar/Konobarica">Konobar/Konobarica</option>
                <option value="Slastičar/Slastičarka">Slastičar/Slastičarka</option>
                <option value="Tehničar za ugostiteljstvo/Tehničarka za ugostiteljstvo">Tehničar za ugostiteljstvo/Tehničarka za ugostiteljstvo</option>
                <option value="Turističko-hotelijerski komercijalist">Turističko-hotelijerski komercijalist</option>
              </select>
            </div>
            <div className="col-span-2 flex gap-2">
              <button 
                type="submit"
                disabled={loading}
                className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-6 py-2 flex items-center gap-2 disabled:opacity-50 flex-1 justify-center"
              >
                {editingClass ? 'Spremi promjene' : <><Plus size={18} /> Dodaj</>}
              </button>
              {editingClass && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditingClass(null);
                    setNewClassName('');
                    setNewClassProgram('');
                    setNewClassHeadTeacher('');
                    setNewClassDeputyHeadTeacher('');
                    setNewClassYear('1. razred srednje škole');
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2"
                >
                  Odustani
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm overflow-x-auto">
          <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-700 min-w-[800px]">
            <div>Naziv</div>
            <div>Razrednik</div>
            <div>Zamjenik</div>
            <div>Godina</div>
            <div className="text-right">Akcije</div>
          </div>
          {loading && classes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Učitavanje razreda...</div>
          ) : (
            classes.map(c => {
                const isHeadTeacher = c.head_teacher === user?.id;
                const isDeputyHeadTeacher = c.deputy_head_teacher === user?.id;
                const rowColor = isHeadTeacher ? 'bg-green-50' : (isDeputyHeadTeacher ? 'bg-orange-50' : '');
                return (
                  <div key={c.id} className={`grid grid-cols-5 gap-4 p-4 border-b border-gray-100 items-center min-w-[800px] ${rowColor}`}>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm">{userNames[c.head_teacher] || c.head_teacher || '-'}</div>
                    <div className="text-sm">{userNames[c.deputy_head_teacher] || c.deputy_head_teacher || '-'}</div>
                    <div className="text-sm">{c.year || '-'}</div>
                    <div className="text-right flex justify-end gap-2">
                      <button 
                        onClick={() => handleEditClass(c)}
                        className="text-blue-600 hover:text-blue-800 p-2"
                        title="Uredi razred"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClass(c.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Obriši razred"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'Prijenos učenika u viši razred') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveTab(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl text-gray-800">Prijenos učenika u viši razred</h2>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm mb-8">
          <div className="flex gap-8">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">1. Odaberi izvorni razred</label>
              <select 
                value={transferSourceClassId}
                onChange={(e) => setTransferSourceClassId(e.target.value)}
                className="w-full border border-gray-300 p-2 bg-white"
              >
                <option value="">-- Odaberi razred --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">2. Odaberi ciljni razred</label>
              <select 
                value={transferTargetClassId}
                onChange={(e) => setTransferTargetClassId(e.target.value)}
                className="w-full border border-gray-300 p-2 bg-white"
                disabled={!transferSourceClassId}
              >
                <option value="">-- Odaberi razred --</option>
                {classes.filter(c => c.id !== transferSourceClassId).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {transferSourceClassId && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-bold text-gray-700">3. Odaberi učenike za prijenos</label>
                <button 
                  onClick={() => {
                    if (selectedTransferStudents.length === transferStudents.length) {
                      setSelectedTransferStudents([]);
                    } else {
                      setSelectedTransferStudents(transferStudents.map(s => s.id));
                    }
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {selectedTransferStudents.length === transferStudents.length ? 'Odznači sve' : 'Označi sve'}
                </button>
              </div>
              
              <div className="border border-gray-200 max-h-64 overflow-y-auto">
                {loading && transferStudents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">Učitavanje učenika...</div>
                ) : transferStudents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">Nema učenika u odabranom razredu.</div>
                ) : (
                  transferStudents.map(student => (
                    <div key={student.id} className="flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50">
                      <input 
                        type="checkbox" 
                        id={`student-${student.id}`}
                        checked={selectedTransferStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTransferStudents([...selectedTransferStudents, student.id]);
                          } else {
                            setSelectedTransferStudents(selectedTransferStudents.filter(id => id !== student.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <label htmlFor={`student-${student.id}`} className="flex-1 cursor-pointer">
                        {student.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleTransferStudents}
                  disabled={loading || !transferTargetClassId || selectedTransferStudents.length === 0}
                  className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-6 py-2 disabled:opacity-50"
                >
                  Prebaci odabrane učenike ({selectedTransferStudents.length})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (activeTab === 'Administracija predmeta') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveTab(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl text-gray-800">Administracija predmeta</h2>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm mb-8">
          <h3 className="text-lg font-bold mb-4">Dodaj novi predmet</h3>
          <form onSubmit={handleAddSubject} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Naziv predmeta</label>
              <input 
                type="text" 
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="w-full border border-gray-300 p-2" 
                placeholder="npr. Matematika"
                required 
              />
            </div>
            <button 
              type="submit" 
              className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-6 py-2 flex items-center gap-2"
            >
              <Plus size={18} /> Dodaj
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-700">
            <div>Naziv predmeta</div>
            <div className="text-right">Akcije</div>
          </div>
          {subjects.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nema dodanih predmeta.</div>
          ) : (
            subjects.map(subject => (
              <div key={subject.id} className="grid grid-cols-2 gap-4 p-4 border-b border-gray-100 items-center">
                <div className="font-medium">{subject.name}</div>
                <div className="text-right">
                  <button 
                    onClick={() => handleDeleteSubject(subject.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Obriši predmet"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'Dodijeli nastavnicima predmete') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveTab(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl text-gray-800">Dodjela predmeta nastavnicima</h2>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm mb-8">
          <h3 className="text-lg font-bold mb-4">Dodijeli predmet</h3>
          <form onSubmit={handleAssignTeacher} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Nastavnik</label>
              <select 
                value={newSubjectTeacherId}
                onChange={(e) => setNewSubjectTeacherId(e.target.value)}
                className="w-full border border-gray-300 p-2 bg-white"
                required
              >
                <option value="">-- Odaberi nastavnika --</option>
                {users.filter(u => u.role === 'teacher' || u.role === 'admin').map(t => (
                  <option key={t.id} value={t.id}>{userNames[t.id] || t.email}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Predmet</label>
              <select 
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full border border-gray-300 p-2 bg-white"
                required
              >
                <option value="">-- Odaberi predmet --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <button 
              type="submit" 
              className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-6 py-2 flex items-center gap-2"
            >
              <Plus size={18} /> Dodijeli
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-700">
            <div>Nastavnik</div>
            <div>Predmet</div>
            <div className="text-right">Akcije</div>
          </div>
          {subjectTeachers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nema dodijeljenih predmeta.</div>
          ) : (
            subjectTeachers.map(assignment => {
              const teacher = users.find(u => u.id === assignment.teacher_id);
              const subject = subjects.find(s => s.id === assignment.subject_id);
              return (
                <div key={assignment.id} className="grid grid-cols-3 gap-4 p-4 border-b border-gray-100 items-center">
                  <div className="font-medium">{userNames[teacher?.id] || teacher?.email || 'Nepoznat nastavnik'}</div>
                  <div>{subject?.name || 'Nepoznat predmet'}</div>
                  <div className="text-right">
                    <button 
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="Obriši dodjelu"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl text-gray-800 mb-4">Administracija</h2>
      
      <div className="border border-gray-200 bg-white">
        {adminLinks.map((link) => (
          <div 
            key={link}
            onClick={() => setActiveTab(link)}
            className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 text-sm text-gray-700 flex justify-between items-center"
          >
            <span>{link}</span>
            <span className="text-gray-400 text-xs">Otvori &rarr;</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdministracijaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Učitavanje...</div>}>
      <AdministracijaContent />
    </Suspense>
  );
}
