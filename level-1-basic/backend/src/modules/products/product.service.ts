import AppError from "../../utils/app-error";
import { productRepository } from "./product.repository";
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryParams,
} from "./product.schema";
import { ProductResponse, PaginatedProducts } from "./product.types";

class ProductService {
  async getAllProducts(params: Partial<ProductQueryParams> = {}): Promise<PaginatedProducts> {
    const { page = 1, limit = 10 } = params;
    const { data, total } = await productRepository.findMany(params);
    const pages = Math.ceil(total / limit);

    return {
      data,
      pagination: { page, limit, total, pages },
    };
  }

  async getProductById(id: string): Promise<ProductResponse> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw AppError.notFound(`Product ${id} not found`);
    }
    return product;
  }

  async createProduct(data: CreateProductInput): Promise<ProductResponse> {
    if (data.sku && (await productRepository.skuExists(data.sku))) {
      throw AppError.conflict("SKU already exists");
    }

    return productRepository.create(data as any);
  }

  async updateProduct(id: string, data: UpdateProductInput): Promise<ProductResponse> {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw AppError.notFound(`Product ${id} not found`);
    }

    if (data.sku && (await productRepository.skuExists(data.sku, id))) {
      throw AppError.conflict("SKU already exists");
    }

    return productRepository.update(id, data as any);
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw AppError.notFound(`Product ${id} not found`);
    }

    await productRepository.delete(id);
    return { message: "Product deleted" };
  }

  async toggleStatus(id: string, isActive: boolean): Promise<ProductResponse> {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw AppError.notFound(`Product ${id} not found`);
    }

    return productRepository.toggleStatus(id, isActive);
  }
}

export const productService = new ProductService();
export default productService;