import { eq, sql } from "drizzle-orm";
import { db } from "../config/database";
import { NewProduct, Product, products } from "../db/schema/products";
import { PaginatedResponse, PaginationParams } from "../types/pagination";

export class ProductService {
  async create(data: NewProduct): Promise<Product[]> {
    return await db.insert(products).values(data).returning();
  }

  async findAll(params: PaginationParams): Promise<PaginatedResponse<Product>> {
    const { offset = 0, limit = 10 } = params;

    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .then((res) => Number(res[0].count));

    const data = await db
      .select()
      .from(products)
      .limit(limit)
      .offset(offset)
      .orderBy(products.createdAt);

    return {
      data,
      pagination: {
        total: totalCount,
        offset,
        limit,
        hasMore: offset + limit < totalCount,
      },
    };
  }

  async findById(id: number): Promise<Product> {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1)
      .then((res) => res[0]);

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
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
