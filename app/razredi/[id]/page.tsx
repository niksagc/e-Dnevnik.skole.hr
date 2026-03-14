'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Users } from 'lucide-react';

export default function RazrediPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push(`/skole/${schoolId}/dashboard`)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl text-gray-800">Razredi</h2>
      </div>
      <p className="text-gray-600">Ovdje će biti popis razreda za odabranu školu.</p>
    </div>
  );
}
