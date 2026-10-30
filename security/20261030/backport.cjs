'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2] || '/usr/local/lib/node_modules/n8n';
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.version !== '2.19.3') throw new Error(`Unexpected n8n version: ${pkg.version}`);
const file = path.join(root, 'dist/services/ownership.service.js');
let code = fs.readFileSync(file, 'utf8');
// Exact security change from the vendor's n8n 2.43.4 -> 2.43.5 release.
// GHSA-wvjj-qg37-pv73: Object.prototype must not become an unscoped Project.
const before = "reconstructProject(project) {\n        if (typeof project !== 'object' || project === null) {";
const after = "reconstructProject(project) {\n        if (typeof project?.id !== 'string') {";
if (code.split(before).length !== 2) throw new Error('Expected vulnerable method not found exactly once');
code = code.replace(before, after);
fs.writeFileSync(file, code);
console.log('Applied vendor project-cache validation backport to n8n 2.19.3');
