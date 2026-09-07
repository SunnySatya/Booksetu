import { seed } from './seed.js'
try {
  await seed()
  process.exit(0)
} catch (e) {
  console.error(e)
  process.exit(1)
}
