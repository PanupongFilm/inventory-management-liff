-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "has_promotion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promotion_price" DOUBLE PRECISION,
ADD COLUMN     "promotion_quantity" INTEGER,
ADD COLUMN     "selling_price" DOUBLE PRECISION,
ADD COLUMN     "totalCost" DOUBLE PRECISION,
ADD COLUMN     "unit_cost" DOUBLE PRECISION,
ADD COLUMN     "unit_price" DOUBLE PRECISION;
