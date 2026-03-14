'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function AdministracijaPage() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('student');

  const adminLinks = [
    'Korisnici',
    'Odaberi predmete za školu',
    'Dodijeli nastavnicima predmete',
    'Razredni odjeli i grupe',
    'Grupna zamjena',
    'Odaberi ravnatelja',
    'Administracija učenika',
    'Administracija predmeta',
    'Elementi vrednovanja'
  ];

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*').order('role');
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'Korisnici') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    
    setLoading(true);
    const { data, error } = await supabase.from('users').insert([
      { email: newEmail, password: newPassword, role: newRole }
    ]).select();

    if (!error && data) {
      setUsers([...users, data[0]]);
      setNewEmail('');
      setNewPassword('');
    } else {
      alert('Greška pri dodavanju korisnika.');
    }
    setLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovog korisnika?')) return;
    
    setLoading(true);
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (!error) {
      setUsers(users.filter(u => u.id !== id));
    } else {
      alert('Greška pri brisanju korisnika.');
    }
    setLoading(false);
  };

  if (activeTab === 'Korisnici') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveTab(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl text-gray-800">Upravljanje korisnicima</h2>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm mb-8">
          <h3 className="text-lg font-bold mb-4">Dodaj novog korisnika</h3>
          <form onSubmit={handleAddUser} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">E-mail (Korisničko ime)</label>
              <input 
                type="email" 
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full border border-gray-300 p-2" 
                required 
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Lozinka</label>
              <input 
                type="text" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 p-2" 
                required 
              />
            </div>
            <div className="w-48">
              <label className="block text-sm text-gray-600 mb-1">Uloga</label>
              <select 
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full border border-gray-300 p-2 bg-white"
              >
                <option value="student">Učenik</option>
                <option value="teacher">Nastavnik</option>
                <option value="parent">Roditelj</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-[#2c5282] hover:bg-[#1a365d] text-white px-6 py-2 flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={18} /> Dodaj
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-700">
            <div className="col-span-2">E-mail</div>
            <div>Uloga</div>
            <div className="text-right">Akcije</div>
          </div>
          {loading && users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Učitavanje korisnika...</div>
          ) : (
            users.map(user => (
              <div key={user.id} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100 items-center">
                <div className="col-span-2 font-medium">{user.email}</div>
                <div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'parent' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div className="text-right">
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Obriši korisnika"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'Odaberi predmete za školu' || activeTab === 'Administracija predmeta') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveTab(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl text-gray-800">Upravljanje predmetima</h2>
        </div>
        <div className="bg-white p-8 border border-gray-200 shadow-sm text-center">
          <p className="text-gray-600 mb-4">U ovoj demo verziji predmeti su fiksni i učitavaju se iz konfiguracije škole.</p>
          <p className="text-sm text-gray-500">Za potpunu administraciju predmeta potrebno je proširiti bazu podataka s tablicom 'subjects'.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl text-gray-800 mb-4">Administracija</h2>
      
      <div className="border border-gray-200 bg-white">
        {adminLinks.map((link) => (
          <div 
            key={link}
            onClick={() => setActiveTab(link)}
            className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 text-sm text-gray-700 flex justify-between items-center ${
              link === 'Elementi vrednovanja' ? 'border-red-400 bg-red-50 text-red-800' : ''
            }`}
          >
            <span>{link}</span>
            <span className="text-gray-400 text-xs">Otvori &rarr;</span>
          </div>
        ))}
      </div>
    </div>
  );
}
