const fs = require('fs');
const p = 'components/AdminFinanceModule.tsx';
let s = fs.readFileSync(p, 'utf8');
const startToken = "{adminTab === 'sso' && (";
const endToken = "{adminTab === 'sessions' && (";
const start = s.indexOf(startToken);
if (start < 0) { console.log('start not found'); process.exit(1); }
const end = s.indexOf(endToken, start);
if (end < 0) { console.log('end not found'); process.exit(1); }
const before = s.substring(0, start);
const after = s.substring(end);
const insert =
  before +
  "{adminTab === 'sso' && (\n" +
  "            <SsoTab\n" +
  "              providers={ssoProviders}\n" +
  "              setProviders={setSSOProviders}\n" +
  "              addAuditLog={addAuditLog}\n" +
  "            />\n" +
  "          )}\n\n          " +
  after.substring(2);
fs.writeFileSync(p, insert);
console.log('done. new length:', insert.length);