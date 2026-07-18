require('dotenv').config();
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

async function applySchema() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoToken) {
    throw new Error('Missing TURSO credentials');
  }

  const client = createClient({ url: tursoUrl, authToken: tursoToken });
  const sqlContent = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-16le');
  
  // split by ; to execute one by one
  const statements = sqlContent.split(';').map(s => s.trim()).filter(s => s.length > 0);
  
  console.log(`Applying ${statements.length} SQL statements to Turso...`);
  
  for (const sql of statements) {
    try {
      await client.execute(sql);
    } catch (e) {
      console.error('Error applying statement:', sql);
      console.error(e);
      throw e;
    }
  }
  
  console.log('Schema applied successfully!');
  client.close();
}

applySchema().catch(e => {
  console.error(e);
  process.exit(1);
});
