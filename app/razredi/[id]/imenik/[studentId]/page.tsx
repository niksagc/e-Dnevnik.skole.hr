'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Shuffle } from 'lucide-react';
import { students, subjects, evaluationElements } from '@/lib/mock-data';

export default function StudentDetailsPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const student = students.find(s => s.id === studentId) || students[0];
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Student Header */}
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 bg-gradient-to-b from-orange-200 to-orange-400 rounded-t-full overflow-hidden flex items-end justify-center border border-gray-300">
          <div className="w-16 h-12 bg-gray-800 rounded-t-full"></div>
        </div>
        
        <div>
          <h2 className="text-2xl text-gray-800 mb-1">2. {student.name}</h2>
          <p className="text-sm text-gray-500 mb-4">{student.program}</p>
          
          <div className="flex items-center gap-2">
            <button className="bg-gray-400 text-white p-2 hover:bg-gray-500"><ArrowLeft size={16} /></button>
            <button className="bg-[#2c5282] text-white p-2 hover:bg-[#1a365d]"><ArrowRight size={16} /></button>
            <button className="flex items-center gap-2 bg-[#2c5282] hover:bg-[#1a365d] text-white px-4 py-2 text-sm">
              <Shuffle size={16} />
              Slučajan odabir
            </button>
            <button 
              className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-4 py-2 text-sm ml-4"
              onClick={() => setSelectedSubject(null)}
            >
              Odaberi predmet
            </button>
          </div>
        </div>
      </div>

      {/* Subject Selection or Grading View */}
      {!selectedSubject ? (
        <div className="border border-gray-200 bg-white max-w-md">
          {subjects.map((subject, idx) => (
            <div 
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 text-sm ${
                idx === 1 ? 'bg-red-50 border-red-200 text-red-800' : 'text-gray-700'
              }`}
            >
              {subject}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200">
          <div className="flex justify-between items-center bg-gray-50 p-3 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">{selectedSubject}</h3>
            <div className="flex gap-2">
              {['IX', 'X', 'XI', 'XII', 'I', 'II', 'III', 'IV', 'V', 'VI'].map(month => (
                <div key={month} className="w-8 text-center text-xs text-gray-500 font-medium">{month}</div>
              ))}
            </div>
          </div>

          {/* Evaluation Elements Grid */}
          {evaluationElements.map((element) => (
            <div key={element} className="flex justify-between items-center p-3 border-b border-gray-200">
              <div className="text-sm text-gray-700 w-1/3">{element}</div>
              <div className="flex gap-2 flex-1 justify-end">
                {/* Mock grid cells */}
                {Array.from({length: 10}).map((_, i) => (
                  <div 
                    key={i} 
                    onClick={() => setShowGradeModal(true)}
                    className="w-8 h-8 border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-blue-50"
                  >
                    {i === 4 && element === 'Hrvatski jezik i komunikacija' ? '5' : ''}
                    {i === 4 && element === 'Književnost i stvaralaštvo' ? '4' : ''}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Final Grade Row */}
          <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50">
            <div className="text-sm font-bold text-gray-700">ZAKLJUČENO</div>
            <div className="flex gap-2">
              <div className="w-16 h-8 border border-gray-300 bg-white"></div>
            </div>
          </div>

          <div className="p-3 text-right text-sm text-gray-600 border-b border-gray-200">
            Prosjek ocjena: <span className="font-bold">4,50</span> <span className="inline-block w-4 h-4 bg-black text-white rounded-full text-xs text-center leading-4 ml-1">i</span>
          </div>

          {/* Notes Section */}
          <div className="p-3 flex justify-between items-center bg-gray-50 border-b border-gray-200">
            <div className="font-bold text-sm">Bilješka</div>
            <div className="flex gap-4 text-sm font-bold">
              <button className="bg-[#2c5282] text-white px-3 py-1">Upis bilješke</button>
              <span>Ocjena</span>
              <span>Datum</span>
              <span>Datum upisa</span>
            </div>
          </div>
        </div>
      )}

      {/* Grade Entry Modal */}
      {showGradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl shadow-xl">
            <div className="bg-[#1a365d] text-white p-3 flex justify-between items-center">
              <h3 className="font-medium">{student.name}</h3>
              <button onClick={() => setShowGradeModal(false)} className="text-white hover:text-gray-300">✕</button>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6 text-sm">
                <p>Predmet: <span className="font-bold">{selectedSubject}</span></p>
                <p>Element vrednovanja: <span className="font-bold">kultura i mediji</span></p>
              </div>

              <div className="flex justify-center gap-4 mb-8">
                {[1, 2, 3, 4, 5].map(grade => (
                  <button 
                    key={grade}
                    className={`w-12 h-12 border ${grade === 5 ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300'} text-lg font-medium hover:bg-gray-50`}
                  >
                    {grade}
                  </button>
                ))}
              </div>

              <div className="border border-red-300 p-4 mb-4 bg-red-50">
                <div className="flex items-center gap-4 mb-4">
                  <label className="text-sm w-32">Datum ocjene:</label>
                  <input type="text" defaultValue="04. 01. 2024." className="border border-gray-300 p-1 text-sm w-32" />
                  
                  <label className="text-sm ml-8">Usmena/pisana provjera:</label>
                  <div className="flex border border-gray-300">
                    <button className="bg-[#2c5282] text-white px-4 py-1 text-sm">Da</button>
                    <button className="bg-white text-gray-700 px-4 py-1 text-sm">Ne</button>
                  </div>
                </div>
              </div>

              <div className="mb-6 border border-red-300 p-1">
                <label className="block text-sm mb-1">Bilješka:</label>
                <textarea className="w-full border border-gray-300 h-24 p-2 focus:outline-none bg-red-50"></textarea>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={() => setShowGradeModal(false)}
                  className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-8 py-2 border border-red-400"
                >
                  Unesi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
