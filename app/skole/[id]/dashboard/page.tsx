'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Users, BookOpen, Settings, GraduationCap, LayoutDashboard, ArrowLeft } from 'lucide-react';

export default function SchoolDashboard() {
  const router = useRouter();
  const params = useParams();
  const schoolId = params.id as string;
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      try {
        const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
        if (schoolDoc.exists()) {
          setSchool({ id: schoolDoc.id, ...schoolDoc.data() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `schools/${schoolId}`);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [schoolId]);

  const cards = [
    {
      title: 'Razredi',
      description: 'Pregled razrednih knjiga, imenika i dnevnika rada.',
      icon: <GraduationCap size={32} className="text-blue-600" />,
      link: `/razredi`, // We can later scope this to /skole/${schoolId}/razredi
      color: 'bg-blue-50 border-blue-200'
    },
    {
      title: 'Korisnici',
      description: 'Upravljanje nastavnicima, učenicima i roditeljima.',
      icon: <Users size={32} className="text-green-600" />,
      link: `/razredi/1/administracija?tab=Korisnici`,
      color: 'bg-green-50 border-green-200'
    },
    {
      title: 'Predmeti',
      description: 'Administracija predmeta i dodjela nastavnika.',
      icon: <BookOpen size={32} className="text-purple-600" />,
      link: `/razredi/1/administracija?tab=Administracija predmeta`,
      color: 'bg-purple-50 border-purple-200'
    },
    {
      title: 'Administracija škole',
      description: 'Postavke škole, školske godine i razredni odjeli.',
      icon: <Settings size={32} className="text-orange-600" />,
      link: `/razredi/1/administracija`,
      color: 'bg-orange-50 border-orange-200'
    }
  ];

  if (loading) return <div className="p-8 text-center">Učitavanje podataka o školi...</div>;
  if (!school) return <div className="p-8 text-center text-red-500">Škola nije pronađena.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.push('/skole')}
            className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{school.name}</h1>
            <p className="text-gray-500 flex items-center gap-2">
              <LayoutDashboard size={16} /> Dashboard škole
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => (
            <div 
              key={index}
              onClick={() => router.push(card.link)}
              className={`p-6 rounded-xl border-2 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 ${card.color}`}
            >
              <div className="mb-4">{card.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{card.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>

        {/* Stats or Recent Activity Section */}
        <div className="mt-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Brzi pregled</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Ukupno učenika</p>
              <p className="text-3xl font-bold text-blue-600">--</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Ukupno nastavnika</p>
              <p className="text-3xl font-bold text-green-600">--</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Aktivni razredi</p>
              <p className="text-3xl font-bold text-purple-600">--</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
