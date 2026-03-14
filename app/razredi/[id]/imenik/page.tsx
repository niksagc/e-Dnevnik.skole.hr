'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TriangleAlert, Clock, Shuffle } from 'lucide-react';

export default function ImenikPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('name');
      
      if (data) setStudents(data);
      setLoading(false);
    };
    fetchStudents();
  }, [classId]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl text-gray-800">Učenici u razredu</h2>
        <button className="flex items-center gap-2 bg-[#2c5282] hover:bg-[#1a365d] text-white px-4 py-2 text-sm transition-colors">
          <Shuffle size={16} />
          Slučajan odabir
        </button>
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

              {/* Warnings */}
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
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <div className="p-4 text-gray-500">Nema pronađenih učenika. Jeste li pokrenuli SQL skriptu u Supabaseu?</div>
          )}
        </div>
      )}
    </div>
  );
}
