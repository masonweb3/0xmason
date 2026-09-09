import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { getPayload } from 'payload';
import config from '../src/payload.config';

const database = new URL(process.env.MASON_CMS_DATABASE_URL || 'http://invalid');
if (!['localhost', '127.0.0.1', '[::1]'].includes(database.hostname) || !/^\/mason_cms_ci(?:_[a-z0-9]+)?$/.test(database.pathname)) {
  throw new Error('CMS tests require a disposable loopback database named mason_cms_ci.');
}

const payload = await getPayload({ config });
try {
  const password = randomBytes(24).toString('hex');
  await assert.rejects(() => payload.create({ collection: 'users', data: { email: 'blocked@example.invalid', password, name: 'Test' } }));
  const admin = await payload.create({ collection: 'users', data: { email: 'admin@example.invalid', password, name: 'Test administrator' }, context: { bootstrapAdmin: true } });
  await assert.rejects(() => payload.create({ collection: 'users', data: { email: 'second@example.invalid', password, name: 'Test' }, context: { bootstrapAdmin: true } }));
  const user = { ...admin, collection: 'users' as const };
  const category = await payload.create({ collection: 'categories', data: { title: 'Test category', slug: 'global-accounts', summary: 'Test summary', description: 'Test description', sortOrder: 0 }, user, overrideAccess: false });
  const draft = await payload.create({ collection: 'articles', data: { title: 'Test draft', slug: 'test-draft', category: category.id, summary: 'Test summary', bodyFormat: 'markdown', markdown: '## Test section\n\nTest body.', _status: 'draft' }, user, overrideAccess: false, draft: true });
  assert.equal((await payload.find({ collection: 'articles', overrideAccess: false })).totalDocs, 0);
  await assert.rejects(() => payload.update({ collection: 'articles', id: draft.id, data: { title: 'Anonymous edit' }, overrideAccess: false }));
  await payload.update({ collection: 'articles', id: draft.id, data: { _status: 'published' }, user, overrideAccess: false });
  assert.equal((await payload.find({ collection: 'articles', overrideAccess: false })).totalDocs, 1);
  await payload.update({ collection: 'articles', id: draft.id, data: { title: 'Unpublished revision' }, draft: true, user, overrideAccess: false });
  assert.equal((await payload.findByID({ collection: 'articles', id: draft.id, overrideAccess: false })).title, 'Test draft');
  await assert.rejects(() => payload.findVersions({ collection: 'articles', overrideAccess: false }));
  await assert.rejects(() => payload.find({ collection: 'users', overrideAccess: false }));
  await assert.rejects(() => payload.find({ collection: 'affiliate-links', overrideAccess: false }));
  await assert.rejects(() => payload.create({ collection: 'articles', data: { title: 'Empty', slug: 'empty', category: category.id, summary: 'Test', bodyFormat: 'markdown', markdown: '', _status: 'published' }, user, overrideAccess: false }));
  await assert.rejects(() => payload.unlock({ collection: 'users', data: { email: admin.email, password }, overrideAccess: false }));
  console.log('CMS integration passed: closed registration, draft isolation, publication, versions and anonymous access.');
} finally {
  await payload.destroy();
}
process.exit(0);
