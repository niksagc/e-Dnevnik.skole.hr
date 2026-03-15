'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  BookOpen, 
  MessageSquare, 
  Calendar, 
  FileText, 
  ClipboardList, 
  User, 
  LogOut,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import NotificationBell from '@/components/NotificationBell';

export default function UcenikLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() });
        }
      } else {
        router.push('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = () => {
    auth.signOut();
    router.push('/');
  };

  const menuItems = [
    { name: 'Imenik', icon: BookOpen, href: '/ucenik/imenik' },
    { name: 'Bilješke', icon: MessageSquare, href: '/ucenik/biljeske' },
    { name: 'Izostanci', icon: Calendar, href: '/ucenik/izostanci' },
    { name: 'Zapisnici', icon: FileText, href: '/ucenik/zapisnici' },
    { name: 'Ispiti', icon: ClipboardList, href: '/ucenik/ispiti' },
    { name: 'Osobni podaci', icon: User, href: '/ucenik/osobni-podaci' },
  ];

  if (loading) return <div className="p-8 text-center">Učitavanje...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-[#1a365d] text-white flex justify-between items-center px-6 py-3 shadow-md z-20">
        <div className="flex items-center gap-4">
          <Link href="/ucenik" className="text-xl font-bold tracking-tight">
            e-<span className="text-green-400">D</span><span className="text-blue-400">n</span><span className="text-purple-400">e</span><span className="text-pink-400">v</span><span className="text-red-400">n</span><span className="text-yellow-400">i</span><span className="text-blue-300">k</span>
          </Link>
          <div className="h-6 w-[1px] bg-white/20 mx-2" />
          <span className="text-sm font-medium text-blue-200">UČENIK</span>
        </div>
        <div className="flex items-center gap-6">
          <NotificationBell />
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="text-right">
              <div className="text-sm font-bold">{user?.full_name || user?.email}</div>
              <div className="text-[10px] text-blue-300 uppercase tracking-wider font-bold">Učenik</div>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-red-500/20 text-red-300 rounded-full transition-colors" title="Odjava">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
          <nav className="flex-1 py-6">
            <ul className="space-y-1 px-3">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="text-[10px] text-gray-400 uppercase font-bold mb-2">Aktivna školska godina</div>
            <div className="text-xs font-bold text-gray-700">2023./2024.</div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
