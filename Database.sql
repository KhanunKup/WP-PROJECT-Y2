CREATE TABLE IF NOT EXISTS "Roles" (
    "role_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "role_name" VARCHAR NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "Categories" (
    "category_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "category_name" VARCHAR NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "Warehouses" (
    "warehouse_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "warehouse_name" VARCHAR NOT NULL,
    "warehouse_address" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Users" (
    "user_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "username" VARCHAR NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "firstname" VARCHAR NOT NULL,
    "lastname" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL UNIQUE,
    "phone_number" VARCHAR NOT NULL,
    "role_id" INTEGER NOT NULL,
    FOREIGN KEY ("role_id") REFERENCES "Roles"("role_id") 
    ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "Products" (
    "product_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "product_code" VARCHAR NOT NULL UNIQUE,
    "name" VARCHAR NOT NULL,
    "category_id" INTEGER NOT NULL,
    "cost_price" INTEGER NOT NULL,
    "selling_price" INTEGER NOT NULL,
    "image_url" TEXT,
    FOREIGN KEY ("category_id") REFERENCES "Categories"("category_id") 
    ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "Locations" (
    "location_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "area" VARCHAR NOT NULL,
    FOREIGN KEY ("warehouse_id") REFERENCES "Warehouses"("warehouse_id") 
    ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "Stock_Balances" (
    "stock_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "product_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY ("product_id") REFERENCES "Products"("product_id") 
    ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY ("location_id") REFERENCES "Locations"("location_id") 
    ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "Inventory_Transactions" (
    "transaction_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "product_id" INTEGER NOT NULL,
    "product_status" VARCHAR NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "transaction_type" VARCHAR NOT NULL,
    "location_id" INTEGER NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") 
    ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY ("product_id") REFERENCES "Products"("product_id") 
    ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY ("location_id") REFERENCES "Locations"("location_id") 
    ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "System_Logs" (
    "log_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") 
    ON UPDATE NO ACTION ON DELETE NO ACTION
);