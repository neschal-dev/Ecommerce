import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UsersService } from '../users/users.service.js';
import { OrderLine } from './interface/orderline.dto.js';

// Money as integer minor units (paise): "123.45" -> 12345.
// Integers add exactly; floats like 0.1 + 0.2 do not.
const toMinor = (amount: string) => Math.round(Number(amount) * 100);
const fromMinor = (minor: number) => (minor / 100).toFixed(2);

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
  ) {}

  private async createOrderTransaction(
    userId: string,
    shippingAddress: string,
    merged: Map<string, number>,
  ) {
    const productIds = [...merged.keys()];

    return this.prisma.db.transaction(async (tx) => {
      // 1. Lock products. Fetch all in one query and LOCK those rows until
      // the transaction ends. A concurrent order for the same products waits
      // here. Ordering by id keeps lock order consistent (avoids deadlocks).
      const products = await tx.orm.public.Product.where((p) =>
        p.id.in(productIds),
      )
        .orderBy((p) => p.id.asc())
        .forUpdate()
        .all();

      const productById = new Map(products.map((p) => [p.id, p]));

      // 2. Validate against the locked rows and compute the total.
      const lines: OrderLine[] = [];
      let totalMinor = 0;

      for (const [productId, quantity] of merged) {
        const product = productById.get(productId);

        if (!product) {
          throw new NotFoundException(`Product ${productId} not found`);
        }
        if (!product.isActive) {
          throw new BadRequestException(`${product.title} is not available`);
        }
        if (product.stock < quantity) {
          throw new BadRequestException(
            `Not enough stock for ${product.title}`,
          );
        }

        totalMinor += toMinor(product.price) * quantity;
        lines.push({ product, quantity });
      }

      // 3. Decrement stock (safe: rows are locked and already checked).
      for (const { product, quantity } of lines) {
        await tx.orm.public.Product.where({ id: product.id }).update({
          stock: product.stock - quantity,
        });
      }

      // 4. Create the order. Status defaults to PENDING.
      const order = await tx.orm.public.Order.create({
        userId,
        shippingAddress,
        totalAmount: fromMinor(totalMinor),
      });

      // 5. Create the items, snapshotting the price from the product row.
      const orderItems = [];

      for (const { product, quantity } of lines) {
        orderItems.push(
          await tx.orm.public.OrderItem.create({
            orderId: order.id,
            productId: product.id,
            price: product.price,
            quantity,
          }),
        );
      }

      // Return AFTER the loop, so every item is created first.
      return { ...order, items: orderItems };
    });
  }

  async order(createOrderDto: CreateOrderDto) {
    const { userId, shippingAddress, items } = createOrderDto;

    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Merge duplicate productIds by adding their quantities.
    const merged = new Map<string, number>();

    for (const item of items) {
      merged.set(
        item.productId,
        (merged.get(item.productId) ?? 0) + item.quantity,
      );
    }

    return this.createOrderTransaction(userId, shippingAddress, merged);
  }
}