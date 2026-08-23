/**
 * Reset the password of an existing admin account.
 *
 *   npm run admin:password -- --email you@example.com --password "new-password"
 *
 * All active sessions of that account are revoked.
 */
import { checkPasswordPolicy, hashPassword } from '../src/lib/auth'
import { prisma } from '../src/lib/db'

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

async function main(): Promise<void> {
  const email = arg('email')?.trim().toLowerCase()
  const password = arg('password')

  if (!email || !password) {
    console.error('Aufruf: npm run admin:password -- --email <adresse> --password <neues-passwort>')
    process.exitCode = 1
    return
  }

  const policy = checkPasswordPolicy(password)
  if (!policy.ok) {
    console.error(`Fehler: ${policy.message}`)
    process.exitCode = 1
    return
  }

  const user = await prisma.adminUser.findUnique({ where: { email } })
  if (!user) {
    console.error(`Fehler: Kein Konto mit der Adresse ${email} gefunden.`)
    process.exitCode = 1
    return
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password), active: true },
  })
  const revoked = await prisma.session.deleteMany({ where: { userId: user.id } })

  console.log(`Passwort für ${email} wurde gesetzt. ${revoked.count} aktive Sitzung(en) wurden beendet.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
