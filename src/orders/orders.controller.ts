import { Controller, Post } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  @Post()
  async create(createOrderDto: CreateOrderDto) {
    return this.ordersService.order(createOrderDto);
  }

  
}
