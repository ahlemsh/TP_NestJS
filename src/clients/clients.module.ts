import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsService } from './clients.service.js';
import { ClientsController } from './clients.controller.js';
import { Client } from './entities/client.entity.js';
import { CustomerOrder } from '../orders/entities/order.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Client, CustomerOrder])],
  providers: [ClientsService],
  controllers: [ClientsController],
})
export class ClientsModule {}
