const fs = require('fs');
try {
  require('./server.js');
} catch (e) {
  fs.writeFileSync('crash.log', e.stack);
  console.error(e.message);
  process.exit(1);
}
