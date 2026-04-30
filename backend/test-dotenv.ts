import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log('__dirname:', __dirname);
console.log('env path:', join(__dirname, '.env'));
const result = dotenv.config({ path: join(__dirname, '.env') });
console.log('dotenv error:', result.error);
console.log('TESTMO_URL:', process.env.TESTMO_URL);
