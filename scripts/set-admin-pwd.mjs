import bcrypt from 'bcryptjs';
import pg from 'pg';

const hash = bcrypt.hashSync('admin123', 10);
console.log('Generated hash:', hash);

const client = new pg.Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/lynxkit'
});

await client.connect();
const res = await client.query(
  "UPDATE users SET password_hash = $1 WHERE email = 'admin@lynxkit.com' RETURNING email, length(password_hash) AS len, substring(password_hash, 1, 10) AS prefix",
  [hash]
);
console.log('Updated:', res.rows[0]);
await client.end();
