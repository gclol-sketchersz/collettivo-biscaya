CREATE TABLE `entity_scoring_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityId` int,
	`previousScore` int,
	`newScore` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entity_scoring_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int,
	`callId` int,
	`externalId` varchar(255),
	`status` enum('success','duplicate','filtered','error') NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `import_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('rss','api','webscrape','social_media') NOT NULL,
	`url` varchar(500) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`lastImportedAt` timestamp,
	`nextImportAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `import_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `import_sources_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `verified_entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('foundation','institution','government','private','nonprofit') NOT NULL,
	`country` varchar(2) NOT NULL,
	`website` varchar(500),
	`authorityScore` int NOT NULL DEFAULT 50,
	`isVerified` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verified_entities_id` PRIMARY KEY(`id`),
	CONSTRAINT `verified_entities_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `entity_scoring_history` ADD CONSTRAINT `entity_scoring_history_entityId_verified_entities_id_fk` FOREIGN KEY (`entityId`) REFERENCES `verified_entities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `import_logs` ADD CONSTRAINT `import_logs_sourceId_import_sources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `import_sources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `import_logs` ADD CONSTRAINT `import_logs_callId_calls_for_entries_id_fk` FOREIGN KEY (`callId`) REFERENCES `calls_for_entries`(`id`) ON DELETE cascade ON UPDATE no action;