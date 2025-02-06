-- CreateTable
CREATE TABLE `School` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `School_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SchoolAdmin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `schoolId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Student` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `verifyAt` DATETIME(3) NULL,
    `status` ENUM('INACTIVE', 'ACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NULL,
    `fullName` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `avatar` VARCHAR(191) NULL,
    `birthday` DATETIME(3) NULL,
    `schoolId` INTEGER NULL,

    UNIQUE INDEX `Student_email_key`(`email`),
    UNIQUE INDEX `Student_phoneNumber_key`(`phoneNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LanguageProgramming` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `templateTest` TEXT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `LanguageProgramming_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InternshipPosition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamSet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `timeLimit` INTEGER NOT NULL DEFAULT 20,
    `questionCount` INTEGER NOT NULL DEFAULT 0,
    `type` ENUM('FREE', 'ONE_TIME') NOT NULL DEFAULT 'ONE_TIME',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InternshipPositionRequirement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `internshipPositionId` INTEGER NOT NULL,
    `examSetId` INTEGER NOT NULL,
    `minimumCompletionRate` INTEGER NOT NULL,

    UNIQUE INDEX `InternshipPositionRequirement_internshipPositionId_examSetId_key`(`internshipPositionId`, `examSetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('MULTIPLE_CHOICE', 'CODING', 'FILL_IN_THE_BLANK', 'ESSAY') NOT NULL DEFAULT 'CODING',
    `languageId` INTEGER NULL,
    `questionText` VARCHAR(191) NOT NULL,
    `choiceList` VARCHAR(191) NULL,
    `choiceCorrectIndex` INTEGER NULL,
    `codingInitCode` TEXT NULL,
    `codingTestTemplate` TEXT NULL,
    `codingTestCases` TEXT NULL,
    `codingPerformanceCheck` BOOLEAN NOT NULL DEFAULT false,
    `codingTimeLimit` INTEGER NULL DEFAULT 2000,
    `codingMemoryLimit` INTEGER NULL DEFAULT 128000,
    `fillAswer` VARCHAR(191) NULL,
    `fillCaseSensitive` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamSetQuestion` (
    `examSetId` INTEGER NOT NULL,
    `questionId` INTEGER NOT NULL,
    `order` INTEGER NULL,

    PRIMARY KEY (`examSetId`, `questionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamAttempt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `examSetId` INTEGER NOT NULL,
    `startTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endTime` DATETIME(3) NULL,
    `note` VARCHAR(191) NULL,
    `completionRate` DOUBLE NULL,
    `orderQuestionList` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionSubmission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `attemptId` INTEGER NOT NULL,
    `questionId` INTEGER NOT NULL,
    `answer` TEXT NOT NULL,
    `result` TEXT NULL,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NULL,
    `role` ENUM('MASTER', 'MODERATOR', 'LECTURE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InternshipApplication` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `internshipPositionId` INTEGER NOT NULL,
    `address` VARCHAR(191) NULL,
    `type` ENUM('PART_TIME', 'FULL_TIME') NOT NULL DEFAULT 'FULL_TIME',
    `progress` ENUM('WAITING', 'ACCEPTED', 'INTERVIEWED', 'GROUPED') NOT NULL DEFAULT 'WAITING',
    `cancelAt` DATETIME(3) NULL,
    `cancelReason` VARCHAR(191) NULL,
    `rejectAt` DATETIME(3) NULL,
    `rejectReason` VARCHAR(191) NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `acceptedAt` DATETIME(3) NULL,
    `interviewedAt` DATETIME(3) NULL,
    `groupedAt` DATETIME(3) NULL,
    `interviewLink` VARCHAR(191) NULL,
    `interviewTime` DATETIME(3) NULL,
    `interviewNote` VARCHAR(191) NULL,
    `interviewResult` ENUM('NOT_INTERVIEWED', 'PASS', 'FAIL') NOT NULL DEFAULT 'NOT_INTERVIEWED',

    UNIQUE INDEX `InternshipApplication_studentId_internshipPositionId_key`(`studentId`, `internshipPositionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InternshipProject` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `duration` INTEGER NOT NULL,
    `srsTemplateUrl` VARCHAR(191) NULL,
    `taskListUrl` VARCHAR(191) NULL,
    `uiDesignUrl` VARCHAR(191) NULL,
    `databaseDesignUrl` VARCHAR(191) NULL,
    `projectStructureUrl` VARCHAR(191) NULL,
    `projectPlanUrl` VARCHAR(191) NULL,
    `memberCount` INTEGER NOT NULL DEFAULT 1,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InternshipGroup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `startAt` DATETIME(3) NULL,
    `finishAt` DATETIME(3) NULL,
    `internshipProjectId` INTEGER NULL,
    `ownerId` INTEGER NOT NULL,
    `progress` ENUM('WAITING_FOR_MENTOR', 'WAITING_FOR_STUDENT', 'WAITING_FOR_PROJECT', 'START_PROJECT', 'FINISH_PROJECT') NOT NULL DEFAULT 'WAITING_FOR_MENTOR',

    UNIQUE INDEX `InternshipGroup_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InternshipGroupMonderator` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `internshipGroupId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InternshipGroupStudent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `internshipGroupId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `InternshipGroupStudent_studentId_internshipGroupId_key`(`studentId`, `internshipGroupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InternshipGroupTask` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `startDate` DATETIME(3) NULL,
    `finishDate` DATETIME(3) NULL,
    `progress` ENUM('WAITING', 'FINISHED', 'UNFINISHED', 'DONE_AVERAGE', 'DONE_ABOVE_AVERAGE', 'DONE_PROFICIENT', 'DONE_EXCELLENT') NOT NULL DEFAULT 'WAITING',
    `regulations` VARCHAR(255) NOT NULL DEFAULT '[]',
    `mentorCommand` TEXT NULL,
    `taskName` TEXT NULL,
    `taskDetailMorning` TEXT NULL,
    `taskDetailAfternoon` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SchoolAdmin` ADD CONSTRAINT `SchoolAdmin_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InternshipPositionRequirement` ADD CONSTRAINT `InternshipPositionRequirement_internshipPositionId_fkey` FOREIGN KEY (`internshipPositionId`) REFERENCES `InternshipPosition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InternshipPositionRequirement` ADD CONSTRAINT `InternshipPositionRequirement_examSetId_fkey` FOREIGN KEY (`examSetId`) REFERENCES `ExamSet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_languageId_fkey` FOREIGN KEY (`languageId`) REFERENCES `LanguageProgramming`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamSetQuestion` ADD CONSTRAINT `ExamSetQuestion_examSetId_fkey` FOREIGN KEY (`examSetId`) REFERENCES `ExamSet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamSetQuestion` ADD CONSTRAINT `ExamSetQuestion_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamAttempt` ADD CONSTRAINT `ExamAttempt_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamAttempt` ADD CONSTRAINT `ExamAttempt_examSetId_fkey` FOREIGN KEY (`examSetId`) REFERENCES `ExamSet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionSubmission` ADD CONSTRAINT `QuestionSubmission_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `ExamAttempt`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionSubmission` ADD CONSTRAINT `QuestionSubmission_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InternshipApplication` ADD CONSTRAINT `InternshipApplication_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InternshipApplication` ADD CONSTRAINT `InternshipApplication_internshipPositionId_fkey` FOREIGN KEY (`internshipPositionId`) REFERENCES `InternshipPosition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InternshipGroup` ADD CONSTRAINT `InternshipGroup_internshipProjectId_fkey` FOREIGN KEY (`internshipProjectId`) REFERENCES `InternshipProject`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InternshipGroup` ADD CONSTRAINT `InternshipGroup_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InternshipGroupMonderator` ADD CONSTRAINT `InternshipGroupMonderator_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InternshipGroupMonderator` ADD CONSTRAINT `InternshipGroupMonderator_internshipGroupId_fkey` FOREIGN KEY (`internshipGroupId`) REFERENCES `InternshipGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InternshipGroupStudent` ADD CONSTRAINT `InternshipGroupStudent_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InternshipGroupStudent` ADD CONSTRAINT `InternshipGroupStudent_internshipGroupId_fkey` FOREIGN KEY (`internshipGroupId`) REFERENCES `InternshipGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InternshipGroupTask` ADD CONSTRAINT `InternshipGroupTask_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
