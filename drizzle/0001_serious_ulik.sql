CREATE TABLE `calls_for_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`entity` varchar(255) NOT NULL,
	`country` varchar(100) NOT NULL,
	`geographicLevel` enum('regional','national','european') NOT NULL,
	`callType` enum('exhibition','residency','competition','grant','award','fellowship','curatorial_open_call') NOT NULL,
	`deadline` timestamp NOT NULL,
	`requirements` text,
	`benefits` text,
	`externalLink` varchar(500),
	`costs` varchar(255),
	`qualitativeNotes` text,
	`accessibility` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calls_for_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`callId` int,
	`type` enum('new_call','deadline_reminder','subscription_update') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_calls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`callId` int NOT NULL,
	`savedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_calls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`level` enum('base','premium','pro') NOT NULL DEFAULT 'base',
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_callId_calls_for_entries_id_fk` FOREIGN KEY (`callId`) REFERENCES `calls_for_entries`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_calls` ADD CONSTRAINT `saved_calls_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_calls` ADD CONSTRAINT `saved_calls_callId_calls_for_entries_id_fk` FOREIGN KEY (`callId`) REFERENCES `calls_for_entries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;