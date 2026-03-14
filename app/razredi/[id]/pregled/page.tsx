'use client';

import { Users, BookOpen, Calendar, FileText, BarChart2, Settings, Search, Menu } from 'lucide-react';

export default function PregledRadaPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-xl text-gray-800 mb-6">Pregled rada</h2>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Raspored pisanih zadaća</h3>
          <p className="text-sm text-gray-600 mb-4">
            Tablični prikaz pisanih zadaća, tehničkih i drugih programa i ostalih učeničkih radova.
          </p>
          <button className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-4 py-2 text-sm transition-colors">
            Otvori raspored
          </button>
        </div>

        <div className="border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Lektira</h3>
          <p className="text-sm text-gray-600 mb-4">
            Evidencija pročitane lektire i književnih djela po učenicima i predmetima.
          </p>
          <button className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-4 py-2 text-sm transition-colors">
            Unesi lektiru
          </button>
        </div>
      </div>
    </div>
  );
}
