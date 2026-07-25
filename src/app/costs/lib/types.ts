export type ShippingMode = "Sea" | "Air" | "Road";

export interface RouteInfo {
  originCountry: string;
  originPort: string;
  destinationCountry: string;
  destinationPort: string;
  shippingDate: string; // yyyy-mm-dd
}

export interface ProductInfo {
  productName: string;
  hsCode: string;
  countryOfOrigin: string;
  quantity: number;
  productValue: number; // USD
}

export interface ShipmentInfo {
  shippingMode: ShippingMode;
  weightKg: number;
  numberOfPackages: number;
  containerType: string;
}

export interface CostBreakdown {
  freight: number;
  insurance: number;
  importDuty: number;
  taxes: number;
  portCharges: number;
  total: number;
}

export interface Calculation {
  id: string;
  createdAt: string; // yyyy-mm-dd
  route: RouteInfo;
  product: ProductInfo;
  shipment: ShipmentInfo;
  costs: CostBreakdown;
  estimatedTransitTime: string;
}
