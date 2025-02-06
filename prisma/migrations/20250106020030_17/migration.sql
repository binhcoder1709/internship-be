/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `SchoolAdmin` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `SchoolAdmin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `SchoolAdmin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SchoolAdmin` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `SchoolAdmin` DROP FOREIGN KEY `SchoolAdmin_schoolId_fkey`;

-- DropIndex
DROP INDEX `SchoolAdmin_schoolId_fkey` ON `SchoolAdmin`;

-- AlterTable
ALTER TABLE `SchoolAdmin` ADD COLUMN `avatar` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ADD COLUMN `fullName` VARCHAR(191) NULL,
    ADD COLUMN `password` VARCHAR(191) NOT NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `schoolId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `SchoolAdmin_email_key` ON `SchoolAdmin`(`email`);

-- AddForeignKey
ALTER TABLE `SchoolAdmin` ADD CONSTRAINT `SchoolAdmin_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
