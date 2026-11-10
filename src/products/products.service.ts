import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity.js';
import { Product } from './entities/product.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(Category)
    private readonly cats: Repository<Category>,
  ) {}

  async create(dto: CreateProductDto) {
    const category = await this.cats.findOneBy({ id: dto.categoryId });
    if (!category) throw new NotFoundException('Categorie introuvable');

    return this.products.save(
      this.products.create({
        name: dto.name,
        price: dto.price.toFixed(2),
        stock: dto.stock,
        category,
      }),
    );
  }

  findAll() {
    return this.products.find({ relations: { category: true } });
  }

  async findOne(id: number) {
    const product = await this.products.findOne({
      where: { id },
      relations: { category: true },
    });

    if (!product) throw new NotFoundException('Produit introuvable');
    return product;
  }

  async remove(id: number) {
    const result = await this.products.delete(id);
    if (!result.affected) throw new NotFoundException('Produit introuvable');
  }
}
