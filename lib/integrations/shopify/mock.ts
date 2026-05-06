import { ShopifyOrder, ShopifyProduct, ShopifyShop } from "./types";

export const mockShopifyShop: ShopifyShop = {
  id: 88001,
  name: "Northstar Shopify Demo",
  domain: "northstar-demo.myshopify.com",
  email: "ops@northstar-demo.myshopify.com",
};

export const mockShopifyProducts: ShopifyProduct[] = [
  {
    id: 7001,
    title: "ProBook X15",
    image: { id: 1, src: "https://images.demo.local/shopify-probook.jpg" },
    images: [{ id: 1, src: "https://images.demo.local/shopify-probook.jpg" }],
    variants: [
      {
        id: 7101,
        product_id: 7001,
        title: "Default Title",
        sku: "PRO-X15",
        price: "1299.00",
        inventory_quantity: 14,
        inventory_item_id: 91001,
      },
    ],
  },
  {
    id: 7002,
    title: "Ergo Wireless Mouse",
    image: { id: 2, src: "https://images.demo.local/shopify-mouse.jpg" },
    images: [{ id: 2, src: "https://images.demo.local/shopify-mouse.jpg" }],
    variants: [
      {
        id: 7102,
        product_id: 7002,
        title: "Default Title",
        sku: "ACC-M01",
        price: "49.99",
        inventory_quantity: 52,
        inventory_item_id: 91002,
      },
    ],
  },
  {
    id: 7003,
    title: "USB-C to HDMI 2m",
    image: { id: 3, src: "https://images.demo.local/shopify-cable.jpg" },
    images: [{ id: 3, src: "https://images.demo.local/shopify-cable.jpg" }],
    variants: [
      {
        id: 7103,
        product_id: 7003,
        title: "Default Title",
        sku: "CBL-U2H",
        price: "24.00",
        inventory_quantity: 125,
        inventory_item_id: 91003,
      },
    ],
  },
];

export const mockShopifyOrders: ShopifyOrder[] = [
  {
    id: 8101,
    order_number: 1001,
    created_at: new Date().toISOString(),
    financial_status: "paid",
    fulfillment_status: "fulfilled",
    current_total_discounts: "30.00",
    total_shipping_price_set: { shop_money: { amount: "250.00" } },
    current_total_price: "1519.00",
    customer: {
      first_name: "Ali",
      last_name: "Raza",
      email: "ali.raza@example.pk",
      phone: "+92-300-4441122",
    },
    line_items: [
      {
        id: 8201,
        product_id: 7001,
        variant_id: 7101,
        sku: "PRO-X15",
        title: "ProBook X15",
        quantity: 1,
        price: "1299.00",
      },
    ],
  },
  {
    id: 8102,
    order_number: 1002,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    financial_status: "pending",
    fulfillment_status: "unfulfilled",
    current_total_discounts: "0.00",
    total_shipping_price_set: { shop_money: { amount: "180.00" } },
    current_total_price: "303.98",
    customer: {
      first_name: "Mariam",
      last_name: "Khan",
      email: "mariam.khan@example.co.uk",
      phone: "+44-7700-900123",
    },
    line_items: [
      {
        id: 8202,
        product_id: 7002,
        variant_id: 7102,
        sku: "ACC-M01",
        title: "Ergo Wireless Mouse",
        quantity: 2,
        price: "49.99",
      },
      {
        id: 8203,
        product_id: 7003,
        variant_id: 7103,
        sku: "CBL-U2H",
        title: "USB-C to HDMI 2m",
        quantity: 1,
        price: "24.00",
      },
    ],
  },
];
