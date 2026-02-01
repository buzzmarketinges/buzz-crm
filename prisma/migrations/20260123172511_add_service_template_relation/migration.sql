-- CreateTable
CREATE TABLE "ServiceTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DECIMAL NOT NULL,
    "companyId" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "pdfPath" TEXT,
    "lastError" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("companyId", "createdAt", "id", "isArchived", "issueDate", "items", "lastError", "number", "pdfPath", "status", "totalAmount", "updatedAt") SELECT "companyId", "createdAt", "id", "isArchived", "issueDate", "items", "lastError", "number", "pdfPath", "status", "totalAmount", "updatedAt" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PUNTUAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastBilledAt" DATETIME,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "companyId" TEXT NOT NULL,
    "serviceTemplateId" TEXT,
    CONSTRAINT "Service_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Service_serviceTemplateId_fkey" FOREIGN KEY ("serviceTemplateId") REFERENCES "ServiceTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Service" ("companyId", "description", "endDate", "id", "isActive", "lastBilledAt", "name", "price", "startDate", "type") SELECT "companyId", "description", "endDate", "id", "isActive", "lastBilledAt", "name", "price", "startDate", "type" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL DEFAULT 'BuzzMarketing',
    "companyAddress" TEXT,
    "companyEmail" TEXT,
    "companyTaxId" TEXT,
    "bankBeneficiary" TEXT,
    "bankIban" TEXT,
    "bankName" TEXT,
    "bankAddress" TEXT,
    "bankSwift" TEXT,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV-',
    "invoiceNextNumber" INTEGER NOT NULL DEFAULT 1,
    "emailSmtpHost" TEXT,
    "emailSmtpPort" INTEGER,
    "emailSmtpUser" TEXT,
    "emailSmtpPass" TEXT,
    "emailSubject" TEXT NOT NULL DEFAULT 'Factura %numfactura% - %nombreempresa%',
    "emailBodyTemplate" TEXT,
    "localSavePath" TEXT NOT NULL DEFAULT 'C:/Facturas',
    "simulatedDate" DATETIME,
    "yearlyGoal" DECIMAL NOT NULL DEFAULT 100000,
    "isAdminMode" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("bankAddress", "bankBeneficiary", "bankIban", "bankName", "bankSwift", "companyAddress", "companyEmail", "companyName", "companyTaxId", "emailBodyTemplate", "emailSmtpHost", "emailSmtpPass", "emailSmtpPort", "emailSmtpUser", "emailSubject", "id", "invoiceNextNumber", "invoicePrefix", "localSavePath", "simulatedDate", "updatedAt", "yearlyGoal") SELECT "bankAddress", "bankBeneficiary", "bankIban", "bankName", "bankSwift", "companyAddress", "companyEmail", "companyName", "companyTaxId", "emailBodyTemplate", "emailSmtpHost", "emailSmtpPass", "emailSmtpPort", "emailSmtpUser", "emailSubject", "id", "invoiceNextNumber", "invoicePrefix", "localSavePath", "simulatedDate", "updatedAt", "yearlyGoal" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTemplate_name_key" ON "ServiceTemplate"("name");
