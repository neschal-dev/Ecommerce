import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { Product } from './interface/product.interface.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async findProductById(id: string) {
    return this.prisma.orm.Product.where({ id }).all();
  }

  async findAllProducts(): Promise<Product[]> {
    return await this.prisma.orm.Product.all();
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    return await this.prisma.orm.Product.create({
      ...createProductDto,
      price: createProductDto.price.toFixed(2),
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { price, ...rest } = updateProductDto;

    const product = await this.prisma.orm.Product.where({ id }).update({
      ...rest,
      ...(price !== undefined && { price: price.toFixed(2) }),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async updateStatus(id: string, status: boolean) {
    const product = await this.prisma.orm.Product.where({ id }).update({
      isActive: status,
    });
    if (!product) {
      throw new InternalServerErrorException('Product Status Failed to update');
    }
    return product;
  }

  async delete(id: string) {
    const product = await this.prisma.orm.Product.where({ id }).delete();
    if (!product) {
      throw new InternalServerErrorException('Product Failed to delete');
    }
    return product;
  }
}
