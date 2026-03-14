'use client';

export default function AdministracijaPage() {
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

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl text-gray-800 mb-4">Administracija</h2>
      
      <div className="border border-gray-200 bg-white">
        {adminLinks.map((link, index) => (
          <div 
            key={link}
            className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 text-sm text-gray-700 ${
              link === 'Elementi vrednovanja' ? 'border-red-400 bg-red-50 text-red-800' : ''
            }`}
          >
            {link}
          </div>
        ))}
      </div>
    </div>
  );
}
