export type DarazCredentials = {
  appKey: string;
  appSecret: string;
  accessToken: string;
  refreshToken?: string;
  sellerId: string;
};

export type DarazCategoryMapping = {
  primaryCategory: string;
  attributes?: Record<string, string>;
  imageUrl?: string;
  description?: string;
};

export type DarazConfig = {
  apiBaseUrl?: string;
  shopId?: string;
  useMock?: boolean;
  defaultCategoryExternalId?: string;
  defaultProductDescription?: string;
  defaultImageUrl?: string;
  defaultAttributes?: Record<string, string>;
  categoryMappings?: Record<string, DarazCategoryMapping>;
};

export type DarazProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  categoryName?: string;
  imageUrl?: string;
  status?: string;
};

export type DarazOrderItem = {
  itemId: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  salePrice: number;
};

export type DarazOrder = {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  shippingFee?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: string;
  createdAt?: string;
  items: DarazOrderItem[];
};

export type DarazSellerProfile = {
  sellerId: string;
  shopId?: string;
  shopName?: string;
};

export type DarazRequestParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type DarazSignedRequest = {
  sign: string;
  params: Record<string, string>;
};

export type DarazCreateProductPayload = {
  primary_category: string;
  name: string;
  description: string;
  attributes: Record<string, string>;
  images?: string[];
  skus: Array<{
    SellerSku: string;
    quantity: number;
    price: string;
  }>;
};

export type DarazCreateProductResponse = {
  code?: string | number;
  message?: string;
  data?: {
    product_id?: string | number;
    item_id?: string | number;
    seller_sku?: string;
  };
  success?: boolean;
};

export type DarazPublishValidation = {
  canPublish: boolean;
  missingFields: string[];
  categoryStatus: "READY" | "MISSING";
  mappingStatus: "NOT_MAPPED" | "MAPPED" | "PUBLISHED" | "DEMO_PUBLISHED";
  primaryCategory: string | null;
  attributes: Record<string, string>;
  description: string | null;
  imageUrls: string[];
};

export type DarazPublishProductRow = {
  productId: string;
  name: string;
  sku: string | null;
  price: number;
  stockQuantity: number;
  categoryName: string | null;
  mappingStatus: DarazPublishValidation["mappingStatus"];
  categoryStatus: DarazPublishValidation["categoryStatus"];
  missingFields: string[];
  canPublish: boolean;
  externalProductId: string | null;
  externalSku: string | null;
  validationLabel: string;
};

export type DarazPublishResult = {
  success: boolean;
  demoMode: boolean;
  message: string;
  channelId: string;
  productId: string;
  externalProductId?: string;
  externalSku?: string;
  missingFields?: string[];
  responseData?: unknown;
};
