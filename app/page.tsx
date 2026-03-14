'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const hashPassword = async (password: string) => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const hashedPassword = await hashPassword(password);
      
      const { data: user, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', username)
        .single();
      
      if (dbError || !user) {
        setError('Pogrešno korisničko ime ili lozinka.');
        setLoading(false);
        return;
      }

      if (user.password !== password && user.password !== hashedPassword) {
        setError('Pogrešno korisničko ime ili lozinka.');
        setLoading(false);
        return;
      }

      // Spremamo korisnika u lokalnu memoriju za simulaciju sesije
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // Preusmjeravanje ovisno o ulozi
      if (user.role === 'admin' || user.role === 'teacher') {
        router.push('/skole');
      } else if (user.role === 'student') {
        router.push('/ucenik');
      } else if (user.role === 'parent') {
        router.push('/roditelj');
      }
    } catch (err) {
      setError('Došlo je do pogreške pri spajanju na bazu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md p-8">
        <h1 className="text-3xl font-normal text-center mb-10 text-gray-800">Dobrodošli</h1>
        
        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 text-sm text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-sm text-gray-700">Korisničko ime:</label>
            <input 
              type="text" 
              className="flex-1 border border-gray-300 p-2 focus:outline-none focus:border-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-sm text-gray-700">Lozinka:</label>
            <input 
              type="password" 
              className="flex-1 border border-gray-300 p-2 focus:outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full ml-32 bg-[#3b5998] hover:bg-[#2d4373] text-white py-2 px-4 transition-colors disabled:opacity-50"
            >
              {loading ? 'PRIJAVA...' : 'PRIJAVA'}
            </button>
          </div>
        </form>
        
        <div className="mt-8 text-xs text-gray-500 text-center border-t pt-4">
          <p>Dostupni testni računi (nakon što pokrenete SQL skriptu):</p>
          <p>Admin: nikola.duric2@skole.hr / 123410122005</p>
          <p>Nastavnik: marko.kovacevic@skole.hr / 123456</p>
          <p>Učenik: mario.kovac@skole.hr / 123456</p>
          <p>Roditelj: marica.kovac@gmail.com / 123456</p>
        </div>
      </div>
    </div>
  );
}
