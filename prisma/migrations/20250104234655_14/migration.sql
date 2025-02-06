-- AlterTable
ALTER TABLE `InternshipApplication` ADD COLUMN `internshipGroupId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `InternshipApplication` ADD CONSTRAINT `InternshipApplication_internshipGroupId_fkey` FOREIGN KEY (`internshipGroupId`) REFERENCES `InternshipGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
