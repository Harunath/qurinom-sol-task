-- AlterTable
ALTER TABLE "public"."Store" ADD COLUMN     "areaId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Store" ADD CONSTRAINT "Store_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
