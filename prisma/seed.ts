import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { format, addDays, subDays } from 'date-fns'
import path from 'path'

const dbPath = `file:${path.join(process.cwd(), 'prisma/dev.db')}`
const adapter = new PrismaBetterSqlite3({ url: dbPath })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.booking.deleteMany()
  await prisma.dock.deleteMany()
  await prisma.slotConfig.deleteMany()

  await prisma.slotConfig.create({
    data: {
      openingTime: '06:00',
      closingTime: '18:00',
      slotDuration: 30,
      bufferMinutes: 0,
      workdays: '[1,2,3,4,5]',
    },
  })

  const docks = await Promise.all([
    prisma.dock.create({ data: { name: 'Rampe A1' } }),
    prisma.dock.create({ data: { name: 'Rampe A2' } }),
    prisma.dock.create({ data: { name: 'Rampe B1' } }),
    prisma.dock.create({ data: { name: 'Rampe B2' } }),
  ])

  const today = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  const bookings = [
    { dockId: docks[0].id, date: today, slotStart: '08:00', slotEnd: '08:30', status: 'GEBUCHT' as const, speditionName: 'DHL Express GmbH', kennzeichen: 'B-DH-1234', kontaktName: 'Max Müller', kontaktTelefon: '030-12345678', warenart: 'Pakete', anzahlPaletten: 5, referenz: 'LS-2024-001' },
    { dockId: docks[0].id, date: today, slotStart: '09:00', slotEnd: '09:30', status: 'EINGETROFFEN' as const, speditionName: 'Dachser GmbH & Co. KG', kennzeichen: 'M-DA-5678', kontaktName: 'Hans Schmidt', kontaktTelefon: '089-98765432', warenart: 'Paletten', anzahlPaletten: 12, referenz: 'LS-2024-002' },
    { dockId: docks[1].id, date: today, slotStart: '08:00', slotEnd: '08:30', status: 'IN_ABFERTIGUNG' as const, speditionName: 'DB Schenker', kennzeichen: 'HH-SC-9900', kontaktName: 'Peter Wagner', kontaktTelefon: '040-11223344', warenart: 'Schwergut', anzahlPaletten: 8, referenz: 'LS-2024-003' },
    { dockId: docks[2].id, date: today, slotStart: '10:30', slotEnd: '11:00', status: 'GEBUCHT' as const, speditionName: 'Hellmann Worldwide', kennzeichen: 'K-HE-3311', kontaktName: 'Anna Fischer', kontaktTelefon: '0221-55667788', warenart: 'Lebensmittel', anzahlPaletten: 20, referenz: 'LS-2024-004' },
    { dockId: docks[3].id, date: today, slotStart: '14:00', slotEnd: '14:30', status: 'GEBUCHT' as const, speditionName: 'Rhenus Logistics', kennzeichen: 'S-RH-2200', kontaktName: 'Klaus Becker', kontaktTelefon: '0711-99887766', warenart: 'Textilien', anzahlPaletten: 15 },
    { dockId: docks[0].id, date: today, slotStart: '11:00', slotEnd: '11:30', status: 'STORNIERT' as const, speditionName: 'Storniert Test', kennzeichen: 'L-XX-0001', kontaktName: 'Test Person', kontaktTelefon: '0000-000000', warenart: 'Sonstiges', anzahlPaletten: 1 },
    { dockId: docks[0].id, date: tomorrow, slotStart: '08:00', slotEnd: '08:30', status: 'GEBUCHT' as const, speditionName: 'DHL Express GmbH', kennzeichen: 'B-DH-1234', kontaktName: 'Max Müller', kontaktTelefon: '030-12345678', warenart: 'Pakete', anzahlPaletten: 6, referenz: 'LS-2024-010' },
    { dockId: docks[2].id, date: tomorrow, slotStart: '09:30', slotEnd: '10:00', status: 'GEBUCHT' as const, speditionName: 'GLS Germany GmbH', kennzeichen: 'N-GL-7788', kontaktName: 'Sandra Hofmann', kontaktTelefon: '0911-44556677', warenart: 'Pakete', anzahlPaletten: 3, referenz: 'LS-2024-011' },
    { dockId: docks[1].id, date: yesterday, slotStart: '15:00', slotEnd: '15:30', status: 'ABGESCHLOSSEN' as const, speditionName: 'UPS Deutschland', kennzeichen: 'DO-UP-4455', kontaktName: 'Thomas Klein', kontaktTelefon: '0231-33445566', warenart: 'Elektronik', anzahlPaletten: 10, referenz: 'LS-2024-005' },
    { dockId: docks[3].id, date: yesterday, slotStart: '11:00', slotEnd: '11:30', status: 'ABGESCHLOSSEN' as const, speditionName: 'FedEx Express', kennzeichen: 'AC-FX-6677', kontaktName: 'Maria Weber', kontaktTelefon: '0241-77889900', warenart: 'Pakete', anzahlPaletten: 7, referenz: 'LS-2024-006' },
  ]

  for (const b of bookings) {
    await prisma.booking.create({ data: b })
  }

  console.log('✅ Seed completed: 4 Rampen, 1 SlotConfig, 10 Buchungen')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
