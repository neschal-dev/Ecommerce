export interface Product {
  id: string;
  title: string;
  description: string | null;
  stock: number;
  price: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
