import { bootstrap } from '../src/server/bootstrap'
import { prisma } from '../src/lib/db'

async function main(): Promise<void> {
  console.log('Seeding SwissHub Sponsoring…')
  await bootstrap({ verbose: true })
  console.log('Fertig.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
