/*
  Warnings:

  - Added the required column `internshipGroupId` to the `InternshipGroupTask` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `InternshipGroupTask` ADD COLUMN `internshipGroupId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `InternshipGroupTask` ADD CONSTRAINT `InternshipGroupTask_internshipGroupId_fkey` FOREIGN KEY (`internshipGroupId`) REFERENCES `InternshipGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
