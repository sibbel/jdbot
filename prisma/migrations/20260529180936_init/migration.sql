-- CreateTable
CREATE TABLE "Dock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SlotConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "openingTime" TEXT NOT NULL,
    "closingTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
    "workdays" TEXT NOT NULL DEFAULT '[1,2,3,4,5]',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dockId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "slotStart" TEXT NOT NULL,
    "slotEnd" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GEBUCHT',
    "speditionName" TEXT NOT NULL,
    "kennzeichen" TEXT NOT NULL,
    "referenz" TEXT,
    "kontaktName" TEXT NOT NULL,
    "kontaktTelefon" TEXT NOT NULL,
    "warenart" TEXT NOT NULL,
    "anzahlPaletten" INTEGER NOT NULL,
    "bemerkung" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_dockId_fkey" FOREIGN KEY ("dockId") REFERENCES "Dock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Dock_name_key" ON "Dock"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_dockId_date_slotStart_key" ON "Booking"("dockId", "date", "slotStart");
