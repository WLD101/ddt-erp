export type WooCredentials = {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
};

export type WooConfig = {
  useMock?: boolean;
};

export type WooProduct = {
  id: number;
  name: string;
  sku: string;
  regular_price?: string;
  sale_price?: string;
  stock_quantity?: number | null;
  manage_stock?: boolean;
  stock_status?: string;
  categories?: Array<{ id: number; name: string }>;
  images?: Array<{ id: number; src: string; alt?: string }>;
};

export type WooOrder = {
  id: number;
  number: string;
  status: string;
  date_created?: string;
  subtotal?: string;
  total_discount?: string;
  shipping_total?: string;
  total: string;
  payment_method?: string;
  payment_method_title?: string;
  billing?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address_1?: string;
    city?: string;
    country?: string;
  };
  line_items: Array<{
    id: number;
    product_id: number;
    sku?: string;
    name: string;
    quantity: number;
    price?: number;
    subtotal?: string;
    total?: string;
  }>;
};

export type WooSystemStatus = {
  environment?: {
    home_url?: string;
    version?: string;
  };
  settings?: {
    currency?: string;
  };
};
