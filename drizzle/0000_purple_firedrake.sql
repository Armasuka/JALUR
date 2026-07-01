CREATE TABLE `deteksi` (
	`id_deteksi` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_laporan` integer NOT NULL,
	`kelas` text NOT NULL,
	`confidence_score` real NOT NULL,
	`bbox_x` real NOT NULL,
	`bbox_y` real NOT NULL,
	`bbox_width` real NOT NULL,
	`bbox_height` real NOT NULL,
	`image_index` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`id_laporan`) REFERENCES `laporan`(`id_laporan`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `laporan` (
	`id_laporan` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kode_unik` text NOT NULL,
	`email` text NOT NULL,
	`tanggal` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`alamat` text,
	`gambar` text NOT NULL,
	`deskripsi` text,
	`rds_score` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `laporan_kode_unik_unique` ON `laporan` (`kode_unik`);