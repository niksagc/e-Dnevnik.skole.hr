'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { LogOut, Plus } from 'lucide-react';

export default function SkolePage() {
  const router = useRouter();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolType, setNewSchoolType] = useState('Srednja škola');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            setUser({ id: userDoc.id, ...userDoc.data() });
          }
          
          const schoolsCollection = collection(db, 'schools');
          const schoolsSnapshot = await getDocs(query(schoolsCollection, orderBy('name')));
          const schoolsList = schoolsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setSchools(schoolsList);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${authUser.uid}`);
        } finally {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName) return;
    
    setLoading(true);
    try {
      const schoolData = { 
        name: newSchoolName,
        type: newSchoolType,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'schools'), schoolData);
      
      setSchools([...schools, { id: docRef.id, ...schoolData }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSchoolName('');
      setNewSchoolType('Srednja škola');
      setShowCreateModal(false);
      alert('Škola uspješno stvorena.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'schools');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 pt-20">
      <div className="w-full max-w-2xl px-4">
        {/* e-Dnevnik Header */}
        <div className="bg-[#1a365d] p-6 mb-8 flex justify-between items-center shadow-lg rounded-t-lg">
          <h1 className="text-white text-3xl font-semibold tracking-wide">
            e-<span className="text-green-400">D</span><span className="text-blue-400">n</span><span className="text-purple-400">e</span><span className="text-pink-400">v</span><span className="text-red-400">n</span><span className="text-yellow-400">i</span><span className="text-blue-300">k</span>
          </h1>
          <button onClick={handleLogout} className="flex items-center gap-1 text-white hover:text-red-300 transition-colors text-sm">
            <LogOut size={16} /> Odjava
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl text-gray-800 font-normal">Odaberite školu</h2>
          {user?.role === 'admin' && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> Nova škola
            </button>
          )}
        </div>

        {loading && schools.length === 0 ? (
          <div className="text-center p-8 bg-white border border-gray-200 shadow-sm rounded-lg text-gray-500">Učitavanje škola...</div>
        ) : (
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
            {schools.map((school) => (
              <div 
                key={school.id}
                onClick={() => {
                  localStorage.setItem('currentSchoolId', school.id);
                  router.push(`/skole/${school.id}/dashboard`);
                }}
                className="p-6 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors flex justify-between items-center group"
              >
                <div className="flex flex-col">
                  <span className="text-gray-800 font-medium text-lg">{school.name}</span>
                  <span className="text-gray-500 text-sm">{school.type}</span>
                </div>
                <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Odaberi &rarr;</span>
              </div>
            ))}
            {schools.length === 0 && (
              <div className="p-12 text-center text-gray-500 italic">
                Nema pronađenih škola. {user?.role === 'admin' ? 'Stvorite prvu školu klikom na gumb iznad.' : 'Kontaktirajte administratora.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create School Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Stvori novu školu</h3>
            <form onSubmit={handleCreateSchool}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Naziv škole</label>
                <input 
                  type="text" 
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="npr. Osnovna škola 'Ime'"
                  required 
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tip škole</label>
                <select 
                  value={newSchoolType}
                  onChange={(e) => setNewSchoolType(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="Osnovna škola">Osnovna škola</option>
                  <option value="Srednja škola">Srednja škola</option>
                  <option value="Gimnazija">Gimnazija</option>
                  <option value="Strukovna škola">Strukovna škola</option>
                  <option value="Umjetnička škola">Umjetnička škola</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                >
                  Odustani
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded transition-colors disabled:opacity-50"
                >
                  {loading ? 'Stvaranje...' : 'Stvori školu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
