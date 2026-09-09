import '../src/cms/environment';
import { getPayload } from 'payload';
import config from '../src/payload.config';

const email = process.env.MASON_CMS_ADMIN_EMAIL;
const password = process.env.MASON_CMS_ADMIN_PASSWORD;
if (!email || !password || password.length < 16) throw new Error('Set MASON_CMS_ADMIN_EMAIL and a password of at least 16 characters in the repository .env.');
const payload = await getPayload({ config });
try {
  if (process.argv.includes('--reset-password')) {
    const users = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 });
    if (!users.docs[0]) throw new Error('No administrator matches this email.');
    await payload.update({ collection: 'users', id: users.docs[0].id, data: { password, sessions: [], loginAttempts: 0, lockUntil: null }, overrideAccess: true });
    console.log('Administrator password reset and existing sessions revoked.');
  } else {
    await payload.create({ collection: 'users', data: { email, password, name: 'Mason' }, context: { bootstrapAdmin: true }, overrideAccess: true });
    console.log('Administrator created.');
  }
} finally { await payload.destroy(); }
process.exit(0);
