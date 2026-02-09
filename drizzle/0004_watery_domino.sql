CREATE TABLE `call_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`callId` int NOT NULL,
	`userId` int,
	`interactionType` enum('view','save','external_link_click','share') NOT NULL,
	`interactedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `call_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `call_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`callId` int NOT NULL,
	`userId` int,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `call_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rss_feeds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`feedUrl` varchar(500) NOT NULL,
	`source` varchar(100) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`lastImportedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rss_feeds_id` PRIMARY KEY(`id`),
	CONSTRAINT `rss_feeds_feedUrl_unique` UNIQUE(`feedUrl`)
);
--> statement-breakpoint
CREATE TABLE `rss_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedId` int NOT NULL,
	`callId` int NOT NULL,
	`externalId` varchar(255) NOT NULL,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rss_imports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `call_interactions` ADD CONSTRAINT `call_interactions_callId_calls_for_entries_id_fk` FOREIGN KEY (`callId`) REFERENCES `calls_for_entries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `call_interactions` ADD CONSTRAINT `call_interactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `call_views` ADD CONSTRAINT `call_views_callId_calls_for_entries_id_fk` FOREIGN KEY (`callId`) REFERENCES `calls_for_entries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `call_views` ADD CONSTRAINT `call_views_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rss_imports` ADD CONSTRAINT `rss_imports_feedId_rss_feeds_id_fk` FOREIGN KEY (`feedId`) REFERENCES `rss_feeds`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rss_imports` ADD CONSTRAINT `rss_imports_callId_calls_for_entries_id_fk` FOREIGN KEY (`callId`) REFERENCES `calls_for_entries`(`id`) ON DELETE cascade ON UPDATE no action;