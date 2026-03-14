'use client';

export default function IzvjestajiPage() {
  const reports = [
    'Izvještaji za školu',
    'Izvještaji za razredni odjel',
    'Izvještaji za nastavnika',
    'Svi izvještaji'
  ];

  const classReports = [
    'Sve ocjene iz predmeta',
    'Ocjene iz svih predmeta',
    'Ispis ocjena u periodu',
    'Povijest izmjena ocjena',
    'Povijest izmjena nastavnika'
  ];

  return (
    <div className="max-w-5xl mx-auto flex gap-8">
      <div className="w-1/3">
        <h2 className="text-xl text-gray-800 mb-4">Izvještaji</h2>
        <div className="border border-gray-200 bg-white">
          {reports.map((report, idx) => (
            <div 
              key={report}
              className={`p-3 border-b border-gray-200 cursor-pointer text-sm ${
                idx === 1 ? 'bg-red-50 border-red-200 text-red-800 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {report}
            </div>
          ))}
        </div>
      </div>

      <div className="w-2/3">
        <h2 className="text-xl text-gray-800 mb-4 opacity-0">Detalji</h2>
        <div className="border border-red-300 bg-white shadow-sm">
          {classReports.map((report, idx) => (
            <div 
              key={report}
              className={`p-3 border-b border-gray-200 cursor-pointer text-sm ${
                idx === 3 ? 'bg-red-50 border-red-200 text-red-800 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {report}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
