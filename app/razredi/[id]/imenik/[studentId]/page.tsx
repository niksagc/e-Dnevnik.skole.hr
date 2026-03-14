'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStudentData = async () => {
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (studentData) setStudent(studentData);

      const { data: allStudentsData } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', classId);
        
      if (allStudentsData) setAllStudents(allStudentsData);

      const { data: gradesData } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', studentId);
        
      if (gradesData) setGrades(gradesData);
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
    
    if (editingGradeId) {
      const { data, error } = await supabase
        .from('grades')
        .update({
          grade: newGrade,
          is_written: isWritten,
          note: note
        })
        .eq('id', editingGradeId)
        .select();
        
      if (!error && data) {
        setGrades(grades.map(g => g.id === editingGradeId ? data[0] : g));
        setShowGradeModal(false);
      } else {
        alert('Greška pri ažuriranju ocjene.');
      }
    } else {
      const gradeData = {
        student_id: studentId,
        subject: selectedSubject,
        element: selectedElement,
        grade: newGrade,
        is_written: isWritten,
        note: note,
        date_created: new Date().toISOString()
      };

      const { data, error } = await supabase.from('grades').insert([gradeData]).select();
      
      if (!error && data) {
        setGrades([...grades, data[0]]);
        setShowGradeModal(false);
      } else {
        alert('Greška pri spremanju ocjene.');
      }
    }
    setSaving(false);
  };

  const handleDeleteGrade = async () => {
    if (!editingGradeId) return;
    if (!window.confirm('Jeste li sigurni da želite obrisati ovu ocjenu?')) return;
    
    setSaving(true);
    const { error } = await supabase.from('grades').delete().eq('id', editingGradeId);
    if (!error) {
      setGrades(grades.filter(g => g.id !== editingGradeId));
      setShowGradeModal(false);
    } else {
      alert('Greška pri brisanju ocjene.');
    }
    setSaving(false);
  };

  const openGradeModal = (element: string) => {
    setSelectedElement(element);
    setEditingGradeId(null);
    setNewGrade(null);
    setIsWritten(false);
    setNote('');
    setShowGradeModal(true);
  };

  const openEditGradeModal = (grade: any) => {
    setSelectedElement(grade.element);
    setEditingGradeId(grade.id);
    setNewGrade(grade.grade);
    setIsWritten(grade.is_written);
    setNote(grade.note || '');
    setShowGradeModal(true);
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
            <div className="flex gap-2">
              <div className="w-16 h-8 border border-gray-300 bg-white"></div>
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
          <div className="p-3">
            {grades.filter(g => g.subject === selectedSubject && g.note).map(g => (
              <div key={g.id} className="text-sm border-b border-gray-100 py-2 flex justify-between">
                <div className="w-2/3">{g.note}</div>
                <div className="w-1/3 text-right text-gray-500">
                  {g.grade} | {new Date(g.date_created).toLocaleDateString('hr-HR')}
                </div>
              </div>
            ))}
          </div>
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
                  <input type="text" value={new Date().toLocaleDateString('hr-HR')} readOnly className="border border-gray-300 p-1 text-sm w-32 bg-gray-100" />
                  
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
    </div>
  );
}
