'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.argv[2] || '/usr/local/lib/node_modules/n8n';
const source = fs.readFileSync(path.join(root, 'dist/services/ownership.service.js'), 'utf8');
function method(name, args, async = false) {
  const pattern = new RegExp(`    ${async ? 'async ' : ''}${name}\\(${args}\\) \\{([\\s\\S]*?)\\n    \\}`);
  const match = source.match(pattern);
  assert.ok(match, `Extract actual installed method ${name}`);
  return new Function('db_1', `return ${async ? 'async ' : ''}function(${args}) {${match[1]}\n}`)({Project: class Project {}});
}
const reconstructProject = method('reconstructProject', 'project');
const getWorkflowProjectCached = method('getWorkflowProjectCached', 'workflowId', true);
const cache = {valid: {id: 'project-a', type: 'personal'}};
const queried = [];
const owner = {
  reconstructProject,
  copyProject: p => ({...p}),
  cacheService: {getHashValue: async (_, key) => cache[key], setHash: async () => {}},
  sharedWorkflowRepository: {findOneOrFail: async ({where}) => {
    queried.push(where.workflowId);
    if (where.workflowId === 'legitimate-prototype-id') return {project: {id: 'project-b'}};
    throw new Error('Workflow owner not found');
  }},
};
(async () => {
  // Reproduce the reported inherited-cache-key path on the actual installed methods.
  assert.equal((await getWorkflowProjectCached.call(owner, 'valid')).id, 'project-a');
  for (const id of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'missing']) {
    await assert.rejects(getWorkflowProjectCached.call(owner, id), /Workflow owner not found/);
    assert.ok(queried.includes(id), `${id} must fall back to the authorized DB ownership lookup`);
  }
  for (const invalid of [undefined, null, {}, Object.prototype, {id: undefined}, {id: 1}]) {
    assert.equal(reconstructProject(invalid), undefined);
  }
  assert.equal((await getWorkflowProjectCached.call(owner, 'legitimate-prototype-id')).id, 'project-b');
  const zlib = require('node:zlib');
  const plain = Buffer.from('security runtime functional smoke');
  assert.deepEqual(zlib.brotliDecompressSync(zlib.brotliCompressSync(plain)), plain);
  console.log('PASS: normal ownership, inherited cache keys, DB fallback, invalid project IDs, Brotli round trip');
})().catch(e => {console.error(e); process.exitCode = 1;});
