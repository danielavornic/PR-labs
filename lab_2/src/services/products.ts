import { eq } from "drizzle-orm";
import { db } from "../config/database";
import { NewProduct, Product, products } from "../db/schema/products";

export class ProductService {
  async create(data: NewProduct): Promise<Product[]> {
    return await db.insert(products).values(data).returning();
  }

  async findAll(offset: number = 0, limit: number = 10): Promise<Product[]> {
    return await db.select().from(products).limit(limit).offset(offset);
  }

  async findById(id: number): Promise<Product | null> {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return result[0] || null;
  }

  async update(id: number, data: Partial<NewProduct>): Promise<Product[]> {
    return await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
  }

  async delete(id: number): Promise<Product[]> {
    return await db.delete(products).where(eq(products.id, id)).returning();
  }
}
