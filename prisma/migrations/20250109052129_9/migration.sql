-- AlterTable
ALTER TABLE `InternshipApplication` ADD COLUMN `interviewStudentResponseAt` DATETIME(3) NULL,
    ADD COLUMN `interviewStudentResponseNote` VARCHAR(191) NULL,
    ADD COLUMN `interviewStudentResponseResult` BOOLEAN NULL,
    MODIFY `progress` ENUM('WAITING', 'ACCEPTED', 'INTERVIEW_WAIT_STUDENT_RESPONSE', 'INTERVIEWED', 'GROUPED') NOT NULL DEFAULT 'WAITING';
