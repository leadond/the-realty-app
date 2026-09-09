const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup(user, existing = { organizationId: 'team-a' }) {
  const writes = [];
  const model = {
    findUnique: async () => existing,
    findMany: async () => [],
    update: async (args) => { writes.push(args); return args.data; },
    upsert: async (args) => { writes.push(args); return args.update; },
  };
  const dependencies = {
    'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
    '@/lib/db': { prisma: { featureAccessRequest: model } },
    '@/lib/current-user': { getCurrentUser: async () => user },
    '@/lib/feature-roadmap': {
      REQUEST_ACCESS_FEATURES: [],
      getRoadmapFeature: (key) => key === 'zillow-bridge' ? { key, label: 'Bridge' } : null,
    },
  };
  const source = fs.readFileSync('src/app/api/feature-requests/route.ts', 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, require: (name) => {
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
    return dependencies[name];
  }};
  vm.runInNewContext(output, context);
  return { route: context.exports, writes };
}
const request = (body) => new Request('http://localhost/api/feature-requests', {
  method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
});

test('anonymous requests are rejected', async () => {
  const { route } = setup(null);
  for (const method of ['GET', 'POST', 'PATCH']) assert.equal((await route[method](request({}))).status, 401);
});
test('agents cannot read or triage other requests', async () => {
  const { route, writes } = setup({ id: 'agent', role: 'AGENT' });
  assert.equal((await route.GET()).status, 403);
  assert.equal((await route.PATCH(request({ requestId: 'r', status: 'PLANNED' }))).status, 403);
  assert.equal(writes.length, 0);
});
test('brokers require a matching nonempty organization', async () => {
  for (const organizationId of [null, 'team-b', 'team-a']) {
    const { route } = setup({ role: 'BROKER', organizationId }, { organizationId: organizationId === null ? null : 'team-a' });
    assert.equal((await route.PATCH(request({ requestId: 'r', status: 'REVIEWED' }))).status, organizationId === 'team-a' ? 200 : 403);
  }
});
test('admin can review any organization', async () => {
  const { route } = setup({ role: 'ADMIN' });
  assert.equal((await route.PATCH(request({ requestId: 'r', status: 'PLANNED' }))).status, 200);
});
test('malformed payloads and unknown priorities return 400', async () => {
  const { route } = setup({ id: 'agent', role: 'ADMIN' });
  for (const body of [null, [], 'bad']) {
    for (const method of ['POST', 'PATCH']) assert.equal((await route[method](request(body))).status, 400);
  }
  assert.equal((await route.POST(request({ featureKey: 'zillow-bridge', priority: 'INVALID' }))).status, 400);
});
test('repeat requests preserve omitted details and review status', async () => {
  const { route, writes } = setup({ id: 'agent', role: 'AGENT', organizationId: null });
  assert.equal((await route.POST(request({ featureKey: 'zillow-bridge' }))).status, 201);
  assert.equal(writes[0].where.userId_featureKey.userId, 'agent');
  for (const key of ['notes', 'priority', 'status']) assert.equal(key in writes[0].update, false);
});
test('explicit empty notes clear saved notes', async () => {
  const { route, writes } = setup({ id: 'agent', role: 'AGENT' });
  await route.POST(request({ featureKey: 'zillow-bridge', notes: '', priority: 'URGENT' }));
  assert.equal(writes[0].update.notes, null);
  assert.equal(writes[0].update.priority, 'URGENT');
});
