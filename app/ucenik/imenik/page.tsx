'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, handleFirestoreError } from '@/lib/firebase';
import { collection, query, getDocs, getDoc, doc, where, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowLeft, BookOpen, User, ChevronRight } from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export default function UcenikImenikPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Record<string, any>>({});
  const [teachers, setTeachers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [grades, setGrades] = useState<any[]>([]);

  const fetchClassData = async (classId: string) => {
    if (!classId) return;
    try {
      // Fetch subjects assigned to this class
      const csRef = collection(db, 'class_subjects');
      const q = query(csRef, where('class_id', '==', classId));
      const csSnapshot = await getDocs(q);
      const csData = csSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setClassSubjects(csData);

      // Fetch subject details
      const subjectIds = Array.from(new Set(csData.map((cs: any) => cs.subject_id))) as string[];
      const subjectsMap: Record<string, any> = {};
      for (const sId of subjectIds) {
        const sDoc = await getDoc(doc(db, 'subjects', sId));
        if (sDoc.exists()) {
          subjectsMap[sId] = { id: sDoc.id, ...sDoc.data() };
        }
      }
      setSubjects(subjectsMap);

      // Fetch teacher details
      const teacherIds = Array.from(new Set(csData.map((cs: any) => cs.teacher_id))) as string[];
      const teachersMap: Record<string, any> = {};
      for (const tId of teacherIds) {
        const tDoc = await getDoc(doc(db, 'users', tId));
        if (tDoc.exists()) {
          teachersMap[tId] = { id: tDoc.id, ...tDoc.data() };
        }
      }
      setTeachers(teachersMap);

    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'class_subjects');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as any;
            setUser(userData);

            // Find student record for this user
            const studentsRef = collection(db, 'students');
            const q2 = query(studentsRef, where('email', '==', authUser.email));
            const studentSnapshot = await getDocs(q2);
            
            if (!studentSnapshot.empty) {
              const sData = { id: studentSnapshot.docs[0].id, ...studentSnapshot.docs[0].data() } as any;
              setStudentData(sData);
              fetchClassData(sData.class_id);
            } else {
              // Try searching by name if email doesn't match (for demo purposes)
              const q3 = query(studentsRef, where('name', '==', userData.full_name));
              const studentSnapshot2 = await getDocs(q3);
              if (!studentSnapshot2.empty) {
                const sData = { id: studentSnapshot2.docs[0].id, ...studentSnapshot2.docs[0].data() } as any;
                setStudentData(sData);
                fetchClassData(sData.class_id);
              }
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${authUser.uid}`);
        }
      } else {
        router.push('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    let isMounted = true;
    if (selectedSubjectId && studentData) {
      const fetchGrades = async () => {
        try {
          const gRef = collection(db, 'grades');
          const q = query(
            gRef, 
            where('student_id', '==', studentData.id),
            where('subject_id', '==', selectedSubjectId),
            orderBy('date_created', 'desc')
          );
          const gSnapshot = await getDocs(q);
          if (isMounted) {
            setGrades(gSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'grades');
        }
      };
      fetchGrades();
    }
    return () => { isMounted = false; };
  }, [selectedSubjectId, studentData]);

  const months = [
    'Rujan', 'Listopad', 'Studeni', 'Prosinac', 'Siječanj', 
    'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj', 'Srpanj', 'Kolovoz'
  ];

  const getGradesByMonth = () => {
    const grouped: Record<number, any[]> = {};
    grades.forEach(g => {
      const date = new Date(g.date_created);
      const month = date.getMonth();
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(g);
    });
    return grouped;
  };

  const groupedGrades = getGradesByMonth();

  if (loading) return <div className="p-8 text-center">Učitavanje...</div>;
  if (!user || !studentData) return <div className="p-8 text-center">Podaci o učeniku nisu pronađeni.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#1a365d] text-white px-6 py-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="hover:bg-white/10 p-2 rounded">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">Imenik - {studentData.name}</h1>
        </div>
        <div className="text-sm opacity-80">
          {studentData.program}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar - Subjects List */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Predmeti</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {classSubjects.map((cs) => {
              const subject = subjects[cs.subject_id];
              const teacher = teachers[cs.teacher_id];
              const isSelected = selectedSubjectId === cs.subject_id;

              return (
                <div 
                  key={cs.id}
                  onClick={() => setSelectedSubjectId(cs.subject_id)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                        {subject?.name || 'Učitavanje...'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {teacher?.full_name || teacher?.email || 'Nepoznat nastavnik'}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </div>
              );
            })}
            {classSubjects.length === 0 && (
              <div className="p-8 text-center text-gray-400 italic text-sm">
                Nema dodijeljenih predmeta za vaš razred.
              </div>
            )}
          </div>
        </div>

        {/* Content - Grades for selected subject */}
        <div className="flex-1 overflow-y-auto p-8">
          {selectedSubjectId ? (
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">{subjects[selectedSubjectId]?.name}</h2>
                  <p className="text-gray-500 mt-1 flex items-center gap-2">
                    <User size={16} />
                    Nastavnik: {teachers[classSubjects.find(cs => cs.subject_id === selectedSubjectId)?.teacher_id]?.full_name}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400 uppercase font-bold">Prosjek</div>
                  <div className="text-4xl font-black text-blue-600">
                    {grades.length > 0 
                      ? (grades.reduce((acc, curr) => acc + curr.grade, 0) / grades.length).toFixed(2)
                      : '-'
                    }
                  </div>
                </div>
              </div>

              {/* Grades grouped by month */}
              <div className="space-y-6">
                {months.map((monthName, index) => {
                  const monthIndex = (index + 8) % 12; // Start from September (index 8)
                  const monthGrades = groupedGrades[monthIndex];
                  
                  if (!monthGrades || monthGrades.length === 0) return null;

                  return (
                    <div key={monthName} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <h3 className="font-bold text-gray-700">{monthName}</h3>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {monthGrades.map((grade) => (
                          <div key={grade.id} className="p-6 flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-800 font-black text-2xl rounded-lg">
                                  {grade.grade}
                                </span>
                                <div>
                                  <p className="font-bold text-gray-800">{grade.element}</p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(grade.date_created).toLocaleDateString('hr-HR')}
                                  </p>
                                </div>
                              </div>
                              {grade.note && (
                                <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-gray-200 italic">
                                  &quot;{grade.note}&quot;
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {grades.length === 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center text-gray-400 italic">
                    Nema upisanih ocjena za ovaj predmet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <BookOpen size={64} className="mb-4 opacity-20" />
              <p className="text-lg">Odaberite predmet s lijeve strane za pregled ocjena.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
