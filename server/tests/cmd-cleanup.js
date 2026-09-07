import { teardown } from './seed.js'
try {
  await teardown()
  process.exit(0)
} catch (e) {
  console.error(e)
  process.exit(1)
}
