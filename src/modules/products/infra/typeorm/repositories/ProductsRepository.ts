/* eslint-disable no-param-reassign */
import { getRepository, Repository, In } from 'typeorm';
import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({ where: { name } });

    return product;
  }

  public async findAllById(products: string[]): Promise<Product[]> {
    const findProduct = await this.ormRepository.find({
      where: {
        id: In(products),
      },
    });

    return findProduct;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[]
  ): Promise<Product[]> {
    const idProducts = products.map(product => ({ id: product.id }));

    const savedProducts = await this.ormRepository.findByIds(idProducts);

    const listOfProductsWithUpdatedQuantity = savedProducts.map(
      savedProduct => {
        const productList = products.find(
          product => product.id === savedProduct.id
        );

        if (!productList) throw new AppError('Product not found!');

        if (savedProduct.id === productList.id) {
          savedProduct.quantity -= productList.quantity;
        }

        return savedProduct;
      }
    );

    await this.ormRepository.save(listOfProductsWithUpdatedQuantity);

    return listOfProductsWithUpdatedQuantity;
  }
}

export default ProductsRepository;
