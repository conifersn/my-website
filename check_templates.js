const fs = require('fs');
const content = fs.readFileSync('lib/emailTemplates.js', 'utf8');

// Count backticks
const backticks = content.match(/`/g);
console.log('Backticks:', backticks ? backticks.length : 0);

// Try to require and see detailed error
try {
  const mod = require('./lib/emailTemplates.js');
  console.log('Module loaded:', Object.keys(mod));
} catch (e) {
  console.error('Error details:', e.message);
  console.error('Stack:', e.stack);
}
