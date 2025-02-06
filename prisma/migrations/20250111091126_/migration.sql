/*
  Warnings:

  - The values [FINISHED] on the enum `InternshipGroupTask_progress` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `InternshipGroupTask` MODIFY `progress` ENUM('WAITING', 'UNFINISHED', 'DONE_AVERAGE', 'DONE_ABOVE_AVERAGE', 'DONE_PROFICIENT', 'DONE_EXCELLENT') NOT NULL DEFAULT 'WAITING';
