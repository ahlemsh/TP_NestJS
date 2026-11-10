import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { CustomerOrder } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { Client } from '../clients/entities/client.entity.js';
import { Product } from '../products/entities/product.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerOrder, OrderItem, Client, Product])],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
