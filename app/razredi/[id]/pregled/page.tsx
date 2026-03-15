'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { BookOpen, Calendar } from 'lucide-react';

export default function PregledRadaPage() {
  const params = useParams();
  const classId = params.id as string;
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('');

  const [lektira, setLektira] = useState<any[]>([]);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookDate, setNewBookDate] = useState('');
  const [newBookStudentId, setNewBookStudentId] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const q = query(collection(db, 'pisanih_zadaca'), where('class_id', '==', classId), orderBy('date'));
        const snapshot = await getDocs(q);
        setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const lQ = query(collection(db, 'lektira'));
        const lSnapshot = await getDocs(lQ);
        setLektira(lSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'pisanih_zadaca/lektira');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [classId]);

  const handleAddLektira = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newBook = { student_id: newBookStudentId, book_title: newBookTitle, author: newBookAuthor, date_read: newBookDate };
      const docRef = await addDoc(collection(db, 'lektira'), newBook);
      setLektira([...lektira, { id: docRef.id, ...newBook }]);
      setNewBookTitle('');
      setNewBookAuthor('');
      setNewBookDate('');
      setNewBookStudentId('');
      alert('Lektira dodana.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'lektira');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-xl text-gray-800 mb-6">Pregled rada</h2>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Raspored pisanih zadaća</h3>
          <form onSubmit={handleAddTask} className="mb-4 space-y-2">
            <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Naslov" className="w-full border p-2" required />
            <input type="date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} className="w-full border p-2" required />
            <input type="text" value={newTaskSubject} onChange={(e) => setNewTaskSubject(e.target.value)} placeholder="Predmet ID" className="w-full border p-2" required />
            <button type="submit" className="bg-[#2c5282] text-white px-4 py-2 text-sm">Dodaj</button>
          </form>
          <div className="max-h-60 overflow-y-auto">
            {tasks.map(task => (
              <div key={task.id} className="border-b p-2 text-sm">
                <span className="font-bold">{task.title}</span> - {task.date}
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Lektira</h3>
          <form onSubmit={handleAddLektira} className="mb-4 space-y-2">
            <input type="text" value={newBookStudentId} onChange={(e) => setNewBookStudentId(e.target.value)} placeholder="Učenik ID" className="w-full border p-2" required />
            <input type="text" value={newBookTitle} onChange={(e) => setNewBookTitle(e.target.value)} placeholder="Naslov knjige" className="w-full border p-2" required />
            <input type="text" value={newBookAuthor} onChange={(e) => setNewBookAuthor(e.target.value)} placeholder="Autor" className="w-full border p-2" required />
            <input type="date" value={newBookDate} onChange={(e) => setNewBookDate(e.target.value)} className="w-full border p-2" required />
            <button type="submit" className="bg-[#2c5282] text-white px-4 py-2 text-sm">Dodaj</button>
          </form>
          <div className="max-h-60 overflow-y-auto">
            {lektira.map(book => (
              <div key={book.id} className="border-b p-2 text-sm">
                <span className="font-bold">{book.book_title}</span> - {book.author} ({book.date_read})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
