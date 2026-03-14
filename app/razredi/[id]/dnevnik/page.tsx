'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, Edit2, Users } from 'lucide-react';

export default function DnevnikRadaPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button className="bg-[#2c5282] text-white px-4 py-2 text-sm flex items-center gap-2">
            <span className="font-bold">+</span> Dodaj tjedan
          </button>
        </div>
      </div>

      {/* Work Week List */}
      <div className="border border-gray-200 bg-white mb-8">
        {/* Week 2 */}
        <div className="flex border-b border-gray-200">
          <div className="w-1/3 p-4 border-r border-gray-200 bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-sm">2. radni tjedan ujutro</div>
                <div className="text-xs text-gray-500">Vanja Ivanović / Vanja Ivanović</div>
              </div>
              <Edit2 size={14} className="text-gray-400 cursor-pointer" />
            </div>
            <div className="text-xs text-gray-500 mt-4">
              Sati održani: 1 neodržani: 0 ukupno: 1
            </div>
          </div>
          <div className="w-2/3 flex">
            <div className="flex-1 p-2 text-center border-r border-gray-200 hover:bg-gray-50 cursor-pointer">
              <div className="text-xs font-bold">ponedjeljak (6)</div>
              <div className="text-xs text-gray-500">06.11.2017.</div>
            </div>
            <div className="flex-1 p-2 text-center hover:bg-gray-50 cursor-pointer">
              <div className="text-xs font-bold">utorak (7)</div>
              <div className="text-xs text-gray-500">07.11.2017.</div>
            </div>
          </div>
        </div>

        {/* Week 1 */}
        <div className="flex">
          <div className="w-1/3 p-4 border-r border-gray-200 bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-sm">1. radni tjedan ujutro</div>
                <div className="text-xs text-gray-500">Vanja Ivanović / Vanja Ivanović</div>
              </div>
              <Edit2 size={14} className="text-gray-400 cursor-pointer" />
            </div>
            <div className="text-xs text-gray-500 mt-4">
              Sati održani: 1 neodržani: 0 ukupno: 1
            </div>
          </div>
          <div className="w-2/3 flex">
            <div className="flex-1 p-2 text-center border-r border-gray-200 hover:bg-gray-50 cursor-pointer">
              <div className="text-xs font-bold">ponedjeljak (1)</div>
              <div className="text-xs text-gray-500">30.10.2017.</div>
            </div>
            <div className="flex-1 p-2 text-center hover:bg-gray-50 cursor-pointer">
              <div className="text-xs font-bold">utorak (2)</div>
              <div className="text-xs text-gray-500">31.10.2017.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Entry Form (Mocked as if a day is selected) */}
      <div className="mt-12 border border-gray-200 bg-white">
        <div className="bg-gray-50 p-3 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="text-sm font-bold">1. radni tjedan</div>
            <div className="text-sm">ujutro</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold">1. radni dan 11.09.2017 - ponedjeljak</div>
            <div className="text-xs text-gray-500">Dežurni učenici: Andro Anjikov i Vedran Horgas</div>
          </div>
          <div className="flex gap-2">
            <button className="bg-[#2c5282] text-white p-1"><CalendarIcon size={16} /></button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-16 p-2 text-center font-normal text-gray-600">Sat</th>
              <th className="p-2 text-left font-normal text-gray-600">Sadržaj nastavnog sata</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="p-3 text-center font-bold">0. sat</td>
              <td className="p-3">
                <div className="flex justify-end"><Edit2 size={14} className="text-gray-400 cursor-pointer" /></div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 bg-red-50">
              <td className="p-3 text-center font-bold">1. sat</td>
              <td className="p-3 border border-red-300">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold">[1] Hrvatski jezik 1. r - M. Jurić</div>
                    <div>Test</div>
                  </div>
                  <Edit2 size={14} className="text-gray-400 cursor-pointer" />
                </div>
                <div className="mt-2 flex gap-2">
                  <button className="bg-[#2c5282] text-white px-3 py-1 text-xs">Uredi</button>
                  <button className="bg-red-500 text-white px-3 py-1 text-xs">Obriši</button>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 bg-red-50">
              <td className="p-3 text-center font-bold">2. sat</td>
              <td className="p-3 border border-red-300">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold">[1] Hrvatski jezik 2. r - M. Jurić</div>
                    <div>Test</div>
                  </div>
                  <Edit2 size={14} className="text-gray-400 cursor-pointer" />
                </div>
                <div className="mt-2 flex gap-2">
                  <button className="bg-[#2c5282] text-white px-3 py-1 text-xs">Uredi</button>
                  <button className="bg-red-500 text-white px-3 py-1 text-xs">Obriši</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
