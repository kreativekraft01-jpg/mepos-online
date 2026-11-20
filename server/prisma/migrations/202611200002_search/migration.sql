CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Product_name_search" ON "Product" USING gin ("name" gin_trgm_ops);
CREATE INDEX "Product_sku_search" ON "Product" USING gin ("sku" gin_trgm_ops);
CREATE INDEX "Customer_name_search" ON "Customer" USING gin ("name" gin_trgm_ops);
CREATE INDEX "Customer_email_search" ON "Customer" USING gin ("email" gin_trgm_ops);
CREATE INDEX "Customer_phone_search" ON "Customer" USING gin ("phone" gin_trgm_ops);
CREATE INDEX "Product_directory_order" ON "Product" ("name","id");
CREATE INDEX "Customer_directory_order" ON "Customer" ("name","id");
