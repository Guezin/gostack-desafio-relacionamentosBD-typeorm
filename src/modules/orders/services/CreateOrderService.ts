import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import IOrdersRepository from '../repositories/IOrdersRepository';
import Order from '../infra/typeorm/entities/Order';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Sorry, but this customer was not found!');
    }

    const idProducts = products.map(product => product.id);
    const savedProducts = await this.productsRepository.findAllById(idProducts);

    if (idProducts.length !== savedProducts.length) {
      throw new AppError('Sorry, but some product(s) was not found!');
    }

    const requestedProducts = savedProducts.map(savedProduct => {
      const findProducts = products.find(
        product => product.id === savedProduct.id
      );

      if (!findProducts) throw new AppError('Product not found!');

      if (savedProduct.quantity < findProducts.quantity) {
        throw new AppError(
          `Sorry, insufficient quantity for the product: ${savedProduct.name}, total quantity in stock: ${savedProduct.quantity}`
        );
      }

      return {
        product_id: savedProduct.id,
        price: savedProduct.price,
        quantity: findProducts.quantity,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: requestedProducts,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
