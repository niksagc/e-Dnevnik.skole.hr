'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, getDocs, getDoc, doc, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { BookOpen, Calendar, Bell, ClipboardList } from 'lucide-react';
import Link from 'next/link';

export default function UcenikPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() };
            setUser(userData);

            // Fetch recent grades
            const q = query(collection(db, 'grades'), orderBy('date_created', 'desc'), limit(5));
            const querySnapshot = await getDocs(q);
            setGrades(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) return <div className="p-8 text-center">Učitavanje...</div>;
  if (!user) return null;

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-800">Dobrodošli, {user.full_name || user.email}</h2>
          <p className="text-gray-500 mt-2">Ovdje možete pratiti svoj napredak, ocjene i obavijesti.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ocjene Card */}
          <Link href="/ucenik/imenik" className="bg-white p-8 border border-gray-200 shadow-sm rounded-2xl flex flex-col items-center justify-center text-center hover:shadow-md hover:border-blue-200 transition-all group">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Moje ocjene</h3>
            <p className="text-sm text-gray-500">Pregledajte svoje ocjene iz svih predmeta po mjesecima.</p>
          </Link>

          {/* Izostanci Card */}
          <Link href="/ucenik/izostanci" className="bg-white p-8 border border-gray-200 shadow-sm rounded-2xl flex flex-col items-center justify-center text-center hover:shadow-md hover:border-red-200 transition-all group">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Calendar size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Izostanci</h3>
            <p className="text-sm text-gray-500">Pregledajte svoje opravdane i neopravdane izostanke.</p>
          </Link>

          {/* Obavijesti Card */}
          <Link href="/ucenik/ispiti" className="bg-white p-8 border border-gray-200 shadow-sm rounded-2xl flex flex-col items-center justify-center text-center hover:shadow-md hover:border-yellow-200 transition-all group">
            <div className="w-20 h-20 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Bell size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Ispiti i obavijesti</h3>
            <p className="text-sm text-gray-500">Provjerite raspored nadolazećih pisanih provjera.</p>
          </Link>
        </div>

        {/* Recent Grades Preview */}
        <div className="mt-12 bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Nedavno upisane ocjene</h3>
            <Link href="/ucenik/imenik" className="text-sm text-blue-600 font-bold hover:underline">Vidi sve</Link>
          </div>
          <div className="p-8">
            {grades.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {grades.map(grade => (
                  <div key={grade.id} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{grade.subject_name || grade.subject}</p>
                      <p className="text-sm text-gray-500">{grade.element}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-gray-400 font-medium">{new Date(grade.date_created).toLocaleDateString('hr-HR')}</span>
                      <span className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-700 font-black text-xl rounded-xl border border-blue-100">
                        {grade.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 italic">
                <ClipboardList size={48} className="mx-auto mb-4 opacity-20" />
                <p>Nemate još upisanih ocjena.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
