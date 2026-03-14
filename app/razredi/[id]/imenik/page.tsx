'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TriangleAlert, Clock, Shuffle, Edit2 } from 'lucide-react';

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

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const fetchStudentsAndParents = async () => {
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('name');
      
      if (studentsData) setStudents(studentsData);

      const { data: parentsData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'parent');
      
      if (parentsData) setParents(parentsData);

      setLoading(false);
    };
    fetchStudentsAndParents();
  }, [classId]);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setLoading(true);
    const { error: studentError } = await supabase
      .from('students')
      .update({
        name: editingStudent.name,
        program: editingStudent.program
      })
      .eq('id', editingStudent.id);

    if (selectedParentId) {
      // First remove this student from any other parent
      await supabase.from('users').update({ student_id: null }).eq('student_id', editingStudent.id);
      // Then assign to new parent
      await supabase.from('users').update({ student_id: editingStudent.id }).eq('id', selectedParentId);
    } else {
      // Remove parent assignment
      await supabase.from('users').update({ student_id: null }).eq('student_id', editingStudent.id);
    }

    if (!studentError) {
      setStudents(students.map(s => s.id === editingStudent.id ? editingStudent : s));
      setEditingStudent(null);
      alert('Podaci uspješno spremljeni.');
    } else {
      alert('Greška pri spremanju podataka.');
    }
    setLoading(false);
  };

  const handleEditClick = async (e: React.MouseEvent, student: any) => {
    e.stopPropagation();
    setEditingStudent({ ...student });
    
    // Find current parent
    const { data } = await supabase.from('users').select('id').eq('student_id', student.id).single();
    if (data) {
      setSelectedParentId(data.id);
    } else {
      setSelectedParentId('');
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
                  <button 
                    onClick={(e) => handleEditClick(e, student)}
                    className="ml-2 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Uredi podatke"
                  >
                    <Edit2 size={16} />
                  </button>
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
    </div>
  );
}
