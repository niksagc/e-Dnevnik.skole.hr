'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';

export default function RazrediPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const q = query(collection(db, 'classes'), where('school_id', '==', schoolId), orderBy('name'));
        const snapshot = await getDocs(q);
        setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'classes');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [schoolId]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push(`/skole/${schoolId}/dashboard`)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl text-gray-800">Razredi</h2>
      </div>
      
      {loading ? (
        <p className="text-gray-600">Učitavanje razreda...</p>
      ) : (
        <div className="grid gap-4">
          {classes.map(cls => (
            <div 
              key={cls.id} 
              onClick={() => router.push(`/razredi/${cls.id}/imenik`)}
              className="p-4 border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer shadow-sm"
            >
              <h3 className="font-bold text-lg">{cls.name}</h3>
              <p className="text-sm text-gray-600">{cls.program}</p>
            </div>
          ))}
          {classes.length === 0 && <p className="text-gray-600">Nema pronađenih razreda za ovu školu.</p>}
        </div>
      )}
    </div>
  );
}
