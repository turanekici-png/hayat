import { fileURLToPath } from 'url';
import path from 'path';

const url = 'http://127.0.0.1:4000/api/admin/login';
const body = new URLSearchParams({ email: 'turanekici@gmail.com', password: 'Admin1234!' });
const res = await fetch(url, {
  method: 'POST',
  body,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  redirect: 'manual'
});
console.log('status', res.status);
console.log('location', res.headers.get('location'));
console.log('url', res.url);
const text = await res.text();
console.log('body', text.slice(0, 500));
