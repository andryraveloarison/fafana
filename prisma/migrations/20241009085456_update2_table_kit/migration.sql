-- AddForeignKey
ALTER TABLE "UserAppareil" ADD CONSTRAINT "UserAppareil_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
