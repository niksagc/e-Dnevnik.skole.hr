'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function AdministracijaPage() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('student');

  // New student form state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentProgram, setNewStudentProgram] = useState('');
  const [newStudentClassId, setNewStudentClassId] = useState('');

  // New class form state
  const [newClassName, setNewClassName] = useState('');
  const [newClassProgram, setNewClassProgram] = useState('');
  const [newClassHeadTeacher, setNewClassHeadTeacher] = useState('');

  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<any[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectTeacherId, setNewSubjectTeacherId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const loadLocalData = () => {
    const localSubjects = JSON.parse(localStorage.getItem('demo_subjects') || '[]');
    const localSubjectTeachers = JSON.parse(localStorage.getItem('demo_subject_teachers') || '[]');
    setSubjects(localSubjects);
    setSubjectTeachers(localSubjectTeachers);
  };

  useEffect(() => {
    loadLocalData();
  }, []);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName) return;
    
    const newSubject = { id: Date.now().toString(), name: newSubjectName };
    const updatedSubjects = [...subjects, newSubject];
    setSubjects(updatedSubjects);
    localStorage.setItem('demo_subjects', JSON.stringify(updatedSubjects));
    setNewSubjectName('');
    alert('Predmet uspješno dodan.');
  };

  const handleDeleteSubject = (id: string) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovaj predmet?')) return;
    const updatedSubjects = subjects.filter(s => s.id !== id);
    setSubjects(updatedSubjects);
    localStorage.setItem('demo_subjects', JSON.stringify(updatedSubjects));
  };

  const handleAssignTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !newSubjectTeacherId) return;
    
    const newAssignment = { 
      id: Date.now().toString(), 
      subject_id: selectedSubjectId, 
      teacher_id: newSubjectTeacherId 
    };
    const updatedAssignments = [...subjectTeachers, newAssignment];
    setSubjectTeachers(updatedAssignments);
    localStorage.setItem('demo_subject_teachers', JSON.stringify(updatedAssignments));
    setNewSubjectTeacherId('');
    setSelectedSubjectId('');
    alert('Nastavnik uspješno dodijeljen predmetu.');
  };

  const handleDeleteAssignment = (id: string) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovu dodjelu?')) return;
    const updatedAssignments = subjectTeachers.filter(a => a.id !== id);
    setSubjectTeachers(updatedAssignments);
    localStorage.setItem('demo_subject_teachers', JSON.stringify(updatedAssignments));
  };

  const adminLinks = [
    'Korisnici',
    'Administracija predmeta',
    'Dodijeli nastavnicima predmete',
    'Razredni odjeli i grupe',
    'Administracija učenika',
    'Prijenos učenika u viši razred',
    'Grupna zamjena',
    'Odaberi ravnatelja'
  ];

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*').order('role');
    if (data) setUsers(data);
    setLoading(false);
  };

  const fetchStudents = async () => {
    setLoading(true);
    const { data } = await supabase.from('students').select('*, classes(name)').order('name');
    if (data) setStudents(data);
    setLoading(false);
  };

  const fetchClasses = async () => {
    setLoading(true);
    const { data } = await supabase.from('classes').select('*').order('name');
    if (data) setClasses(data);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'Korisnici') {
      fetchUsers();
    } else if (activeTab === 'Administracija učenika') {
      fetchStudents();
      fetchClasses();
    } else if (activeTab === 'Razredni odjeli i grupe' || activeTab === 'Prijenos učenika u viši razred') {
      fetchClasses();
    }
  }, [activeTab]);

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
    const hashedPassword = await hashPassword(newPassword);
    
    const { data, error } = await supabase.from('users').insert([
      { email: newEmail, password: hashedPassword, role: newRole }
    ]).select();

    if (!error && data) {
      setUsers([...users, data[0]]);
      setNewEmail('');
      setNewPassword('');
    } else {
      alert('Greška pri dodavanju korisnika.');
    }
    setLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovog korisnika?')) return;
    
    setLoading(true);
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (!error) {
      setUsers(users.filter(u => u.id !== id));
    } else {
      alert('Greška pri brisanju korisnika.');
    }
    setLoading(false);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentClassId) return;
    
    setLoading(true);
    const { data, error } = await supabase.from('students').insert([
      { name: newStudentName, program: newStudentProgram, class_id: newStudentClassId }
    ]).select('*, classes(name)');

    if (!error && data) {
      setStudents([...students, data[0]]);
      setNewStudentName('');
      setNewStudentProgram('');
    } else {
      alert('Greška pri dodavanju učenika.');
    }
    setLoading(false);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovog učenika?')) return;
    
    setLoading(true);
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (!error) {
      setStudents(students.filter(s => s.id !== id));
    } else {
      alert('Greška pri brisanju učenika.');
    }
    setLoading(false);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;
    
    setLoading(true);
    // Hardcode school_id for demo purposes since we don't have a school selector
    const schoolId = '11111111-1111-1111-1111-111111111111';
    const { data, error } = await supabase.from('classes').insert([
      { name: newClassName, program: newClassProgram, head_teacher: newClassHeadTeacher, school_id: schoolId }
    ]).select();

    if (!error && data) {
      setClasses([...classes, data[0]]);
      setNewClassName('');
      setNewClassProgram('');
      setNewClassHeadTeacher('');
    } else {
      alert('Greška pri dodavanju razreda.');
    }
    setLoading(false);
  };

  const handleDeleteClass = async (id: string) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovaj razred?')) return;
    
    setLoading(true);
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (!error) {
      setClasses(classes.filter(c => c.id !== id));
    } else {
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
    const { data } = await supabase.from('students').select('*').eq('class_id', classId).order('name');
    if (data) setTransferStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransferStudents(transferSourceClassId);
  }, [transferSourceClassId]);

  const handleTransferStudents = async () => {
    if (!transferTargetClassId || selectedTransferStudents.length === 0) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('students')
      .update({ class_id: transferTargetClassId })
      .in('id', selectedTransferStudents);

    if (!error) {
      alert('Učenici su uspješno prebačeni.');
      setTransferSourceClassId('');
      setTransferTargetClassId('');
      setSelectedTransferStudents([]);
      setTransferStudents([]);
    } else {
      alert('Greška pri prebacivanju učenika.');
    }
    setLoading(false);
  };

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
          <h3 className="text-lg font-bold mb-4">Dodaj novog korisnika</h3>
          <form onSubmit={handleAddUser} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">E-mail (Korisničko ime)</label>
              <input 
                type="email" 
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full border border-gray-300 p-2" 
                required 
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Lozinka</label>
              <input 
                type="text" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 p-2" 
                required 
              />
            </div>
            <div className="w-48">
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
            <button 
              type="submit" 
              disabled={loading}
              className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-6 py-2 flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={18} /> Dodaj
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-700">
            <div className="col-span-2">E-mail</div>
            <div>Uloga</div>
            <div className="text-right">Akcije</div>
          </div>
          {loading && users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Učitavanje korisnika...</div>
          ) : (
            users.map(user => (
              <div key={user.id} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100 items-center">
                <div className="col-span-2 font-medium">{user.email}</div>
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
                <div className="text-right">
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
          <h3 className="text-lg font-bold mb-4">Dodaj novog učenika</h3>
          <form onSubmit={handleAddStudent} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Ime i prezime</label>
              <input 
                type="text" 
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="w-full border border-gray-300 p-2" 
                required 
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Program</label>
              <input 
                type="text" 
                value={newStudentProgram}
                onChange={(e) => setNewStudentProgram(e.target.value)}
                className="w-full border border-gray-300 p-2" 
              />
            </div>
            <div className="w-48">
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
            <button 
              type="submit" 
              disabled={loading}
              className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-6 py-2 flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={18} /> Dodaj
            </button>
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
          <h3 className="text-lg font-bold mb-4">Dodaj novi razred</h3>
          <form onSubmit={handleAddClass} className="flex gap-4 items-end">
            <div className="w-32">
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
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Program</label>
              <input 
                type="text" 
                value={newClassProgram}
                onChange={(e) => setNewClassProgram(e.target.value)}
                className="w-full border border-gray-300 p-2" 
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Razrednik</label>
              <input 
                type="text" 
                value={newClassHeadTeacher}
                onChange={(e) => setNewClassHeadTeacher(e.target.value)}
                className="w-full border border-gray-300 p-2" 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-6 py-2 flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={18} /> Dodaj
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-700">
            <div>Naziv</div>
            <div className="col-span-2">Razrednik</div>
            <div className="text-right">Akcije</div>
          </div>
          {loading && classes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Učitavanje razreda...</div>
          ) : (
            classes.map(c => (
              <div key={c.id} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100 items-center">
                <div className="font-medium">{c.name}</div>
                <div className="col-span-2">{c.head_teacher || '-'}</div>
                <div className="text-right">
                  <button 
                    onClick={() => handleDeleteClass(c.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Obriši razred"
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
                {users.filter(u => u.role === 'teacher').map(t => (
                  <option key={t.id} value={t.id}>{t.email}</option>
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
                  <div className="font-medium">{teacher?.email || 'Nepoznat nastavnik'}</div>
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
