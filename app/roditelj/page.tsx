'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, BookOpen, Calendar, Bell, User } from 'lucide-react';

export default function RoditeljPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        router.push('/');
        return;
      }
      
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'parent') {
        router.push('/');
        return;
      }
      
      setUser(parsedUser);

      if (parsedUser.student_id) {
        const { data } = await supabase
          .from('grades')
          .select('*')
          .eq('student_id', parsedUser.student_id)
          .order('date_created', { ascending: false });
          
        if (data) setGrades(data);
      }
      
      setLoading(false);
    };

    fetchUserData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  if (loading) return <div className="p-8 text-center">Učitavanje...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a365d] text-white flex justify-between items-center px-6 py-4 shadow-md">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold tracking-wide">
            e-<span className="text-green-400">D</span><span className="text-blue-400">n</span><span className="text-purple-400">e</span><span className="text-pink-400">v</span><span className="text-red-400">n</span><span className="text-yellow-400">i</span><span className="text-blue-300">k</span>
            <span className="text-sm font-normal ml-2 text-gray-300">za roditelje</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>{user.name || user.email}</span>
          <button onClick={handleLogout} className="flex items-center gap-1 hover:text-red-300 transition-colors">
            <LogOut size={16} /> Odjava
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6 mt-6">
        <h2 className="text-2xl text-gray-800 mb-6">Dobrodošli, {user.name || user.email}</h2>
        
        {/* Child Selector */}
        <div className="bg-white p-4 border border-gray-200 shadow-sm rounded-lg mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
            <User size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Odabrano dijete:</p>
            <p className="font-bold text-lg text-gray-800">Mario Kovač (1.a)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ocjene Card */}
          <div className="bg-white p-6 border border-gray-200 shadow-sm rounded-lg flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <BookOpen size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Ocjene djeteta</h3>
            <p className="text-sm text-gray-500">Pregledajte ocjene, bilješke i vladanje vašeg djeteta.</p>
          </div>

          {/* Izostanci Card */}
          <div className="bg-white p-6 border border-gray-200 shadow-sm rounded-lg flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Calendar size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Izostanci</h3>
            <p className="text-sm text-gray-500">Pratite prisutnost na nastavi i opravdajte izostanke.</p>
          </div>

          {/* Obavijesti Card */}
          <div className="bg-white p-6 border border-gray-200 shadow-sm rounded-lg flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
              <Bell size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Raspored ispita</h3>
            <p className="text-sm text-gray-500">Pregledajte kalendar najavljenih pisanih provjera.</p>
          </div>
        </div>

        {/* Recent Grades Preview */}
        <div className="mt-10 bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">Nedavno upisane ocjene</h3>
          </div>
          <div className="p-6">
            {grades.length > 0 ? (
              grades.map(grade => (
                <div key={grade.id} className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div>
                    <p className="font-bold text-gray-800">{grade.subject}</p>
                    <p className="text-sm text-gray-500">{grade.element}</p>
                    {grade.note && <p className="text-xs text-gray-400 mt-1 italic">"{grade.note}"</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{new Date(grade.date_created).toLocaleDateString('hr-HR')}</span>
                    <span className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-800 font-bold text-lg rounded">{grade.grade}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-gray-500">Nema upisanih ocjena.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
