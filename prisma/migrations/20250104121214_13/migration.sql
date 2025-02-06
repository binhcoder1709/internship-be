/*
  Warnings:

  - A unique constraint covering the columns `[studentId,internshipGroupTaskId,type]` on the table `InterviewTrainingTask` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `InterviewTrainingTask_studentId_internshipGroupTaskId_type_key` ON `InterviewTrainingTask`(`studentId`, `internshipGroupTaskId`, `type`);
