'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, handleFirestoreError, OperationType, signInWithEmailAndPassword } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const checkUserRoleAndRedirect = useCallback(async (user: any) => {
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Preusmjeravanje ovisno o ulozi
        if (userData.role === 'admin' || userData.role === 'teacher') {
          router.push('/skole');
        } else if (userData.role === 'student') {
          router.push('/ucenik');
        } else if (userData.role === 'parent') {
          router.push('/roditelj');
        }
      } else {
        setError('Korisnik nema dodijeljenu ulogu u sustavu.');
      }
    } catch (err) {
      console.error('Error checking user role:', err);
      setError('Došlo je do pogreške pri dohvaćanju podataka korisnika.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkUserRoleAndRedirect(user);
      }
    });
    return () => unsubscribe();
  }, [checkUserRoleAndRedirect]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Neispravan e-mail ili lozinka.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md p-8 text-center">
        <h1 className="text-4xl font-light mb-2 text-gray-800">e-Dnevnik</h1>
        <p className="text-gray-500 mb-10">Prijavite se u sustav</p>
        
        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Lozinka"
            className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? 'PRIJAVA...' : 'Prijavi se'}
          </button>
        </form>
        
        <div className="mt-12 text-xs text-gray-400">
          <p>&copy; 2026 e-Dnevnik Sustav. Sva prava pridržana.</p>
        </div>
      </div>
    </div>
  );
}
