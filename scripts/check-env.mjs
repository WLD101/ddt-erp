import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.error('\n\x1b[31m[ERROR] .env file is missing!\x1b[0m');
  console.error('\x1b[33mTo fix this, copy .env.example to .env:\x1b[0m');
  console.error('  cp .env.example .env\n');
  console.error('Ensure that DATABASE_URL and DIRECT_URL are set to valid PostgreSQL connection strings.');
  process.exit(1);
}

// Simple check for required variables
const envContent = fs.readFileSync(envPath, 'utf8');
if (!envContent.includes('DATABASE_URL') || !envContent.includes('DIRECT_URL')) {
  console.error('\n\x1b[31m[ERROR] Required database variables are missing in .env!\x1b[0m');
  console.error('\x1b[33mEnsure both DATABASE_URL and DIRECT_URL are defined.\x1b[0m\n');
  process.exit(1);
}

console.log('\x1b[32m[OK] Environment variables found.\x1b[0m');
