Targeted security overlay for Hyperskill n8n 2.19.3-f6561da.

Dockerfile.n8n preserves the exact deployed application/dependency image, upgrades only the Node.js 24 runtime to pinned 24.22.1, and backports the exact reconstructProject validation change from vendor n8n 2.43.5 for GHSA-wvjj-qg37-pv73. Dockerfile.runners preserves the deployed JavaScript/Python runner code and upgrades its Node.js runtime to the same patched version.

Builds are linux/amd64 using Azure ACR Tasks (registry hyperskill):
az acr build -r hyperskill -t n8n:2.19.3-f6561da-security-20261030 -f security/20261030/Dockerfile.n8n security/20261030
az acr build -r hyperskill -t n8n-runners:2.19.3-f6561da-security-20261030 -f security/20261030/Dockerfile.runners security/20261030

Build checks validate the actual installed ownership/cache methods and Brotli round trip. smoke-workflow.json was imported/executed only in an isolated SQLite-backed pod with external candidate runners and deny-all ingress/egress; JavaScript and native Python returned the expected result. No production workflows or schema migrations are involved.

The application remains n8n 2.19.3. A supported upstream version upgrade is separate work; remove this version-specific backport after adopting an upstream-fixed release and rehearsing its migrations.
