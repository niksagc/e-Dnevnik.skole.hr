'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock } from 'lucide-react';

export default function RazrediPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Svi');

  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('classes').select('*');
      if (data) setClasses(data);
      setLoading(false);
    };
    fetchClasses();
  }, []);

  const getRowColor = (role: string) => {
    switch (role) {
      case 'razrednik': return 'bg-[#d4edda] hover:bg-[#c3e6cb]'; // Zelena
      case 'zamjenik': return 'bg-[#f8d7da] hover:bg-[#f5c6cb]'; // Crvenkasta/Narančasta u originalu
      case 'nastavnik': return 'bg-[#f8d7da] hover:bg-[#f5c6cb]'; // Crvenkasta
      default: return 'bg-white hover:bg-gray-50';
    }
  };

  const filteredClasses = classes.filter(cls => {
    if (activeFilter === 'Svi') return true;
    return cls.name.startsWith(activeFilter.replace('.', ''));
  });

  return (
    <div className="flex flex-col items-center min-h-screen bg-white pt-10">
      <div className="w-full max-w-5xl px-4">
        
        {/* Header Info */}
        <div className="flex justify-between items-end mb-8 border-b border-blue-900 pb-2">
          <div className="text-xs text-gray-600">
            <p>CARNET Helpdesk - Podrška obrazovnom sustavu</p>
            <p>e-Dnevnik upute za nastavnike</p>
          </div>
          <div className="text-xs text-gray-600 text-right">
            <p>tel: +385 1 6661 500</p>
            <p>mail: helpdesk@skole.hr</p>
          </div>
        </div>

        <div className="flex justify-end items-center mb-4">
          <label className="text-sm font-bold mr-2">Školska godina:</label>
          <select className="border border-gray-300 p-1 text-sm">
            <option>2023./2024.</option>
            <option>2024./2025.</option>
          </select>
        </div>

        <h2 className="text-sm font-bold mb-2">Odaberite razrednu knjigu</h2>

        {/* Class List */}
        {loading ? (
          <div className="text-center p-4 text-gray-500">Učitavanje razreda...</div>
        ) : (
          <div className="border border-red-500 mb-8">
            {filteredClasses.map((cls) => (
              <div 
                key={cls.id}
                onClick={() => router.push(`/razredi/${cls.id}/imenik`)}
                className={`flex justify-between items-center p-3 cursor-pointer border-b border-gray-200 transition-colors text-sm ${getRowColor(cls.role)}`}
              >
                <div className="w-16 font-bold">{cls.name}</div>
                <div className="flex-1">{cls.teacher}</div>
                <div className="text-right">{cls.program}</div>
              </div>
            ))}
            {filteredClasses.length === 0 && (
              <div className="p-4 text-gray-500 bg-white">Nema pronađenih razreda za odabrani filter.</div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 border border-red-500 p-4 w-fit">
          <span className="text-sm">Razredi:</span>
          <div className="flex gap-1">
            {['Svi', '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', 'Grupe', 'OOS'].map((filter) => (
              <button 
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 text-sm text-white ${activeFilter === filter ? 'bg-[#5a6b9c]' : 'bg-[#4a5568] hover:bg-[#2d3748]'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
