import { CostBreakdown, ProductInfo, ShipmentInfo, ShippingMode } from "./types";

const FREIGHT_RATE_PER_KG: Record<ShippingMode, number> = {
  Sea: 15,
  Air: 40,
  Road: 10,
};

const FREIGHT_MINIMUM: Record<ShippingMode, number> = {
  Sea: 250,
  Air: 150,
  Road: 100,
};

const PORT_CHARGES: Record<ShippingMode, number> = {
  Sea: 500,
  Air: 150,
  Road: 75,
};

const TRANSIT_TIME: Record<ShippingMode, string> = {
  Sea: "15-30 days",
  Air: "2-5 days",
  Road: "5-10 days",
};

const INSURANCE_RATE = 0.01; // 1% of declared value
const IMPORT_DUTY_RATE = 0.15; // 15% of declared value
const TAX_RATE = 0.1; // 10% of (value + duty)

export function estimateTransitTime(mode: ShippingMode): string {
  return TRANSIT_TIME[mode];
}

export function calculateCosts(
  product: ProductInfo,
  shipment: ShipmentInfo
): CostBreakdown {
  const declaredValue = product.productValue * product.quantity;

  const freight = Math.max(
    shipment.weightKg * FREIGHT_RATE_PER_KG[shipment.shippingMode],
    FREIGHT_MINIMUM[shipment.shippingMode]
  );

  const insurance = round2(declaredValue * INSURANCE_RATE);
  const importDuty = round2(declaredValue * IMPORT_DUTY_RATE);
  const taxes = round2((declaredValue + importDuty) * TAX_RATE);
  const portCharges = PORT_CHARGES[shipment.shippingMode];

  const total = round2(freight + insurance + importDuty + taxes + portCharges);

  return {
    freight: round2(freight),
    insurance,
    importDuty,
    taxes,
    portCharges,
    total,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
