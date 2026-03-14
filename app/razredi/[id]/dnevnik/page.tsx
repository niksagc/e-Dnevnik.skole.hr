'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Edit2, Users, Plus, X } from 'lucide-react';

interface WorkWeek {
  id: string;
  number: number;
  shift: 'ujutro' | 'popodne';
  startDate: string;
  endDate: string;
  days: WorkDay[];
}

interface WorkDay {
  date: string;
  name: string;
  isWorkingDay: boolean;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  number: number;
  subject: string;
  content: string;
  teacher: string;
}

export default function DnevnikRadaPage() {
  const [weeks, setWeeks] = useState<WorkWeek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WorkWeek | null>(null);
  const [selectedDay, setSelectedDay] = useState<WorkDay | null>(null);
  const [showAddWeekModal, setShowAddWeekModal] = useState(false);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);

  // New week state
  const [newWeekDate, setNewWeekDate] = useState(new Date().toISOString().split('T')[0]);
  const [newWeekShift, setNewWeekShift] = useState<'ujutro' | 'popodne'>('ujutro');

  // New lesson state
  const [lessonNumber, setLessonNumber] = useState(1);
  const [lessonSubject, setLessonSubject] = useState('Hrvatski jezik');
  const [lessonContent, setLessonContent] = useState('');

  useEffect(() => {
    // Load from localStorage or set initial mock
    const saved = localStorage.getItem('dnevnik_weeks');
    if (saved) {
      setWeeks(JSON.parse(saved));
    } else {
      const initialWeeks: WorkWeek[] = [
        {
          id: '1',
          number: 1,
          shift: 'ujutro',
          startDate: '2024-09-02',
          endDate: '2024-09-06',
          days: [
            { date: '2024-09-02', name: 'ponedjeljak', isWorkingDay: true, lessons: [] },
            { date: '2024-09-03', name: 'utorak', isWorkingDay: true, lessons: [] },
            { date: '2024-09-04', name: 'srijeda', isWorkingDay: true, lessons: [] },
            { date: '2024-09-05', name: 'četvrtak', isWorkingDay: true, lessons: [] },
            { date: '2024-09-06', name: 'petak', isWorkingDay: true, lessons: [] },
          ]
        }
      ];
      setWeeks(initialWeeks);
      localStorage.setItem('dnevnik_weeks', JSON.stringify(initialWeeks));
    }
  }, []);

  const saveWeeks = (newWeeks: WorkWeek[]) => {
    setWeeks(newWeeks);
    localStorage.setItem('dnevnik_weeks', JSON.stringify(newWeeks));
  };

  const handleAddWeek = () => {
    const date = new Date(newWeekDate);
    // Adjust to Monday
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    
    const newWeek: WorkWeek = {
      id: Date.now().toString(),
      number: weeks.length + 1,
      shift: newWeekShift,
      startDate: monday.toISOString().split('T')[0],
      endDate: new Date(monday.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      days: [
        { date: monday.toISOString().split('T')[0], name: 'ponedjeljak', isWorkingDay: true, lessons: [] },
        { date: new Date(monday.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], name: 'utorak', isWorkingDay: true, lessons: [] },
        { date: new Date(monday.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], name: 'srijeda', isWorkingDay: true, lessons: [] },
        { date: new Date(monday.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], name: 'četvrtak', isWorkingDay: true, lessons: [] },
        { date: new Date(monday.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], name: 'petak', isWorkingDay: true, lessons: [] },
      ]
    };

    saveWeeks([newWeek, ...weeks]);
    setShowAddWeekModal(false);
  };

  const handleAddLesson = () => {
    if (!selectedWeek || !selectedDay) return;

    const newLesson: Lesson = {
      id: Date.now().toString(),
      number: lessonNumber,
      subject: lessonSubject,
      content: lessonContent,
      teacher: 'M. Jurić'
    };

    const updatedWeeks = weeks.map(w => {
      if (w.id === selectedWeek.id) {
        return {
          ...w,
          days: w.days.map(d => {
            if (d.date === selectedDay.date) {
              return { ...d, lessons: [...d.lessons, newLesson].sort((a, b) => a.number - b.number) };
            }
            return d;
          })
        };
      }
      return w;
    });

    saveWeeks(updatedWeeks);
    
    // Update selected day reference
    const updatedWeek = updatedWeeks.find(w => w.id === selectedWeek.id);
    if (updatedWeek) {
      setSelectedWeek(updatedWeek);
      const updatedDay = updatedWeek.days.find(d => d.date === selectedDay.date);
      if (updatedDay) setSelectedDay(updatedDay);
    }
    
    setShowAddLessonModal(false);
    setLessonContent('');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl text-gray-800">Dnevnik rada</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddWeekModal(true)}
            className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-4 py-2 text-sm flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Dodaj tjedan
          </button>
        </div>
      </div>

      {/* Work Week List */}
      <div className="border border-gray-200 bg-white mb-8">
        {weeks.map(week => (
          <div key={week.id} className="flex border-b border-gray-200 last:border-0">
            <div className="w-1/3 p-4 border-r border-gray-200 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-sm">{week.number}. radni tjedan {week.shift}</div>
                  <div className="text-xs text-gray-500">{new Date(week.startDate).toLocaleDateString('hr-HR')} - {new Date(week.endDate).toLocaleDateString('hr-HR')}</div>
                </div>
                <Edit2 size={14} className="text-gray-400 cursor-pointer hover:text-blue-600" />
              </div>
              <div className="text-xs text-gray-500 mt-4">
                Sati održani: {week.days.reduce((acc, day) => acc + day.lessons.length, 0)}
              </div>
            </div>
            <div className="w-2/3 flex">
              {week.days.map(day => (
                <div 
                  key={day.date}
                  onClick={() => {
                    setSelectedWeek(week);
                    setSelectedDay(day);
                  }}
                  className={`flex-1 p-2 text-center border-r border-gray-200 cursor-pointer transition-colors ${
                    selectedDay?.date === day.date ? 'bg-blue-50 border-b-2 border-b-blue-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xs font-bold">{day.name} {day.lessons.length > 0 && `(${day.lessons.length})`}</div>
                  <div className="text-xs text-gray-500">{new Date(day.date).toLocaleDateString('hr-HR')}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lesson Entry Form */}
      {selectedWeek && selectedDay && (
        <div className="mt-8 border border-gray-200 bg-white">
          <div className="bg-gray-50 p-3 flex justify-between items-center border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="text-sm font-bold">{selectedWeek.number}. radni tjedan</div>
              <div className="text-sm">{selectedWeek.shift}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold">{new Date(selectedDay.date).toLocaleDateString('hr-HR')} - {selectedDay.name}</div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAddLessonModal(true)}
                className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-3 py-1 text-sm flex items-center gap-1"
              >
                <Plus size={14} /> Unesi radni sat
              </button>
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
              {selectedDay.lessons.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-gray-500">Nema unesenih sati za ovaj dan.</td>
                </tr>
              ) : (
                selectedDay.lessons.map(lesson => (
                  <tr key={lesson.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 text-center font-bold">{lesson.number}. sat</td>
                    <td className="p-3">
                      <div className="bg-red-50 border border-red-200 p-2">
                        <div className="font-bold text-[#1a365d] mb-1">[{lesson.number}] {lesson.subject} - {lesson.teacher}</div>
                        <div>{lesson.content}</div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Week Modal */}
      {showAddWeekModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md shadow-xl">
            <div className="bg-[#1a365d] text-white p-3 flex justify-between items-center">
              <h3 className="font-medium">Unos novog radnog tjedna</h3>
              <button onClick={() => setShowAddWeekModal(false)} className="text-white hover:text-gray-300"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <label className="w-24 text-sm font-bold">Tjedan:</label>
                <input 
                  type="date" 
                  value={newWeekDate}
                  onChange={(e) => setNewWeekDate(e.target.value)}
                  className="border border-gray-300 p-2 flex-1"
                />
              </div>
              <div className="flex items-center gap-4 mb-6">
                <label className="w-24 text-sm font-bold">Smjena:</label>
                <select 
                  value={newWeekShift}
                  onChange={(e) => setNewWeekShift(e.target.value as any)}
                  className="border border-gray-300 p-2 flex-1"
                >
                  <option value="ujutro">Ujutro</option>
                  <option value="popodne">Popodne</option>
                </select>
              </div>
              <div className="flex justify-center">
                <button 
                  onClick={handleAddWeek}
                  className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-6 py-2"
                >
                  Unesi novi radni tjedan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {showAddLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl shadow-xl">
            <div className="bg-[#1a365d] text-white p-3 flex justify-between items-center">
              <h3 className="font-medium">Dodavanje novog zapisa</h3>
              <button onClick={() => setShowAddLessonModal(false)} className="text-white hover:text-gray-300"><X size={20} /></button>
            </div>
            <div className="p-6 bg-red-50 m-4 border border-red-300">
              <div className="flex items-center gap-4 mb-4">
                <label className="w-32 text-sm font-bold text-right">Radni sat:</label>
                <select 
                  value={lessonNumber}
                  onChange={(e) => setLessonNumber(Number(e.target.value))}
                  className="border border-gray-300 p-1 w-20 bg-white"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-sm font-bold ml-4">Datum:</span>
                <span className="text-sm">{new Date(selectedDay?.date || '').toLocaleDateString('hr-HR')}</span>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <label className="w-32 text-sm font-bold text-right">Predmet:</label>
                <select 
                  value={lessonSubject}
                  onChange={(e) => setLessonSubject(e.target.value)}
                  className="border border-gray-300 p-1 flex-1 bg-white"
                >
                  <option value="Hrvatski jezik">Hrvatski jezik</option>
                  <option value="Matematika">Matematika</option>
                  <option value="Engleski jezik">Engleski jezik</option>
                  <option value="Priroda i društvo">Priroda i društvo</option>
                  <option value="Tjelesna i zdravstvena kultura">Tjelesna i zdravstvena kultura</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold mb-1">Nastavna jedinica:</label>
                <textarea 
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="w-full border border-gray-300 h-24 p-2 text-sm bg-white"
                ></textarea>
              </div>

              <div className="flex justify-center mt-6">
                <button 
                  onClick={handleAddLesson}
                  disabled={!lessonContent}
                  className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-8 py-2 disabled:opacity-50"
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
