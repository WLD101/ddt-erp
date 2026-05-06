import { DarazOrder, DarazProduct, DarazSellerProfile } from "./types";

export const mockDarazSellerProfile: DarazSellerProfile = {
  sellerId: "daraz-pk-demo",
  shopId: "northstar-daraz-demo",
  shopName: "Northstar Daraz Pakistan",
};

export const mockDarazProducts: DarazProduct[] = [
  {
    id: "daraz-prod-1001",
    name: "ProBook X15",
    sku: "PRO-X15",
    price: 1299,
    quantity: 16,
    categoryName: "Electronics",
    imageUrl: "https://images.demo.local/probook-x15.jpg",
    status: "live",
  },
  {
    id: "daraz-prod-1002",
    name: "Ergo Wireless Mouse",
    sku: "ACC-M01",
    price: 49.99,
    quantity: 60,
    categoryName: "Accessories",
    imageUrl: "https://images.demo.local/ergo-mouse.jpg",
    status: "live",
  },
  {
    id: "daraz-prod-1003",
    name: "USB-C to HDMI 2m",
    sku: "CBL-U2H",
    price: 24,
    quantity: 140,
    categoryName: "Cables",
    imageUrl: "https://images.demo.local/usb-c-hdmi.jpg",
    status: "live",
  },
];

export const mockDarazOrders: DarazOrder[] = [
  {
    orderId: "daraz-order-2001",
    orderNumber: "2001-PK",
    status: "delivered",
    paymentMethod: "Cash on Delivery",
    paymentStatus: "paid",
    shippingFee: 250,
    customerName: "Ayesha Khan",
    customerPhone: "+92-300-1234567",
    customerEmail: "ayesha.khan@example.pk",
    shippingAddress: "Johar Town, Lahore, Pakistan",
    createdAt: new Date().toISOString(),
    items: [
      {
        itemId: "daraz-order-item-1",
        productId: "daraz-prod-1001",
        sku: "PRO-X15",
        name: "ProBook X15",
        quantity: 1,
        salePrice: 1299,
      },
    ],
  },
  {
    orderId: "daraz-order-2002",
    orderNumber: "2002-PK",
    status: "packed",
    paymentMethod: "Card",
    paymentStatus: "pending",
    shippingFee: 180,
    customerName: "Bilal Ahmed",
    customerPhone: "+92-321-7654321",
    customerEmail: "bilal.ahmed@example.pk",
    shippingAddress: "DHA Phase 6, Karachi, Pakistan",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    items: [
      {
        itemId: "daraz-order-item-2",
        productId: "daraz-prod-1002",
        sku: "ACC-M01",
        name: "Ergo Wireless Mouse",
        quantity: 2,
        salePrice: 49.99,
      },
      {
        itemId: "daraz-order-item-3",
        productId: "daraz-prod-1003",
        sku: "CBL-U2H",
        name: "USB-C to HDMI 2m",
        quantity: 1,
        salePrice: 24,
      },
    ],
  },
];
