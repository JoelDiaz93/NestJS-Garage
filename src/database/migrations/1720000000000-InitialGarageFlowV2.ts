import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialGarageFlowV21720000000000 implements MigrationInterface {
  name = 'InitialGarageFlowV21720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM ('admin','advisor','technician')`);
    await queryRunner.query(`CREATE TYPE "catalog_item_type_enum" AS ENUM ('product','service')`);
    await queryRunner.query(`CREATE TYPE "stock_movement_reason_enum" AS ENUM ('purchase','return','correction','work_order','initial')`);
    await queryRunner.query(`CREATE TYPE "quote_status_enum" AS ENUM ('draft','sent','approved','rejected','expired')`);
    await queryRunner.query(`CREATE TYPE "work_order_status_enum" AS ENUM ('received','diagnosis','waiting_approval','in_progress','ready','delivered','cancelled')`);

    await queryRunner.query(`CREATE TABLE "users" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "email" varchar NOT NULL,
      "password" varchar NOT NULL,
      "fullName" varchar NOT NULL,
      "roles" user_role_enum array NOT NULL DEFAULT '{advisor}',
      "isActive" boolean NOT NULL DEFAULT true,
      CONSTRAINT "UQ_users_email" UNIQUE ("email"),
      CONSTRAINT "PK_users" PRIMARY KEY ("id")
    )`);

    await queryRunner.query(`CREATE TABLE "refresh_tokens" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "userId" uuid NOT NULL,
      "tokenHash" varchar(64) NOT NULL,
      "expiresAt" timestamptz NOT NULL,
      "revokedAt" timestamptz,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "UQ_refresh_token_hash" UNIQUE ("tokenHash"),
      CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
      CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_user" ON "refresh_tokens" ("userId")`);

    await queryRunner.query(`CREATE TABLE "clients" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "fullName" varchar NOT NULL,
      "document" varchar NOT NULL,
      "email" varchar,
      "phone" varchar,
      "address" varchar,
      "active" boolean NOT NULL DEFAULT true,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "UQ_clients_document" UNIQUE ("document"),
      CONSTRAINT "PK_clients" PRIMARY KEY ("id")
    )`);

    await queryRunner.query(`CREATE TABLE "vehicles" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "plate" varchar NOT NULL,
      "make" varchar NOT NULL,
      "model" varchar NOT NULL,
      "year" integer NOT NULL,
      "vin" varchar,
      "color" varchar,
      "mileage" integer,
      "notes" varchar,
      "clientId" uuid NOT NULL,
      CONSTRAINT "UQ_vehicles_plate" UNIQUE ("plate"),
      CONSTRAINT "PK_vehicles" PRIMARY KEY ("id"),
      CONSTRAINT "FK_vehicles_client" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT
    )`);

    await queryRunner.query(`CREATE TABLE "catalog_items" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "sku" varchar NOT NULL,
      "name" varchar NOT NULL,
      "type" catalog_item_type_enum NOT NULL,
      "price" numeric(12,2) NOT NULL,
      "cost" numeric(12,2) NOT NULL DEFAULT 0,
      "stock" integer NOT NULL DEFAULT 0,
      "minStock" integer NOT NULL DEFAULT 0,
      "active" boolean NOT NULL DEFAULT true,
      "description" text,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "UQ_catalog_sku" UNIQUE ("sku"),
      CONSTRAINT "PK_catalog_items" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_catalog_name" ON "catalog_items" ("name")`);

    await queryRunner.query(`CREATE TABLE "inventory_movements" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "catalogItemId" uuid NOT NULL,
      "quantityChange" integer NOT NULL,
      "stockBefore" integer NOT NULL,
      "stockAfter" integer NOT NULL,
      "reason" stock_movement_reason_enum NOT NULL,
      "note" text,
      "performedByUserId" uuid,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_inventory_movements" PRIMARY KEY ("id"),
      CONSTRAINT "FK_inventory_item" FOREIGN KEY ("catalogItemId") REFERENCES "catalog_items"("id") ON DELETE RESTRICT
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_item" ON "inventory_movements" ("catalogItemId")`);

    await queryRunner.query(`CREATE TABLE "quotes" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "number" varchar NOT NULL,
      "status" quote_status_enum NOT NULL DEFAULT 'draft',
      "clientId" uuid NOT NULL,
      "vehicleId" uuid NOT NULL,
      "subtotal" numeric(12,2) NOT NULL DEFAULT 0,
      "discountPct" numeric(5,2) NOT NULL DEFAULT 0,
      "discountAmount" numeric(12,2) NOT NULL DEFAULT 0,
      "taxRate" numeric(5,4) NOT NULL DEFAULT 0.15,
      "tax" numeric(12,2) NOT NULL DEFAULT 0,
      "total" numeric(12,2) NOT NULL DEFAULT 0,
      "notes" text,
      "expiresAt" timestamptz NOT NULL,
      "approvedAt" timestamptz,
      "rejectedAt" timestamptz,
      "createdByUserId" uuid,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "UQ_quotes_number" UNIQUE ("number"),
      CONSTRAINT "PK_quotes" PRIMARY KEY ("id"),
      CONSTRAINT "FK_quotes_client" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_quotes_vehicle" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT
    )`);

    await queryRunner.query(`CREATE TABLE "quote_items" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "catalogItemId" uuid NOT NULL,
      "sku" varchar NOT NULL,
      "description" varchar NOT NULL,
      "type" catalog_item_type_enum NOT NULL,
      "unitPrice" numeric(12,2) NOT NULL,
      "quantity" numeric(10,2) NOT NULL DEFAULT 1,
      "lineTotal" numeric(12,2) NOT NULL,
      "quoteId" uuid,
      CONSTRAINT "PK_quote_items" PRIMARY KEY ("id"),
      CONSTRAINT "FK_quote_items_quote" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE
    )`);

    await queryRunner.query(`CREATE TABLE "work_orders" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "number" varchar NOT NULL,
      "status" work_order_status_enum NOT NULL DEFAULT 'received',
      "clientId" uuid NOT NULL,
      "vehicleId" uuid NOT NULL,
      "quoteId" uuid,
      "technicianId" uuid,
      "diagnosis" text,
      "notes" text,
      "estimatedTotal" numeric(12,2) NOT NULL DEFAULT 0,
      "actualTotal" numeric(12,2),
      "assignedAt" timestamptz,
      "startedAt" timestamptz,
      "completedAt" timestamptz,
      "deliveredAt" timestamptz,
      "stockConsumedAt" timestamptz,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "UQ_work_orders_number" UNIQUE ("number"),
      CONSTRAINT "UQ_work_orders_quote" UNIQUE ("quoteId"),
      CONSTRAINT "PK_work_orders" PRIMARY KEY ("id"),
      CONSTRAINT "FK_work_orders_client" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_work_orders_vehicle" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_work_orders_quote" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_work_orders_technician" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE SET NULL
    )`);

    await queryRunner.query(`CREATE TABLE "work_order_evidence" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "workOrderId" uuid NOT NULL,
      "filename" varchar NOT NULL,
      "originalName" varchar NOT NULL,
      "mimeType" varchar NOT NULL,
      "size" integer NOT NULL,
      "uploadedByUserId" uuid,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_work_order_evidence" PRIMARY KEY ("id"),
      CONSTRAINT "FK_evidence_work_order" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_evidence_work_order" ON "work_order_evidence" ("workOrderId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "work_order_evidence"');
    await queryRunner.query('DROP TABLE IF EXISTS "work_orders"');
    await queryRunner.query('DROP TABLE IF EXISTS "quote_items"');
    await queryRunner.query('DROP TABLE IF EXISTS "quotes"');
    await queryRunner.query('DROP TABLE IF EXISTS "inventory_movements"');
    await queryRunner.query('DROP TABLE IF EXISTS "catalog_items"');
    await queryRunner.query('DROP TABLE IF EXISTS "vehicles"');
    await queryRunner.query('DROP TABLE IF EXISTS "clients"');
    await queryRunner.query('DROP TABLE IF EXISTS "refresh_tokens"');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');
    await queryRunner.query('DROP TYPE IF EXISTS "work_order_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "quote_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "stock_movement_reason_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "catalog_item_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "user_role_enum"');
  }
}
