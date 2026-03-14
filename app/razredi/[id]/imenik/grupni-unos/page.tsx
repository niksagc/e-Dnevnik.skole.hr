'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { subjects, evaluationElements } from '@/lib/mock-data';

export default function GrupniUnosPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0]);
  const [selectedElement, setSelectedElement] = useState<string>(evaluationElements[0]);
  const [isWritten, setIsWritten] = useState(false);
  const [gradeDate, setGradeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isWrittenExam, setIsWrittenExam] = useState(false);
  const [writtenExamDate, setWrittenExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [writtenExamNote, setWrittenExamNote] = useState('');
  const [entryType, setEntryType] = useState<'ocjene' | 'biljeske'>('ocjene');
  
  const [studentGrades, setStudentGrades] = useState<Record<string, { grade: number | null, note: string }>>({});
  const [globalNote, setGlobalNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('name');
      
      if (data) {
        setStudents(data);
        const initialGrades: Record<string, { grade: number | null, note: string }> = {};
        data.forEach(s => {
          initialGrades[s.id] = { grade: null, note: '' };
        });
        setStudentGrades(initialGrades);
      }
    };
    
    fetchStudents();
  }, [classId]);

  const handleGradeChange = (studentId: string, grade: number) => {
    setStudentGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        grade: prev[studentId].grade === grade ? null : grade
      }
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setStudentGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note
      }
    }));
  };

  const copyGlobalNote = () => {
    if (!globalNote) return;
    setStudentGrades(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        if (next[id].grade !== null) {
          next[id] = { ...next[id], note: globalNote };
        }
      });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    
    const gradesToInsert = Object.keys(studentGrades)
      .filter(id => entryType === 'ocjene' ? studentGrades[id].grade !== null : studentGrades[id].note !== '')
      .map(id => ({
        student_id: id,
        subject: selectedSubject,
        element: entryType === 'ocjene' ? selectedElement : 'Bilješka',
        grade: entryType === 'ocjene' ? studentGrades[id].grade : null,
        is_written: isWritten,
        note: studentGrades[id].note,
        date_created: new Date(gradeDate).toISOString()
      }));

    if (gradesToInsert.length > 0) {
      const { error } = await supabase.from('grades').insert(gradesToInsert);
      if (error) {
        alert('Greška pri spremanju.');
        setSaving(false);
        return;
      }
    }

    router.push(`/razredi/${classId}/imenik`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl text-gray-800">Grupni unos {entryType === 'ocjene' ? 'ocjena' : 'bilješki'} za predmet: {selectedSubject}</h2>
        <div className="flex bg-gray-100 p-1 rounded">
          <button 
            onClick={() => setEntryType('ocjene')}
            className={`px-4 py-1 text-sm rounded ${entryType === 'ocjene' ? 'bg-white shadow font-bold' : 'text-gray-600'}`}
          >
            Unos ocjena
          </button>
          <button 
            onClick={() => setEntryType('biljeske')}
            className={`px-4 py-1 text-sm rounded ${entryType === 'biljeske' ? 'bg-white shadow font-bold' : 'text-gray-600'}`}
          >
            Unos bilješki
          </button>
        </div>
      </div>
      
      <div className="bg-red-50 border border-red-300 p-4 mb-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm w-40">Usmena/pisana provjera:</label>
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
            
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm w-40">Datum ocjene:</label>
              <input 
                type="date" 
                value={gradeDate}
                onChange={(e) => setGradeDate(e.target.value)}
                className="border border-gray-300 p-1 text-sm w-40 bg-white" 
              />
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm w-40">Predmet:</label>
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="border border-gray-300 p-1 text-sm flex-1 bg-white"
              >
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            {entryType === 'ocjene' && (
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm w-40">Element vrednovanja:</label>
                <select 
                  value={selectedElement}
                  onChange={(e) => setSelectedElement(e.target.value)}
                  className="border border-gray-300 p-1 text-sm flex-1 bg-white"
                >
                  {evaluationElements.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            )}
            
            <div className="flex items-start gap-4">
              <label className="text-sm w-40 mt-1">Bilješka:</label>
              <div className="flex-1">
                <textarea 
                  value={globalNote}
                  onChange={(e) => setGlobalNote(e.target.value)}
                  className="w-full border border-gray-300 h-20 p-2 text-sm bg-white"
                ></textarea>
                <button 
                  onClick={copyGlobalNote}
                  className="bg-[#2c5282] text-white px-4 py-1 text-sm mt-2 float-right hover:bg-[#1a365d]"
                >
                  Kopiraj
                </button>
              </div>
            </div>
          </div>
          
          <div>
            {entryType === 'ocjene' && (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <label className="text-sm w-40">Provedena pisana zadaća:</label>
                  <div className="flex border border-gray-300">
                    <button 
                      onClick={() => setIsWrittenExam(true)}
                      className={`${isWrittenExam ? 'bg-[#2c5282] text-white' : 'bg-white text-gray-700'} px-4 py-1 text-sm`}
                    >Da</button>
                    <button 
                      onClick={() => setIsWrittenExam(false)}
                      className={`${!isWrittenExam ? 'bg-[#2c5282] text-white' : 'bg-white text-gray-700'} px-4 py-1 text-sm`}
                    >Ne</button>
                  </div>
                </div>
                
                {isWrittenExam && (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <label className="text-sm w-40">Datum pisane zadaće:</label>
                      <input 
                        type="date" 
                        value={writtenExamDate}
                        onChange={(e) => setWrittenExamDate(e.target.value)}
                        className="border border-gray-300 p-1 text-sm w-40 bg-white" 
                      />
                    </div>
                    <div className="flex items-start gap-4">
                      <label className="text-sm w-40 mt-1">Bilješka o zadaći:</label>
                      <textarea 
                        value={writtenExamNote}
                        onChange={(e) => setWrittenExamNote(e.target.value)}
                        className="flex-1 border border-gray-300 h-20 p-2 text-sm bg-white"
                      ></textarea>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border border-gray-200 bg-white mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="p-2 text-left font-normal w-1/4">Učenik</th>
              {entryType === 'ocjene' && <th className="p-2 text-center font-normal w-1/3">Ocjena</th>}
              <th className="p-2 text-left font-normal">Bilješka</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr key={student.id} className="border-b border-gray-200">
                <td className="p-2 border-r border-gray-200">{idx + 1}. {student.name}</td>
                {entryType === 'ocjene' && (
                  <td className="p-2 border-r border-gray-200">
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map(g => (
                        <button
                          key={g}
                          onClick={() => handleGradeChange(student.id, g)}
                          className={`w-8 h-8 border ${studentGrades[student.id]?.grade === g ? 'bg-[#1a365d] text-white border-[#1a365d]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
                <td className="p-2">
                  <input 
                    type="text" 
                    value={studentGrades[student.id]?.note || ''}
                    onChange={(e) => handleNoteChange(student.id, e.target.value)}
                    className="w-full border border-gray-300 p-1 text-sm bg-white"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-8 py-2 border border-red-400 disabled:opacity-50 text-lg font-medium"
        >
          {saving ? 'Spremanje...' : 'Unesi'}
        </button>
      </div>
    </div>
  );
}
