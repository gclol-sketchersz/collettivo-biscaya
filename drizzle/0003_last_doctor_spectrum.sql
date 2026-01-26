ALTER TABLE `calls_for_entries` ADD `budgetMin` int;--> statement-breakpoint
ALTER TABLE `calls_for_entries` ADD `budgetMax` int;--> statement-breakpoint
ALTER TABLE `calls_for_entries` ADD `budgetCurrency` varchar(10) DEFAULT 'EUR';