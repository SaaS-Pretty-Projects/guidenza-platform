// Deploy guidenza-platform dist/ to Hostinger via API
// Uses lftp mirror for reliable static file upload
// CircleCI job provides env vars: HOSTINGER_USER, HOSTINGER_PASS, HOSTINGER_DOMAIN

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const USER = process.env.HOSTINGER_USER;
const PASS = process.env.HOSTINGER_PASS;
const DOMAIN = process.env.HOSTINGER_DOMAIN || 'guidenza.com';
const DIST = process.env.DIST_DIR || 'dist';

if (!USER || !PASS) {
  console.error('ERROR: HOSTINGER_USER and HOSTINGER_PASS env vars required');
  process.exit(1);
}

const distPath = path.resolve(DIST);
if (!fs.existsSync(distPath)) {
  console.error(`ERROR: ${distPath} does not exist. Run npm run build first.`);
  process.exit(1);
}

console.log(`Deploying ${distPath} → ${DOMAIN} via lftp...`);

const lftpCmd = [
  'lftp',
  '-u', `"${USER},${PASS}"`,
  '-p', '21',
  `ftp://${DOMAIN}`,
  '-e',
  `"set ftp:ssl-allow yes; set ssl:verify-certificate no; mirror --reverse --delete --parallel=5 --verbose=1 ${distPath} /public_html; quit"`
].join(' ');

try {
  execSync(lftpCmd, { stdio: 'inherit', timeout: 120000 });
  console.log('✓ Deploy complete');
} catch (e) {
  console.error('✗ Deploy failed:', e.message);
  process.exit(1);
}
