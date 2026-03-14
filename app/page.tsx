'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const checkUserRoleAndRedirect = useCallback(async (user: any) => {
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      let userData;
      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        // Create new user record if it doesn't exist
        const isDefaultAdmin = user.email === 'nikoladuric025@gmail.com';
        userData = {
          email: user.email,
          name: user.displayName || '',
          role: isDefaultAdmin ? 'admin' : 'teacher', // Default to teacher for now, or student
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, userData);
      }

      // Spremamo korisnika u lokalnu memoriju za simulaciju sesije (legacy support)
      localStorage.setItem('currentUser', JSON.stringify({ ...userData, id: user.uid }));
      
      // Preusmjeravanje ovisno o ulozi
      if (userData.role === 'admin' || userData.role === 'teacher') {
        router.push('/skole');
      } else if (userData.role === 'student') {
        router.push('/ucenik');
      } else if (userData.role === 'parent') {
        router.push('/roditelj');
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

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the redirect
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Došlo je do pogreške pri prijavi s Google računom.');
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
        
        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <Image 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              width={20} 
              height={20} 
              className="w-5 h-5" 
              referrerPolicy="no-referrer"
            />
            <span>{loading ? 'PRIJAVA...' : 'Prijavi se putem Google-a'}</span>
          </button>
        </div>
        
        <div className="mt-12 text-xs text-gray-400">
          <p>&copy; 2026 e-Dnevnik Sustav. Sva prava pridržana.</p>
        </div>
      </div>
    </div>
  );
}
