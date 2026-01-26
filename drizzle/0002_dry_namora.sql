CREATE TABLE `email_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`newCallsNotification` int NOT NULL DEFAULT 1,
	`deadlineReminderNotification` int NOT NULL DEFAULT 1,
	`deadlineReminderDays` int NOT NULL DEFAULT 7,
	`notificationFrequency` varchar(20) NOT NULL DEFAULT 'daily',
	`lastEmailSent` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `email_preferences` ADD CONSTRAINT `email_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;