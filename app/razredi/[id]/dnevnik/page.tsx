'use client';

import { useState, useEffect } from 'react';
import { checkPermissions } from '@/lib/permissions';
import { Calendar as CalendarIcon, Edit2, Users, Plus, X, Trash2 } from 'lucide-react';
import { db, auth, handleFirestoreError } from '@/lib/firebase';
import { collection, query, getDocs, getDoc, doc, addDoc, deleteDoc, updateDoc, orderBy, where, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

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
  group: string;
  note: string;
  isBlock?: boolean;
  blockId?: string;
}

export default function DnevnikRadaPage() {
  const [weeks, setWeeks] = useState<WorkWeek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WorkWeek | null>(null);
  const [selectedDay, setSelectedDay] = useState<WorkDay | null>(null);
  const [showAddWeekModal, setShowAddWeekModal] = useState(false);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);

  // New week state
  const [newWeekDate, setNewWeekDate] = useState(new Date().toISOString().split('T')[0]);
  const [newWeekShift, setNewWeekShift] = useState<'ujutro' | 'popodne'>('ujutro');

  // New lesson state
  const [lessonNumber, setLessonNumber] = useState(1);
  const [lessonSubject, setLessonSubject] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonGroup, setLessonGroup] = useState('Cijeli razred');
  const [lessonBlockHours, setLessonBlockHours] = useState(1);
  const [lessonNote, setLessonNote] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() };
            setUser(userData);
            
            // Load teacher subjects
            const localSubjectTeachers = JSON.parse(localStorage.getItem('demo_subject_teachers') || '[]');
            const localSubjects = JSON.parse(localStorage.getItem('demo_subjects') || '[]');
            const assignedSubjectIds = localSubjectTeachers
              .filter((st: any) => st.teacher_id === userData.id)
              .map((st: any) => st.subject_id);
            
            const assignedSubjects = localSubjects.filter((s: any) => assignedSubjectIds.includes(s.id));
            setTeacherSubjects(assignedSubjects);
            if (assignedSubjects.length > 0) {
              setLessonSubject(assignedSubjects[0].name);
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${authUser.uid}`);
        }
      }

      // Load from Firestore
      try {
        const q = query(collection(db, 'dnevnik_weeks'), orderBy('number', 'desc'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkWeek));
          setWeeks(data);
        } else {
          // Initial mock if empty
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
          // Optionally save initial mock to Firestore
          // await setDoc(doc(db, 'dnevnik_weeks', '1'), initialWeeks[0]);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'dnevnik_weeks');
      }
    });
    return () => unsubscribe();
  }, []);

  const saveWeeks = async (newWeeks: WorkWeek[]) => {
    setWeeks(newWeeks);
    // In a real app, we'd only save the changed week.
    // For simplicity here, we'll save the first one if it's new/updated.
    // This is a bit of a hack to match the previous localStorage logic.
    if (newWeeks.length > 0) {
      try {
        const weekToSave = newWeeks[0];
        await setDoc(doc(db, 'dnevnik_weeks', weekToSave.id), weekToSave);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'dnevnik_weeks');
      }
    }
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

  const handleAddLesson = async () => {
    if (!selectedWeek || !selectedDay || !user) return;

    // Fetch classData (this would ideally be passed or fetched)
    // For now, assuming we can get it or use a placeholder
    const classData = { head_teacher: '...', deputy_head_teacher: '...' }; // Need to fetch this
    const { canEnterHours } = checkPermissions(user, classData, lessonSubject, teacherSubjects);
    
    if (!canEnterHours) {
      alert('Nemate dopuštenje za unos sati za ovaj predmet.');
      return;
    }

    const blockId = Date.now().toString();
    const newLessons: Lesson[] = [];

    for (let i = 0; i < lessonBlockHours; i++) {
      newLessons.push({
        id: `${blockId}-${i}`,
        number: lessonNumber + i,
        subject: lessonSubject,
        content: lessonContent,
        teacher: user?.email || 'Nastavnik',
        group: lessonGroup,
        note: lessonNote,
        isBlock: lessonBlockHours > 1,
        blockId: lessonBlockHours > 1 ? blockId : undefined
      });
    }

    const updatedWeeks = weeks.map(w => {
      if (w.id === selectedWeek.id) {
        return {
          ...w,
          days: w.days.map(d => {
            if (d.date === selectedDay.date) {
              // Remove existing lessons with same numbers if any
              const existingNumbers = newLessons.map(nl => nl.number);
              const filteredLessons = d.lessons.filter(l => !existingNumbers.includes(l.number));
              return { 
                ...d, 
                lessons: [...filteredLessons, ...newLessons].sort((a, b) => a.number - b.number) 
              };
            }
            return d;
          })
        };
      }
      return w;
    });

    saveWeeks(updatedWeeks);
    
    // Update Firestore for the specific week
    try {
      const weekToUpdate = updatedWeeks.find(w => w.id === selectedWeek.id);
      if (weekToUpdate) {
        await setDoc(doc(db, 'dnevnik_weeks', weekToUpdate.id), weekToUpdate);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `dnevnik_weeks/${selectedWeek.id}`);
    }
    
    // Update selected day reference
    const updatedWeek = updatedWeeks.find(w => w.id === selectedWeek.id);
    if (updatedWeek) {
      setSelectedWeek(updatedWeek);
      const updatedDay = updatedWeek.days.find(d => d.date === selectedDay.date);
      if (updatedDay) setSelectedDay(updatedDay);
    }
    
    setShowAddLessonModal(false);
    setLessonContent('');
    setLessonNote('');
    setLessonBlockHours(1);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!selectedWeek || !selectedDay) return;
    if (!window.confirm('Jeste li sigurni da želite obrisati ovaj sat?')) return;

    const updatedWeeks = weeks.map(w => {
      if (w.id === selectedWeek.id) {
        return {
          ...w,
          days: w.days.map(d => {
            if (d.date === selectedDay.date) {
              return { ...d, lessons: d.lessons.filter(l => l.id !== lessonId) };
            }
            return d;
          })
        };
      }
      return w;
    });

    saveWeeks(updatedWeeks);
    
    // Update Firestore for the specific week
    try {
      const weekToUpdate = updatedWeeks.find(w => w.id === selectedWeek.id);
      if (weekToUpdate) {
        await setDoc(doc(db, 'dnevnik_weeks', weekToUpdate.id), weekToUpdate);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `dnevnik_weeks/${selectedWeek.id}`);
    }

    const updatedWeek = updatedWeeks.find(w => w.id === selectedWeek.id);
    if (updatedWeek) {
      setSelectedWeek(updatedWeek);
      const updatedDay = updatedWeek.days.find(d => d.date === selectedDay.date);
      if (updatedDay) setSelectedDay(updatedDay);
    }
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

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-16 p-2 text-center font-normal text-gray-600 border-r border-gray-200">Sat</th>
                <th className="p-2 text-left font-normal text-gray-600 border-r border-gray-200">Sadržaj nastavnog sata</th>
                <th className="w-48 p-2 text-left font-normal text-gray-600">Napomena</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => {
                const lesson = selectedDay.lessons.find(l => l.number === num);
                return (
                  <tr key={num} className="border-b border-gray-200 hover:bg-gray-50 min-h-[60px]">
                    <td className="p-3 text-center font-bold border-r border-gray-200">{num}.</td>
                    <td 
                      className="p-3 border-r border-gray-200 cursor-pointer"
                      onClick={() => {
                        setLessonNumber(num);
                        setShowAddLessonModal(true);
                      }}
                    >
                      {lesson ? (
                        <div className="relative group">
                          <div className="bg-red-50 border border-red-200 p-2 rounded">
                            <div className="flex justify-between items-start">
                              <div className="font-bold text-[#1a365d] mb-1">
                                {lesson.subject} ({lesson.group})
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLesson(lesson.id);
                                }}
                                className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="text-gray-700">{lesson.content}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-300 italic">Kliknite za unos sata...</div>
                      )}
                    </td>
                    <td className="p-3 align-top">
                      {lesson?.note && (
                        <div className="text-xs text-gray-600 bg-yellow-50 p-1 border border-yellow-100 rounded">
                          {lesson.note}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
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
              <h3 className="font-medium">Unos nastavnog sata</h3>
              <button onClick={() => setShowAddLessonModal(false)} className="text-white hover:text-gray-300"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Sat:</label>
                  <input 
                    type="number" 
                    value={lessonNumber}
                    onChange={(e) => setLessonNumber(Number(e.target.value))}
                    className="w-full border border-gray-300 p-2 bg-gray-100"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Datum:</label>
                  <div className="p-2 border border-gray-200 bg-gray-50 text-sm">
                    {new Date(selectedDay?.date || '').toLocaleDateString('hr-HR')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Predmet:</label>
                  <select 
                    value={lessonSubject}
                    onChange={(e) => setLessonSubject(e.target.value)}
                    className="w-full border border-gray-300 p-2 bg-white"
                  >
                    {teacherSubjects.length === 0 ? (
                      <option value="">Nema dodijeljenih predmeta</option>
                    ) : (
                      teacherSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Grupa:</label>
                  <select 
                    value={lessonGroup}
                    onChange={(e) => setLessonGroup(e.target.value)}
                    className="w-full border border-gray-300 p-2 bg-white"
                  >
                    <option value="Cijeli razred">Cijeli razred</option>
                    <option value="A grupa">A grupa</option>
                    <option value="B grupa">B grupa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Blok sat (trajanje):</label>
                  <select 
                    value={lessonBlockHours}
                    onChange={(e) => setLessonBlockHours(Number(e.target.value))}
                    className="w-full border border-gray-300 p-2 bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} sat/a</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold mb-1">Sadržaj nastavnog sata:</label>
                <textarea 
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="w-full border border-gray-300 h-24 p-2 text-sm bg-white"
                  placeholder="Unesite nastavnu jedinicu..."
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold mb-1">Napomena:</label>
                <textarea 
                  value={lessonNote}
                  onChange={(e) => setLessonNote(e.target.value)}
                  className="w-full border border-gray-300 h-16 p-2 text-sm bg-white"
                  placeholder="Opcionalna napomena..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowAddLessonModal(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50"
                >
                  Odustani
                </button>
                <button 
                  onClick={handleAddLesson}
                  disabled={!lessonContent || !lessonSubject}
                  className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-8 py-2 disabled:opacity-50"
                >
                  Spremi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
