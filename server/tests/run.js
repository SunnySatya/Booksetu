import { spawn, spawnSync } from 'child_process'
import fs from 'fs'

// Derive an isolated QA database URI from the production MONGO_URI in .env,
// swapping only the database name. This keeps DB credentials out of source.
function loadQaUri() {
  const envRaw = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
  const m = envRaw.match(/^MONGO_URI=(.+?)\s*$/m)
  if (!m || !m[1]) throw new Error('MONGO_URI not found in .env')
  const base = m[1].trim()
  const replaced = base.replace(/\/([^/?]*)(\?|$)/, '/booksetu_qa$2')
  return replaced
}

const qauri = loadQaUri()

const runNode = (args, env = {}) =>
  spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, ...env },
  })

async function main() {
  console.log('=== [1/4] Seeding QA database ===')
  const seeded = runNode(['tests/cmd-seed.js'], { QA_MONGO_URI: qauri })
  if (seeded.status !== 0) {
    console.error(seeded.stdout)
    console.error(seeded.stderr)
    process.exit(1)
  }
  console.log(seeded.stdout.trim())

  console.log('=== [2/4] Starting server on TEST DB + port 5199 ===')
  const port = 5199
  const server = spawn(process.execPath, ['src/server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), MONGO_URI: qauri, NODE_ENV: 'test' },
  })
  server.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`))
  server.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`))

  let up = false
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`)
      if (res.ok) { up = true; break }
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  if (!up) {
    console.error('Server did not become healthy')
    server.kill()
    process.exit(1)
  }
  console.log('Server is healthy.')

  console.log('=== [3/4] Running tests ===')
  const ran = runNode(['--test', 'tests/auth.test.js', 'tests/listings.test.js', 'tests/flows.test.js'], { TEST_BASE: `http://127.0.0.1:${port}` })
  console.log(ran.stdout)
  if (ran.stderr) console.error(ran.stderr)
  const code = ran.status ?? 1

  server.kill()

  console.log('=== [4/4] Cleaning up QA data ===')
  const cleaned = runNode(['tests/cmd-cleanup.js'], { QA_MONGO_URI: qauri })
  console.log(cleaned.stdout.trim() || cleaned.stderr || '(cleanup done)')

  process.exit(code)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
