import { Product } from './products.interface.js';

export interface OrderLine {
  product: Product;
  quantity: number;
}
