const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'server.js');
let s = fs.readFileSync(filePath, 'utf8');

// Remove <<<<<<< HEAD ... ======= (keep the part after =======)
const idx1 = s.indexOf('<<<<<<< HEAD');
const idx2 = s.indexOf('=======', idx1);
if (idx1 >= 0 && idx2 >= 0) {
  const afterEq = idx2 + '======='.length;
  const nl = s[afterEq] === '\r' ? 2 : 1;
  s = s.slice(0, idx1) + s.slice(afterEq + nl);
  console.log('Removed first conflict');
}

// Remove >>>>>>> marker
const idx3 = s.indexOf('>>>>>>>');
if (idx3 >= 0) {
  const end = s.indexOf('\n', idx3);
  s = s.slice(0, idx3) + (end >= 0 ? s.slice(end + 1) : '');
  console.log('Removed >>>>>>> marker');
}

fs.writeFileSync(filePath, s);
console.log('Done.');
