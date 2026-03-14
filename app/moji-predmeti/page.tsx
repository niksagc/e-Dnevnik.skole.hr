'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, BookOpen, Layers } from 'lucide-react';

export default function MojiPredmetiPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mySubjects, setMySubjects] = useState<any[]>([]);
  const [evaluationElements, setEvaluationElements] = useState<any[]>([]);
  const [newElementName, setNewElementName] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        router.push('/');
        return;
      }
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      const localUserNames = JSON.parse(localStorage.getItem('demo_user_names') || '{}');
      const currentUserName = localUserNames[parsedUser.id] || parsedUser.email;

      const allSubjects = JSON.parse(localStorage.getItem('demo_subjects') || '[]');
      const subjectTeachers = JSON.parse(localStorage.getItem('demo_subject_teachers') || '[]');
      
      // Find subjects assigned to this teacher
      const assignedSubjectIds = subjectTeachers
        .filter((st: any) => st.teacherName === currentUserName || st.teacherName === parsedUser.email)
        .map((st: any) => st.subjectId);
      
      const filteredSubjects = allSubjects.filter((s: any) => assignedSubjectIds.includes(s.id));
      setMySubjects(filteredSubjects);

      const storedElements = JSON.parse(localStorage.getItem('demo_evaluation_elements') || '[]');
      setEvaluationElements(storedElements);
    };
    init();
  }, [router]);

  const handleAddElement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !newElementName) return;

    const newElement = {
      id: Date.now().toString(),
      subjectId: selectedSubjectId,
      name: newElementName,
      teacherId: user.id
    };

    const updated = [...evaluationElements, newElement];
    setEvaluationElements(updated);
    localStorage.setItem('demo_evaluation_elements', JSON.stringify(updated));
    setNewElementName('');
    alert('Element vrednovanja dodan.');
  };

  const handleDeleteElement = (id: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj element?')) return;
    const updated = evaluationElements.filter(e => e.id !== id);
    setEvaluationElements(updated);
    localStorage.setItem('demo_evaluation_elements', JSON.stringify(updated));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
        <BookOpen className="text-blue-600" />
        Moji predmeti i elementi vrednovanja
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layers size={20} className="text-gray-500" />
            Moji predmeti
          </h2>
          <div className="space-y-2">
            {mySubjects.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Niste dodijeljeni niti jednom predmetu.</p>
            ) : (
              mySubjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubjectId(subject.id)}
                  className={`w-full text-left p-3 border transition-colors ${
                    selectedSubjectId === subject.id 
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {subject.name}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedSubjectId ? (
            <>
              <h2 className="text-lg font-semibold mb-4">
                Elementi vrednovanja za: {mySubjects.find(s => s.id === selectedSubjectId)?.name}
              </h2>
              
              <form onSubmit={handleAddElement} className="mb-6 flex gap-2">
                <input
                  type="text"
                  value={newElementName}
                  onChange={(e) => setNewElementName(e.target.value)}
                  placeholder="Novi element (npr. Usmena provjera)"
                  className="flex-1 border border-gray-300 p-2 text-sm"
                  required
                />
                <button 
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 text-sm flex items-center gap-1 hover:bg-blue-700"
                >
                  <Plus size={16} /> Dodaj
                </button>
              </form>

              <div className="bg-white border border-gray-200">
                {evaluationElements.filter(e => e.subjectId === selectedSubjectId).length === 0 ? (
                  <p className="p-4 text-sm text-gray-500 italic text-center">Nema definiranih elemenata vrednovanja.</p>
                ) : (
                  evaluationElements.filter(e => e.subjectId === selectedSubjectId).map(element => (
                    <div key={element.id} className="flex justify-between items-center p-3 border-b border-gray-100 last:border-0">
                      <span className="text-sm">{element.name}</span>
                      <button 
                        onClick={() => handleDeleteElement(element.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg p-12">
              <BookOpen size={48} className="mb-4 opacity-20" />
              <p>Odaberite predmet s lijeve strane za upravljanje elementima.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
