'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, LogOut, User, Settings, BookOpen, LayoutDashboard } from 'lucide-react';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
      setSchoolId(localStorage.getItem('currentSchoolId'));
    };
    init();
  }, [pathname]); // Re-check on route change

  if (!user || pathname === '/') return null; // Don't show on login page

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentSchoolId');
    setIsOpen(false);
    router.push('/');
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-white rounded-md shadow-md hover:bg-gray-50 border border-gray-200"
      >
        {isOpen ? <X size={24} className="text-gray-700" /> : <Menu size={24} className="text-gray-700" />}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-2">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
          
          <div className="py-1">
            <button 
              onClick={() => {
                setIsOpen(false);
                if (user.role === 'admin') router.push('/skole');
                else if (user.role === 'teacher') router.push('/skole');
                else if (user.role === 'parent') router.push('/roditelj');
                else if (user.role === 'student') router.push('/ucenik');
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <BookOpen size={16} /> Početna (Škole)
            </button>

            {schoolId && (
              <button 
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/skole/${schoolId}/dashboard`);
                }}
                className="w-full text-left px-4 py-2 text-sm text-blue-700 font-medium hover:bg-blue-50 flex items-center gap-2"
              >
                <LayoutDashboard size={16} /> Dashboard škole
              </button>
            )}
            
            <button 
              onClick={() => {
                setIsOpen(false);
                // Placeholder for profile
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <User size={16} /> Moj profil
            </button>
            
            {user.role === 'teacher' && (
              <button 
                onClick={() => {
                  setIsOpen(false);
                  router.push('/moji-predmeti');
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Settings size={16} /> Moji predmeti i elementi
              </button>
            )}
            
            {user.role === 'admin' && (
              <button 
                onClick={() => {
                  setIsOpen(false);
                  router.push('/razredi/1/administracija');
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Settings size={16} /> Administracija
              </button>
            )}
          </div>
          
          <div className="py-1 border-t border-gray-100">
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <LogOut size={16} /> Odjava
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
