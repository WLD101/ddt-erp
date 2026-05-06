export type ShopifyCredentials = {
  shopDomain: string;
  adminAccessToken: string;
};

export type ShopifyConfig = {
  apiVersion?: string;
  useMock?: boolean;
  notes?: string;
};

export type ShopifyProductVariant = {
  id: number;
  product_id: number;
  title?: string;
  sku?: string | null;
  price?: string | null;
  inventory_quantity?: number | null;
  inventory_item_id?: number | null;
};

export type ShopifyProductImage = {
  id: number;
  src: string;
  alt?: string | null;
};

export type ShopifyProduct = {
  id: number;
  title: string;
  image?: ShopifyProductImage | null;
  images?: ShopifyProductImage[];
  variants: ShopifyProductVariant[];
};

export type ShopifyOrderLineItem = {
  id: number;
  product_id?: number | null;
  variant_id?: number | null;
  sku?: string | null;
  title: string;
  quantity: number;
  price: string;
};

export type ShopifyOrderCustomer = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type ShopifyOrder = {
  id: number;
  order_number: number;
  created_at?: string;
  financial_status?: string | null;
  fulfillment_status?: string | null;
  current_total_discounts?: string | null;
  total_shipping_price_set?: {
    shop_money?: { amount?: string | null };
  } | null;
  current_total_price?: string | null;
  customer?: ShopifyOrderCustomer | null;
  contact_email?: string | null;
  phone?: string | null;
  line_items: ShopifyOrderLineItem[];
};

export type ShopifyShop = {
  id: number;
  name: string;
  domain?: string;
  email?: string;
};
