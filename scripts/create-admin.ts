/**
 * Create an admin account from the command line.
 *
 *   npm run admin:create -- --email you@example.com --name "Your Name" [--password "…"]
 *
 * When --password is omitted a strong password is generated and printed once.
 */
import { randomBytes } from 'node:crypto'

import { checkPasswordPolicy, hashPassword } from '../src/lib/auth'
import { prisma } from '../src/lib/db'

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function generatePassword(): string {
  // base64url always yields letters and usually digits; retry until the policy holds.
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = randomBytes(15).toString('base64url')
    if (checkPasswordPolicy(candidate).ok) return candidate
  }
  return `${randomBytes(12).toString('base64url')}7a`
}

async function main(): Promise<void> {
  const email = arg('email')?.trim().toLowerCase()
  const name = arg('name')?.trim() || 'SwissHub Admin'
  const provided = arg('password')

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Fehler: --email <adresse> ist erforderlich und muss eine gültige E-Mail-Adresse sein.')
    process.exitCode = 1
    return
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } })
  if (existing) {
    console.error(`Fehler: Ein Konto mit der Adresse ${email} existiert bereits.`)
    console.error('Nutzen Sie "npm run admin:password" um das Passwort zurückzusetzen.')
    process.exitCode = 1
    return
  }

  const password = provided ?? generatePassword()
  const policy = checkPasswordPolicy(password)
  if (!policy.ok) {
    console.error(`Fehler: ${policy.message}`)
    process.exitCode = 1
    return
  }

  await prisma.adminUser.create({
    data: { email, name, passwordHash: await hashPassword(password) },
  })

  console.log(`\nAdmin-Konto angelegt:\n  E-Mail:   ${email}\n  Name:     ${name}`)
  if (!provided) {
    console.log(`  Passwort: ${password}`)
    console.log('\nBitte notieren Sie dieses Passwort jetzt – es wird nicht erneut angezeigt.')
  }
  console.log('')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
