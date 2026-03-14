'use client';

import { useRouter } from 'next/navigation';
import { schools } from '@/lib/mock-data';
import { LogOut } from 'lucide-react';

export default function SkolePage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-white pt-20">
      <div className="w-full max-w-2xl">
        {/* e-Dnevnik Header */}
        <div className="bg-[#1a365d] p-4 mb-8 flex justify-between items-center">
          <h1 className="text-white text-3xl font-semibold tracking-wide">
            e-<span className="text-green-400">D</span><span className="text-blue-400">n</span><span className="text-purple-400">e</span><span className="text-pink-400">v</span><span className="text-red-400">n</span><span className="text-yellow-400">i</span><span className="text-blue-300">k</span>
          </h1>
          <button onClick={handleLogout} className="flex items-center gap-1 text-white hover:text-red-300 transition-colors text-sm">
            <LogOut size={16} /> Odjava
          </button>
        </div>

        <h2 className="text-2xl text-gray-800 mb-6 font-normal">Odaberite školu</h2>

        <div className="border border-gray-200">
          {schools.map((school, index) => (
            <div 
              key={school.id}
              onClick={() => router.push('/razredi')}
              className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-red-50 transition-colors ${
                index === 1 ? 'bg-red-100 border-red-300' : 'bg-white'
              }`}
            >
              <span className="text-gray-800">{school.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
