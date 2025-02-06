-- AlterTable
ALTER TABLE `ExamSet` MODIFY `type` ENUM('FREE', 'ONE_TIME', 'INTERVIEW_TRAINING') NOT NULL DEFAULT 'ONE_TIME';

-- CreateTable
CREATE TABLE `InterviewTrainingTask` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `internshipGroupTaskId` INTEGER NOT NULL,
    `status` ENUM('FINISHED', 'UNFINISHED') NOT NULL DEFAULT 'UNFINISHED',
    `type` ENUM('MORNING_QUIZZ', 'AFTERNOON_CODING', 'NIGHT_ESSAY') NOT NULL,
    `examSetId` INTEGER NOT NULL,
    `examAttemptId` INTEGER NULL,
    `isLate` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InterviewTrainingTask` ADD CONSTRAINT `InterviewTrainingTask_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InterviewTrainingTask` ADD CONSTRAINT `InterviewTrainingTask_internshipGroupTaskId_fkey` FOREIGN KEY (`internshipGroupTaskId`) REFERENCES `InternshipGroupTask`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InterviewTrainingTask` ADD CONSTRAINT `InterviewTrainingTask_examSetId_fkey` FOREIGN KEY (`examSetId`) REFERENCES `ExamSet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InterviewTrainingTask` ADD CONSTRAINT `InterviewTrainingTask_examAttemptId_fkey` FOREIGN KEY (`examAttemptId`) REFERENCES `ExamAttempt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
