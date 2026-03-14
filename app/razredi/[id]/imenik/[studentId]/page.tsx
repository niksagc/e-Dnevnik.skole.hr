'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc, updateDoc, addDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { ArrowLeft, ArrowRight, Shuffle, Trash2 } from 'lucide-react';
import { subjects, evaluationElements } from '@/lib/mock-data';

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const studentId = params.studentId as string;
  
  const [student, setStudent] = useState<any>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string>('');
  
  // Grade form state
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [newGrade, setNewGrade] = useState<number | null>(null);
  const [isWritten, setIsWritten] = useState(false);
  const [note, setNote] = useState('');
  const [gradeDate, setGradeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Final grade state
  const [showFinalGradeModal, setShowFinalGradeModal] = useState(false);
  const [finalGrade, setFinalGrade] = useState<number | string | null>(null);

  // Exam state
  const [showExamModal, setShowExamModal] = useState(false);
  const [examType, setExamType] = useState('Dopunski rad');
  const [examGrade, setExamGrade] = useState<number | null>(null);
  const [examNote, setExamNote] = useState('');
  const [examDate, setExamDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        if (studentDoc.exists()) {
          setStudent({ id: studentDoc.id, ...studentDoc.data() });
        }

        const allStudentsQuery = query(collection(db, 'students'), where('class_id', '==', classId));
        const allStudentsSnapshot = await getDocs(allStudentsQuery);
        setAllStudents(allStudentsSnapshot.docs.map(doc => ({ id: doc.id })));

        const gradesQuery = query(collection(db, 'grades'), where('student_id', '==', studentId));
        const gradesSnapshot = await getDocs(gradesQuery);
        setGrades(gradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `students/${studentId}`);
      }
    };
    
    fetchStudentData();
  }, [studentId, classId]);

  const handleRandomStudent = () => {
    if (allStudents.length <= 1) return;
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * allStudents.length);
    } while (allStudents[randomIndex].id === studentId);
    
    const randomStudent = allStudents[randomIndex];
    router.push(`/razredi/${classId}/imenik/${randomStudent.id}`);
  };

  const handleSaveGrade = async () => {
    if (!newGrade || !selectedSubject || !selectedElement) return;
    setSaving(true);
    
    let finalNote = note;
    if (outcomes.length > 0) {
      const outcomesStr = `[Ishodi: ${outcomes.join(', ')}]`;
      finalNote = note ? `${note} ${outcomesStr}` : outcomesStr;
    }
    
    try {
      if (editingGradeId) {
        const gradeUpdate = {
          grade: newGrade,
          is_written: isWritten,
          note: finalNote,
          date_created: new Date(gradeDate).toISOString()
        };
        await updateDoc(doc(db, 'grades', editingGradeId), gradeUpdate);
        setGrades(grades.map(g => g.id === editingGradeId ? { ...g, ...gradeUpdate } : g));
        setShowGradeModal(false);
      } else {
        const gradeData = {
          student_id: studentId,
          subject: selectedSubject,
          element: selectedElement,
          grade: newGrade,
          is_written: isWritten,
          note: finalNote,
          date_created: new Date(gradeDate).toISOString()
        };

        const docRef = await addDoc(collection(db, 'grades'), gradeData);
        setGrades([...grades, { id: docRef.id, ...gradeData }]);
        setShowGradeModal(false);
      }
    } catch (error) {
      handleFirestoreError(error, editingGradeId ? OperationType.UPDATE : OperationType.CREATE, 'grades');
      alert('Greška pri spremanju ocjene.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGrade = async () => {
    if (!editingGradeId) return;
    if (!window.confirm('Jeste li sigurni da želite obrisati ovu ocjenu?')) return;
    
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'grades', editingGradeId));
      setGrades(grades.filter(g => g.id !== editingGradeId));
      setShowGradeModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `grades/${editingGradeId}`);
      alert('Greška pri brisanju ocjene.');
    } finally {
      setSaving(false);
    }
  };

  const openGradeModal = (element: string) => {
    setSelectedElement(element);
    setEditingGradeId(null);
    setNewGrade(null);
    setIsWritten(false);
    setNote('');
    setGradeDate(new Date().toISOString().split('T')[0]);
    setOutcomes([]);
    setShowGradeModal(true);
  };

  const openEditGradeModal = (grade: any) => {
    setSelectedElement(grade.element);
    setEditingGradeId(grade.id);
    setNewGrade(grade.grade);
    setIsWritten(grade.is_written);
    
    let parsedNote = grade.note || '';
    let parsedOutcomes: string[] = [];
    
    const outcomesMatch = parsedNote.match(/\[Ishodi: (.*?)\]/);
    if (outcomesMatch) {
      parsedOutcomes = outcomesMatch[1].split(', ');
      parsedNote = parsedNote.replace(/\[Ishodi: .*?\]/, '').trim();
    }
    
    setNote(parsedNote);
    setGradeDate(new Date(grade.date_created).toISOString().split('T')[0]);
    setOutcomes(parsedOutcomes);
    setShowGradeModal(true);
  };

  const handleSaveFinalGrade = async () => {
    if (!finalGrade || !selectedSubject) return;
    setSaving(true);
    
    try {
      // Check if final grade already exists
      const existingFinalGrade = grades.find(g => g.subject === selectedSubject && g.element === 'ZAKLJUČNO');
      
      if (existingFinalGrade) {
        const gradeUpdate = { 
          grade: typeof finalGrade === 'number' ? finalGrade : null, 
          note: typeof finalGrade === 'string' ? finalGrade : '' 
        };
        await updateDoc(doc(db, 'grades', existingFinalGrade.id), gradeUpdate);
        setGrades(grades.map(g => g.id === existingFinalGrade.id ? { ...g, ...gradeUpdate } : g));
      } else {
        const gradeData = {
          student_id: studentId,
          subject: selectedSubject,
          element: 'ZAKLJUČNO',
          grade: typeof finalGrade === 'number' ? finalGrade : null,
          note: typeof finalGrade === 'string' ? finalGrade : '',
          is_written: false,
          date_created: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'grades'), gradeData);
        setGrades([...grades, { id: docRef.id, ...gradeData }]);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'grades/final');
    } finally {
      setSaving(false);
      setShowFinalGradeModal(false);
    }
  };

  const handleSaveExam = async () => {
    if (!examGrade || !selectedSubject) return;
    setSaving(true);
    
    try {
      const gradeData = {
        student_id: studentId,
        subject: selectedSubject,
        element: examType,
        grade: examGrade,
        note: examNote,
        is_written: false,
        date_created: new Date(examDate).toISOString()
      };

      const docRef = await addDoc(collection(db, 'grades'), gradeData);
      setGrades([...grades, { id: docRef.id, ...gradeData }]);
      setShowExamModal(false);
      setExamGrade(null);
      setExamNote('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'grades/exam');
      alert('Greška pri spremanju ispita.');
    } finally {
      setSaving(false);
    }
  };

  const getMonthIndex = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // 1-12
    const schoolMonths = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
    const index = schoolMonths.indexOf(month);
    return index >= 0 ? index : 0; // fallback to first column if outside
  };

  if (!student) return <div className="p-8 text-center text-gray-500">Učitavanje podataka o učeniku...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Student Header */}
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 bg-gradient-to-b from-orange-200 to-orange-400 rounded-t-full overflow-hidden flex items-end justify-center border border-gray-300">
          <div className="w-16 h-12 bg-gray-800 rounded-t-full"></div>
        </div>
        
        <div>
          <h2 className="text-2xl text-gray-800 mb-1">{student.name}</h2>
          <p className="text-sm text-gray-500 mb-4">{student.program}</p>
          
          <div className="flex items-center gap-2">
            <button className="bg-gray-400 text-white p-2 hover:bg-gray-500"><ArrowLeft size={16} /></button>
            <button className="bg-[#2c5282] text-white p-2 hover:bg-[#1a365d]"><ArrowRight size={16} /></button>
            <button 
              onClick={handleRandomStudent}
              className="flex items-center gap-2 bg-[#2c5282] hover:bg-[#1a365d] text-white px-4 py-2 text-sm"
            >
              <Shuffle size={16} />
              Slučajan odabir
            </button>
            <button 
              className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-4 py-2 text-sm ml-4"
              onClick={() => setSelectedSubject(null)}
            >
              Odaberi predmet
            </button>
          </div>
        </div>
      </div>

      {/* Subject Selection or Grading View */}
      {!selectedSubject ? (
        <div className="border border-gray-200 bg-white max-w-md">
          {subjects.map((subject, idx) => (
            <div 
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 text-sm ${
                idx === 1 ? 'bg-red-50 border-red-200 text-red-800' : 'text-gray-700'
              }`}
            >
              {subject}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200">
          <div className="flex justify-between items-center bg-gray-50 p-3 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">{selectedSubject}</h3>
            <div className="flex gap-2">
              {['IX', 'X', 'XI', 'XII', 'I', 'II', 'III', 'IV', 'V', 'VI'].map(month => (
                <div key={month} className="w-8 text-center text-xs text-gray-500 font-medium">{month}</div>
              ))}
            </div>
          </div>

          {/* Evaluation Elements Grid */}
          {evaluationElements.map((element) => {
            const elementGrades = grades.filter(g => g.subject === selectedSubject && g.element === element);
            
            return (
              <div key={element} className="flex justify-between items-center p-3 border-b border-gray-200">
                <div className="text-sm text-gray-700 w-1/3">{element}</div>
                <div className="flex gap-2 flex-1 justify-end">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(colIndex => {
                    const gradesInThisMonth = elementGrades.filter(g => getMonthIndex(g.date_created) === colIndex);
                    
                    return (
                      <div 
                        key={colIndex} 
                        className="w-8 min-h-[32px] border border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 gap-1 p-0.5"
                        onClick={() => openGradeModal(element)}
                      >
                        {gradesInThisMonth.map(g => (
                          <div 
                            key={g.id} 
                            onClick={(e) => { e.stopPropagation(); openEditGradeModal(g); }}
                            className={`w-full h-7 flex items-center justify-center font-bold text-sm border ${g.is_written ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200'}`}
                            title={g.note}
                          >
                            {g.grade}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {/* Final Grade Row */}
          <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50">
            <div className="text-sm font-bold text-gray-700">ZAKLJUČENO</div>
            <div className="flex gap-2 items-center">
              {(grades.find(g => g.subject === selectedSubject && g.element === 'ZAKLJUČNO')?.grade === 1 || 
                grades.find(g => g.subject === selectedSubject && g.element === 'ZAKLJUČNO')?.note === 'Neocijenjen') && (
                <button 
                  onClick={() => setShowExamModal(true)}
                  className="text-sm text-red-600 border border-red-300 px-2 py-1 bg-white hover:bg-red-50"
                >
                  Ispiti
                </button>
              )}
              <div 
                className="w-16 h-8 border border-gray-300 bg-white flex items-center justify-center font-bold cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  const existing = grades.find(g => g.subject === selectedSubject && g.element === 'ZAKLJUČNO');
                  setFinalGrade(existing ? (existing.grade || existing.note) : null);
                  setShowFinalGradeModal(true);
                }}
              >
                {grades.find(g => g.subject === selectedSubject && g.element === 'ZAKLJUČNO')?.grade || 
                 grades.find(g => g.subject === selectedSubject && g.element === 'ZAKLJUČNO')?.note || ''}
              </div>
            </div>
          </div>

          <div className="p-3 text-right text-sm text-gray-600 border-b border-gray-200">
            Prosjek ocjena: <span className="font-bold">
              {grades.filter(g => g.subject === selectedSubject).length > 0 
                ? (grades.filter(g => g.subject === selectedSubject).reduce((acc, g) => acc + g.grade, 0) / grades.filter(g => g.subject === selectedSubject).length).toFixed(2) 
                : '-'}
            </span> <span className="inline-block w-4 h-4 bg-black text-white rounded-full text-xs text-center leading-4 ml-1">i</span>
          </div>

          {/* Notes Section */}
          <div className="p-3 flex justify-between items-center bg-gray-50 border-b border-gray-200">
            <div className="font-bold text-sm">Bilješka</div>
            <div className="flex gap-4 text-sm font-bold">
              <button className="bg-[#2c5282] text-white px-3 py-1">Upis bilješke</button>
              <span>Ocjena</span>
              <span>Datum</span>
              <span>Datum upisa</span>
            </div>
          </div>
          
          {/* List of notes for this subject */}
          <div className="p-3 border-b border-gray-200">
            {grades.filter(g => g.subject === selectedSubject && g.note && !['ZAKLJUČNO', 'Dopunski rad', 'Popravni ispit', 'Razlikovni ispit'].includes(g.element)).map(g => (
              <div key={g.id} className="text-sm border-b border-gray-100 py-2 flex justify-between">
                <div className="w-2/3">{g.note}</div>
                <div className="w-1/3 text-right text-gray-500">
                  {g.grade} | {new Date(g.date_created).toLocaleDateString('hr-HR')}
                </div>
              </div>
            ))}
          </div>

          {/* Exams Section */}
          {grades.some(g => g.subject === selectedSubject && ['Dopunski rad', 'Popravni ispit', 'Razlikovni ispit'].includes(g.element)) && (
            <>
              <div className="p-3 flex justify-between items-center bg-gray-50 border-b border-gray-200 mt-4">
                <div className="font-bold text-sm">Razlikovni / Dopunski / Popravni ispiti</div>
                <div className="flex gap-4 text-sm font-bold">
                  <span>Razred</span>
                  <span>Datum</span>
                </div>
              </div>
              <div className="p-3">
                {grades.filter(g => g.subject === selectedSubject && ['Dopunski rad', 'Popravni ispit', 'Razlikovni ispit'].includes(g.element)).map(g => (
                  <div key={g.id} className="text-sm border-b border-gray-100 py-2 flex justify-between items-center">
                    <div className="w-1/4 font-bold text-gray-700">{g.element}</div>
                    <div className="w-1/2">{g.note}</div>
                    <div className="w-1/4 text-right flex justify-end gap-4 items-center">
                      <span className="font-bold text-lg">{g.grade}</span>
                      <span className="text-gray-500">{new Date(g.date_created).toLocaleDateString('hr-HR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Grade Entry Modal */}
      {showGradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl shadow-xl">
            <div className="bg-[#1a365d] text-white p-3 flex justify-between items-center">
              <h3 className="font-medium">{student.name} - {editingGradeId ? 'Uređivanje ocjene' : 'Nova ocjena'}</h3>
              <button onClick={() => setShowGradeModal(false)} className="text-white hover:text-gray-300">✕</button>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6 text-sm">
                <p>Predmet: <span className="font-bold">{selectedSubject}</span></p>
                <p>Element vrednovanja: <span className="font-bold">{selectedElement}</span></p>
              </div>

              <div className="flex justify-center gap-4 mb-8">
                {[1, 2, 3, 4, 5].map(grade => (
                  <button 
                    key={grade}
                    onClick={() => setNewGrade(grade)}
                    className={`w-12 h-12 border ${newGrade === grade ? 'border-blue-500 bg-blue-100' : 'border-gray-300'} text-lg font-medium hover:bg-gray-50`}
                  >
                    {grade}
                  </button>
                ))}
              </div>

              <div className="border border-red-300 p-4 mb-4 bg-red-50">
                <div className="flex items-center gap-4 mb-4">
                  <label className="text-sm w-32">Datum ocjene:</label>
                  <input 
                    type="date" 
                    value={gradeDate} 
                    onChange={(e) => setGradeDate(e.target.value)}
                    className="border border-gray-300 p-1 text-sm w-36 bg-white" 
                  />
                  
                  <label className="text-sm ml-8">Usmena/pisana provjera:</label>
                  <div className="flex border border-gray-300">
                    <button 
                      onClick={() => setIsWritten(true)}
                      className={`${isWritten ? 'bg-[#2c5282] text-white' : 'bg-white text-gray-700'} px-4 py-1 text-sm`}
                    >Da</button>
                    <button 
                      onClick={() => setIsWritten(false)}
                      className={`${!isWritten ? 'bg-[#2c5282] text-white' : 'bg-white text-gray-700'} px-4 py-1 text-sm`}
                    >Ne</button>
                  </div>
                </div>

                {['Hrvatski jezik', 'Matematika', 'Geografija', 'Povijest', 'Biologija'].includes(selectedSubject || '') && (
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-red-200">
                    <label className="text-sm w-32">Oznaka OO ishoda:</label>
                    <select 
                      className="border border-gray-300 p-1 text-sm flex-1 bg-white"
                      onChange={(e) => {
                        if (e.target.value && !outcomes.includes(e.target.value)) {
                          setOutcomes([...outcomes, e.target.value]);
                        }
                      }}
                      value=""
                    >
                      <option value="">-- odaberite ishode --</option>
                      <option value="OŠ HJ A.1.1.">OŠ HJ A.1.1. - razgovara u skladu sa svojim interesima</option>
                      <option value="OŠ HJ A.1.2.">OŠ HJ A.1.2. - sluša tekst i izdvaja ključne riječi</option>
                      <option value="OŠ MAT A.1.1.">OŠ MAT A.1.1. - opisuje i prikazuje količine</option>
                      <option value="OŠ MAT A.1.2.">OŠ MAT A.1.2. - zbraja i oduzima do 20</option>
                    </select>
                  </div>
                )}
                
                {outcomes.length > 0 && (
                  <div className="mt-2 pl-36">
                    {outcomes.map(outcome => (
                      <div key={outcome} className="flex items-center gap-2 text-sm mb-1 bg-white p-1 border border-gray-200">
                        <span className="font-bold">{outcome}</span>
                        <button 
                          onClick={() => setOutcomes(outcomes.filter(o => o !== outcome))}
                          className="text-red-500 ml-auto hover:text-red-700"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-6 border border-red-300 p-1">
                <label className="block text-sm mb-1">Bilješka:</label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border border-gray-300 h-24 p-2 focus:outline-none bg-red-50"
                  placeholder="Unesite bilješku uz ocjenu..."
                ></textarea>
              </div>

              <div className="flex justify-between items-center">
                {editingGradeId ? (
                  <button 
                    onClick={handleDeleteGrade}
                    disabled={saving}
                    className="flex items-center gap-2 text-red-600 hover:text-red-800 px-4 py-2 disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                    Obriši ocjenu
                  </button>
                ) : <div></div>}
                
                <button 
                  onClick={handleSaveGrade}
                  disabled={saving || !newGrade}
                  className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-8 py-2 border border-red-400 disabled:opacity-50"
                >
                  {saving ? 'Spremanje...' : (editingGradeId ? 'Spremi promjene' : 'Unesi')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Final Grade Modal */}
      {showFinalGradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl shadow-xl">
            <div className="bg-[#1a365d] text-white p-3 flex justify-between items-center">
              <h3 className="font-medium">Unos zaključne ocjene</h3>
              <button onClick={() => setShowFinalGradeModal(false)} className="text-white hover:text-gray-300">✕</button>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6 text-sm font-bold">
                {selectedSubject} - zaključna ocjena za drugo polugodište
              </div>

              <div className="flex justify-center gap-4 mb-6">
                {[1, 2, 3, 4, 5].map(grade => (
                  <button 
                    key={grade}
                    onClick={() => setFinalGrade(grade)}
                    className={`w-12 h-12 border ${finalGrade === grade ? 'border-blue-500 bg-blue-100' : 'border-gray-300'} text-lg font-medium hover:bg-gray-50`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-center gap-4 mb-8">
                {['Neocijenjen', 'Oslobođen', 'Odrađeno', 'Neodrađeno'].map(status => (
                  <button 
                    key={status}
                    onClick={() => setFinalGrade(status)}
                    className={`px-4 py-2 border ${finalGrade === status ? 'border-blue-500 bg-blue-100' : 'border-gray-300'} text-sm font-medium hover:bg-gray-50`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={handleSaveFinalGrade}
                  disabled={saving || !finalGrade}
                  className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-12 py-2 border border-red-400 disabled:opacity-50"
                >
                  {saving ? 'Spremanje...' : 'Unesi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl shadow-xl">
            <div className="bg-[#1a365d] text-white p-3 flex justify-between items-center">
              <h3 className="font-medium">Popravni rokovi / Ispiti</h3>
              <button onClick={() => setShowExamModal(false)} className="text-white hover:text-gray-300">✕</button>
            </div>
            
            <div className="p-6 bg-red-50 border border-red-300 m-4">
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm w-24 font-bold">Predmet:</label>
                <span className="text-sm">{selectedSubject}</span>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm w-24 font-bold">Ispit:</label>
                <select 
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="border border-gray-300 p-1 text-sm bg-white"
                >
                  <option value="Dopunski rad">Dopunski rad</option>
                  <option value="Popravni ispit">Popravni ispit</option>
                  <option value="Razlikovni ispit">Razlikovni ispit</option>
                </select>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm w-24 font-bold">Datum:</label>
                <input 
                  type="date" 
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="border border-gray-300 p-1 text-sm bg-white" 
                />
                
                <label className="text-sm ml-4 font-bold">Ocjena:</label>
                <select 
                  value={examGrade || ''}
                  onChange={(e) => setExamGrade(Number(e.target.value))}
                  className="border border-gray-300 p-1 text-sm bg-white"
                >
                  <option value="">-</option>
                  {[1, 2, 3, 4, 5].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold mb-1">Bilješka:</label>
                <textarea 
                  value={examNote}
                  onChange={(e) => setExamNote(e.target.value)}
                  className="w-full border border-gray-300 h-20 p-2 text-sm bg-white"
                  placeholder="Unesite bilješku..."
                ></textarea>
              </div>

              <div className="flex justify-center mt-6">
                <button 
                  onClick={handleSaveExam}
                  disabled={saving || !examGrade}
                  className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-8 py-2 border border-red-400 disabled:opacity-50"
                >
                  {saving ? 'Spremanje...' : 'Unesi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
