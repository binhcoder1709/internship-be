-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('MASTER', 'MODERATOR', 'LECTURE', 'BUSINESS') NOT NULL;
