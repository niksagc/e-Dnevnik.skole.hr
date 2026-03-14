export const users = [
  { username: 'nikola.duric2@skole.hr', password: '123410122005', role: 'admin', name: 'Nikola Đurić' },
  { username: 'marko.kovacevic@skole.hr', password: '123456', role: 'teacher', name: 'Marko Kovačević' },
  { username: 'mario.kovac@skole.hr', password: '123456', role: 'student', name: 'Mario Kovač', studentId: '5' },
  { username: 'marica.kovac@gmail.com', password: '123456', role: 'parent', name: 'Marica Kovač', linkedStudentId: '5' }
];

export const schools = [
  { id: '1', name: 'Testna ED škola' },
  { id: '2', name: 'Testna škola CARNet Zadar' },
  { id: '3', name: 'Testna škola CARNet Jurišićeva' },
];

export const classes = [
  { id: '1a', name: '1.a', teacher: 'Marko Jurić', program: '1. razred osnovne škole', role: 'razrednik' },
  { id: '1b', name: '1.b', teacher: 'Marin Milović, Marko Jurić', program: '1. razred osnovne škole', role: 'zamjenik' },
  { id: '4a', name: '4.a', teacher: 'Marin Milović', program: '4. razred srednje škole', role: 'nastavnik' },
  { id: '7a', name: '7.a', teacher: 'Marin Milović', program: '7. razred osnovne škole', role: 'nastavnik' },
];

export const students = [
  { id: '1', name: 'Tibor Agić', program: 'Osnovna škola - redovni program', warnings: { grades: 3, absences: true } },
  { id: '2', name: 'Andro Anjikov', program: 'Osnovna škola - redovni program', warnings: { grades: 0, absences: true } },
  { id: '3', name: 'Karlo Barić', program: 'Osnovna škola - redovni program', warnings: { grades: 0, absences: true } },
  { id: '4', name: 'Luka Benović', program: 'Osnovna škola - redovni program', warnings: { grades: 0, absences: true } },
  { id: '5', name: 'Mario Kovač', program: 'Osnovna škola - redovni program', warnings: { grades: 0, absences: false } },
];

export const subjects = [
  'Hrvatski jezik',
  'Likovna kultura',
  'Glazbena kultura',
  'Matematika',
  'Priroda i društvo'
];

export const evaluationElements = [
  'Hrvatski jezik i komunikacija',
  'Književnost i stvaralaštvo',
  'Kultura i mediji'
];
