'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { TriangleAlert, Clock, Shuffle, Edit2, X } from 'lucide-react';

export default function ImenikPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [parents, setParents] = useState<any[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [selectedStudentForAbsence, setSelectedStudentForAbsence] = useState<any>(null);
  const [absences, setAbsences] = useState<any[]>([]);
  const [newAbsenceDate, setNewAbsenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAbsenceHours, setNewAbsenceHours] = useState(1);
  const [newAbsenceReason, setNewAbsenceReason] = useState('');
  const [isHeadTeacher, setIsHeadTeacher] = useState(false);

  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    init();
  }, []);

  useEffect(() => {
    const fetchStudentsAndParents = async () => {
      if (!user) return;
      try {
        // Fetch students
        const studentsQuery = query(collection(db, 'students'), where('class_id', '==', classId), orderBy('name'));
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentsList);

        // Fetch parents
        const parentsQuery = query(collection(db, 'users'), where('role', '==', 'parent'));
        const parentsSnapshot = await getDocs(parentsQuery);
        const parentsList = parentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setParents(parentsList);

        // Fetch class info
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (classDoc.exists()) {
          const classData = classDoc.data();
          if (classData.head_teacher_id === user.id || classData.head_teacher === user.email) {
            setIsHeadTeacher(true);
          }
        }

        // Fetch absences
        const absencesSnapshot = await getDocs(collection(db, 'absences'));
        const absencesList = absencesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAbsences(absencesList);

      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'students/parents/classes/absences');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentsAndParents();
  }, [classId, user]);

  const handleAddAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAbsence) return;

    try {
      const newAbsence = {
        student_id: selectedStudentForAbsence.id,
        date: newAbsenceDate,
        hours: newAbsenceHours,
        reason: newAbsenceReason,
        isJustified: false,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'absences'), newAbsence);
      setAbsences([...absences, { id: docRef.id, ...newAbsence }]);
      setNewAbsenceReason('');
      alert('Izostanak zabilježen.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'absences');
    }
  };

  const toggleJustify = async (absenceId: string) => {
    const absence = absences.find(a => a.id === absenceId);
    if (!absence) return;

    try {
      await updateDoc(doc(db, 'absences', absenceId), {
        isJustified: !absence.isJustified
      });
      setAbsences(absences.map(a => a.id === absenceId ? { ...a, isJustified: !absence.isJustified } : a));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `absences/${absenceId}`);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'students', editingStudent.id), {
        name: editingStudent.name,
        program: editingStudent.program
      });

      // Handle parent assignment
      if (selectedParentId) {
        // Find if any other parent has this student
        const otherParentsQuery = query(collection(db, 'users'), where('student_id', '==', editingStudent.id));
        const otherParentsSnapshot = await getDocs(otherParentsQuery);
        for (const parentDoc of otherParentsSnapshot.docs) {
          await updateDoc(doc(db, 'users', parentDoc.id), { student_id: null });
        }
        // Assign to new parent
        await updateDoc(doc(db, 'users', selectedParentId), { student_id: editingStudent.id });
      } else {
        // Remove parent assignment
        const otherParentsQuery = query(collection(db, 'users'), where('student_id', '==', editingStudent.id));
        const otherParentsSnapshot = await getDocs(otherParentsQuery);
        for (const parentDoc of otherParentsSnapshot.docs) {
          await updateDoc(doc(db, 'users', parentDoc.id), { student_id: null });
        }
      }

      setStudents(students.map(s => s.id === editingStudent.id ? editingStudent : s));
      setEditingStudent(null);
      alert('Podaci uspješno spremljeni.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${editingStudent.id}`);
      alert('Greška pri spremanju podataka.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = async (e: React.MouseEvent, student: any) => {
    e.stopPropagation();
    setEditingStudent({ ...student });
    
    try {
      const parentQuery = query(collection(db, 'users'), where('student_id', '==', student.id));
      const parentSnapshot = await getDocs(parentQuery);
      if (!parentSnapshot.empty) {
        setSelectedParentId(parentSnapshot.docs[0].id);
      } else {
        setSelectedParentId('');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users/parent');
    }
  };

  const handleRandomStudent = () => {
    if (students.length === 0) return;
    const randomIndex = Math.floor(Math.random() * students.length);
    const randomStudent = students[randomIndex];
    router.push(`/razredi/${classId}/imenik/${randomStudent.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl text-gray-800">Učenici u razredu</h2>
        <div className="flex gap-2">
          {isHeadTeacher && (
            <button 
              onClick={() => router.push(`/razredi/${classId}/administracija`)}
              className="flex items-center gap-2 bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 px-4 py-2 text-sm transition-colors"
            >
              <Edit2 size={16} />
              Administracija razreda
            </button>
          )}
          <button 
            onClick={() => router.push(`/razredi/${classId}/imenik/grupni-unos`)}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 text-sm transition-colors"
          >
            <Edit2 size={16} />
            Grupni unos ocjena
          </button>
          <button 
            onClick={handleRandomStudent}
            className="flex items-center gap-2 bg-[#2c5282] hover:bg-[#1a365d] text-white px-4 py-2 text-sm transition-colors"
          >
            <Shuffle size={16} />
            Slučajan odabir
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-4 text-gray-500">Učitavanje učenika...</div>
      ) : (
        <div className="border border-gray-200 bg-white">
          {students.map((student, index) => (
            <div 
              key={student.id}
              onClick={() => router.push(`/razredi/${classId}/imenik/${student.id}`)}
              className={`flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                index === 1 ? 'bg-red-50 border-red-200' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Avatar placeholder */}
                <div className="w-12 h-12 bg-gradient-to-b from-orange-200 to-orange-400 rounded-t-full overflow-hidden flex items-end justify-center border border-gray-300">
                  <div className="w-8 h-6 bg-gray-800 rounded-t-full"></div>
                </div>
                
                <div>
                  <div className="font-medium text-gray-900">{index + 1}. {student.name}</div>
                  <div className="text-xs text-gray-500">{student.program}</div>
                </div>
              </div>

              {/* Warnings and Actions */}
              <div className="flex items-center gap-3">
                {student.warnings_grades > 0 && (
                  <div className="flex items-center gap-1 border border-red-300 px-2 py-1 bg-white text-red-500">
                    <TriangleAlert size={16} className="text-yellow-500 fill-yellow-100" />
                    <span className="text-sm font-bold">{student.warnings_grades}</span>
                  </div>
                )}
                {student.warnings_absences && (
                  <div className="border border-red-300 p-1 bg-white text-red-500">
                    <Clock size={16} />
                  </div>
                )}
                {(user?.role === 'admin' || user?.role === 'teacher') && (
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudentForAbsence(student);
                        setShowAbsenceModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded"
                      title="Izostanci"
                    >
                      <Clock size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleEditClick(e, student)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Uredi podatke"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <div className="p-4 text-gray-500">Nema pronađenih učenika. Jeste li pokrenuli SQL skriptu u Supabaseu?</div>
          )}
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Uredi podatke o učeniku</h3>
            <form onSubmit={handleSaveStudent}>
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Ime i prezime</label>
                <input 
                  type="text" 
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                  className="w-full border border-gray-300 p-2" 
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Program</label>
                <input 
                  type="text" 
                  value={editingStudent.program || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, program: e.target.value})}
                  className="w-full border border-gray-300 p-2" 
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-1">Roditelj (pridruženi korisnik)</label>
                <select 
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full border border-gray-300 p-2 bg-white"
                >
                  <option value="">-- Bez pridruženog roditelja --</option>
                  {parents.map(p => (
                    <option key={p.id} value={p.id}>{p.email}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Odustani
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-4 py-2 disabled:opacity-50"
                >
                  Spremi promjene
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Absence Modal */}
      {showAbsenceModal && selectedStudentForAbsence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Izostanci: {selectedStudentForAbsence.name}</h3>
              <button onClick={() => setShowAbsenceModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold mb-3 text-sm text-gray-700">Zabilježi novi izostanak</h4>
                <form onSubmit={handleAddAbsence} className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Datum</label>
                    <input type="date" value={newAbsenceDate} onChange={(e) => setNewAbsenceDate(e.target.value)} className="w-full border border-gray-300 p-2 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Broj sati</label>
                    <input type="number" value={newAbsenceHours} onChange={(e) => setNewAbsenceHours(Number(e.target.value))} className="w-full border border-gray-300 p-2 text-sm" min="1" required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Razlog / Napomena</label>
                    <textarea value={newAbsenceReason} onChange={(e) => setNewAbsenceReason(e.target.value)} className="w-full border border-gray-300 p-2 text-sm h-20" />
                  </div>
                  <button type="submit" className="w-full bg-[#2c5282] text-white py-2 text-sm hover:bg-[#1a365d]">Spremi</button>
                </form>
              </div>
              
              <div>
                <h4 className="font-bold mb-3 text-sm text-gray-700">Povijest izostanaka</h4>
                <div className="border border-gray-200 max-h-64 overflow-y-auto">
                  {absences.filter(a => a.student_id === selectedStudentForAbsence.id).length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm italic">Nema zabilježenih izostanaka.</div>
                  ) : (
                    absences.filter(a => a.student_id === selectedStudentForAbsence.id).map(absence => (
                      <div key={absence.id} className="p-3 border-b border-gray-100 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium">{new Date(absence.date).toLocaleDateString('hr-HR')} ({absence.hours}h)</div>
                          <div className="text-xs text-gray-500">{absence.reason || 'Nema napomene'}</div>
                        </div>
                        <button 
                          onClick={() => toggleJustify(absence.id)}
                          className={`px-2 py-1 text-xs rounded border transition-colors ${
                            absence.isJustified 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                          }`}
                        >
                          {absence.isJustified ? 'Opravdano' : 'Neopravdano'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
