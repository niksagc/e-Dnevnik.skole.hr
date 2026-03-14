'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function MojiPredmetiPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mySubjects, setMySubjects] = useState<any[]>([]);
  const [evaluationElements, setEvaluationElements] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [newElementName, setNewElementName] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Load subjects assigned to this teacher
    const allSubjects = JSON.parse(localStorage.getItem('demo_subjects') || '[]');
    const allAssignments = JSON.parse(localStorage.getItem('demo_subject_teachers') || '[]');
    
    const teacherAssignments = allAssignments.filter((a: any) => a.teacher_id === parsedUser.id);
    const teacherSubjects = teacherAssignments.map((a: any) => 
      allSubjects.find((s: any) => s.id === a.subject_id)
    ).filter(Boolean);
    
    setMySubjects(teacherSubjects);
    
    // Load evaluation elements
    const allElements = JSON.parse(localStorage.getItem('demo_evaluation_elements') || '[]');
    setEvaluationElements(allElements);
    
    if (teacherSubjects.length > 0) {
      setSelectedSubjectId(teacherSubjects[0].id);
    }
  }, [router]);

  const handleAddElement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newElementName || !selectedSubjectId) return;
    
    const newElement = { 
      id: Date.now().toString(), 
      subject_id: selectedSubjectId, 
      teacher_id: user.id,
      name: newElementName 
    };
    
    const updatedElements = [...evaluationElements, newElement];
    setEvaluationElements(updatedElements);
    localStorage.setItem('demo_evaluation_elements', JSON.stringify(updatedElements));
    setNewElementName('');
  };

  const handleDeleteElement = (id: string) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovaj element vrednovanja?')) return;
    const updatedElements = evaluationElements.filter(e => e.id !== id);
    setEvaluationElements(updatedElements);
    localStorage.setItem('demo_evaluation_elements', JSON.stringify(updatedElements));
  };

  const currentSubjectElements = evaluationElements.filter(
    e => e.subject_id === selectedSubjectId && e.teacher_id === user?.id
  );

  return (
    <div className="max-w-4xl mx-auto pt-10 px-4">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/razredi')} className="p-2 bg-gray-200 hover:bg-gray-300 rounded">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl text-gray-800">Moji predmeti i elementi vrednovanja</h2>
      </div>

      {mySubjects.length === 0 ? (
        <div className="bg-white p-8 border border-gray-200 shadow-sm text-center text-gray-500">
          Nemate dodijeljenih predmeta. Obratite se administratoru.
        </div>
      ) : (
        <>
          <div className="bg-white p-6 border border-gray-200 shadow-sm mb-8">
            <h3 className="text-lg font-bold mb-4">Dodaj element vrednovanja</h3>
            <form onSubmit={handleAddElement} className="flex gap-4 items-end">
              <div className="w-64">
                <label className="block text-sm text-gray-600 mb-1">Predmet</label>
                <select 
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full border border-gray-300 p-2 bg-white"
                  required
                >
                  {mySubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Naziv elementa (npr. Zalaganje, Pismeni ispit)</label>
                <input 
                  type="text" 
                  value={newElementName}
                  onChange={(e) => setNewElementName(e.target.value)}
                  className="w-full border border-gray-300 p-2" 
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
              <div>Element vrednovanja</div>
              <div className="text-right">Akcije</div>
            </div>
            {currentSubjectElements.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nema dodanih elemenata vrednovanja za odabrani predmet.</div>
            ) : (
              currentSubjectElements.map(element => (
                <div key={element.id} className="grid grid-cols-2 gap-4 p-4 border-b border-gray-100 items-center">
                  <div className="font-medium">{element.name}</div>
                  <div className="text-right">
                    <button 
                      onClick={() => handleDeleteElement(element.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="Obriši element"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
