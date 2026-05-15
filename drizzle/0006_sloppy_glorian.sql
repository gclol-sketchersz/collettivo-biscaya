ALTER TABLE `chat_history` ADD `rating` int;--> statement-breakpoint
ALTER TABLE `chat_history` ADD `feedback` text;--> statement-breakpoint
ALTER TABLE `chat_history` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;