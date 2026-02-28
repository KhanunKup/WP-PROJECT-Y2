CREATE TABLE IF NOT EXISTS "Users" (
	"user_id" INTEGER NOT NULL AUTOINCREMENT,
	"username" VARCHAR NOT NULL UNIQUE,
	"password" TEXT NOT NULL,
	"firstname" VARCHAR NOT NULL,
	"lastname" VARCHAR NOT NULL,
	"email" VARCHAR NOT NULL,
	"phone_number" VARCHAR NOT NULL,
	"role" VARCHAR NOT NULL,
	PRIMARY KEY("user_id")
);

CREATE TABLE IF NOT EXISTS "Products" (
	"product_id" INTEGER NOT NULL AUTOINCREMENT,
	"product_code" VARCHAR NOT NULL UNIQUE,
	"name" VARCHAR NOT NULL,
	"category" VARCHAR NOT NULL,
	"cost_price" INTEGER NOT NULL,
	"selling_price" INTEGER NOT NULL,
	"image_url" TEXT,
	PRIMARY KEY("product_id")
);

CREATE TABLE IF NOT EXISTS "Warehouses" (
	"warehouse_id" INTEGER NOT NULL AUTOINCREMENT,
	"warehouse_name" VARCHAR NOT NULL,
	"warehouse_address" TEXT NOT NULL,
	PRIMARY KEY("warehouse_id")
);

CREATE TABLE IF NOT EXISTS "Locations" (
	"location_id" INTEGER NOT NULL AUTOINCREMENT,
	"warehouse_id" INTEGER NOT NULL,
	"area" VARCHAR NOT NULL,
	PRIMARY KEY("location_id"),
	FOREIGN KEY ("warehouse_id") REFERENCES "Warehouses"("warehouse_id")
	ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "Stock_Balances" (
	"stock_id" INTEGER NOT NULL AUTOINCREMENT,
	"product_id" INTEGER NOT NULL,
	"location_id" INTEGER NOT NULL,
	"quantity" INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY("stock_id"),
	FOREIGN KEY ("product_id") REFERENCES "Products"("product_id")
	ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY ("location_id") REFERENCES "Locations"("location_id")
	ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "Inventory_Transactions" (
	"transaction_id" INTEGER NOT NULL AUTOINCREMENT,
	"product_id" INTEGER NOT NULL,
	"product_status" VARCHAR NOT NULL,
	"date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"user_id" INTEGER NOT NULL,
	"quantity" INTEGER NOT NULL,
	"transaction_type" VARCHAR NOT NULL,
	"location_id" INTEGER NOT NULL,
	PRIMARY KEY("transaction_id"),
	FOREIGN KEY ("user_id") REFERENCES "Users"("user_id")
	ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY ("product_id") REFERENCES "Products"("product_id")
	ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY ("location_id") REFERENCES "Locations"("location_id")
	ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "System_Logs" (
	"log_id" INTEGER NOT NULL AUTOINCREMENT,
	"user_id" INTEGER NOT NULL,
	"action" VARCHAR NOT NULL,
	"description" TEXT NOT NULL,
	"created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("log_id"),
	FOREIGN KEY ("user_id") REFERENCES "Users"("user_id")
	ON UPDATE NO ACTION ON DELETE NO ACTION
);