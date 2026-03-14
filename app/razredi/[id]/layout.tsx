'use client';

import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { Users, BookOpen, Calendar, FileText, BarChart2, Settings, Search, Menu, LogOut } from 'lucide-react';

export default function RazredLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  const navItems = [
    { name: 'Imenik', path: `/razredi/${classId}/imenik`, icon: Users },
    { name: 'Pregled rada', path: `/razredi/${classId}/pregled`, icon: BookOpen },
    { name: 'Dnevnik rada', path: `/razredi/${classId}/dnevnik`, icon: Calendar },
    { name: 'Zapisnici', path: `/razredi/${classId}/zapisnici`, icon: FileText },
    { name: 'Izvještaji', path: `/razredi/${classId}/izvjestaji`, icon: BarChart2 },
    { name: 'Administracija', path: `/razredi/${classId}/administracija`, icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Header */}
      <header className="bg-[#1a365d] text-white flex justify-between items-center px-4 py-2">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold tracking-wide">
            e-<span className="text-green-400">D</span><span className="text-blue-400">n</span><span className="text-purple-400">e</span><span className="text-pink-400">v</span><span className="text-red-400">n</span><span className="text-yellow-400">i</span><span className="text-blue-300">k</span>
          </h1>
          <div className="bg-[#0d2342] px-3 py-1 text-sm">
            Testna škola CARNet Zadar
          </div>
          <div className="bg-[#0d2342] px-3 py-1 text-sm">
            24-25
          </div>
          <div className="bg-[#0d2342] px-3 py-1 text-sm">
            1.a
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>M. Jurić</span>
          <span className="text-xs text-gray-300">školski admin</span>
          <button onClick={handleLogout} className="flex items-center gap-1 hover:text-red-300 transition-colors ml-2">
            <LogOut size={16} /> Odjava
          </button>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="border-b border-gray-200 flex items-center bg-white">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.includes(item.path);
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-r border-gray-200 transition-colors ${
                isActive ? 'bg-gray-100 text-black border-b-2 border-b-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {item.name}
            </Link>
          );
        })}
        <div className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 border-r border-gray-200 hover:bg-gray-50 cursor-pointer ml-auto">
          <Search size={16} />
          Pretraživanje
        </div>
        <div className="px-4 py-3 bg-[#2c5282] text-white hover:bg-[#1a365d] cursor-pointer transition-colors">
          <Menu size={20} />
        </div>
      </nav>

      {/* Page Content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
