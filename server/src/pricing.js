function getSizeTier(width, height, unit) {
  const w = unit === 'inches' ? width * 2.54 : width;
  const h = unit === 'inches' ? height * 2.54 : height;
  if (w < 60 && h < 90) return 'Small';
  if (w >= 80 || h >= 160) return 'Large';
  return 'Medium';
}

function getAreaTier(area) {
  if (area <= 2500) return 'Small';
  if (area <= 7500) return 'Medium';
  if (area <= 15000) return 'Large';
  return 'Extra Large';
}

function calculatePrice(width, height, measurementUnit, productType, quantity, squareMeters, settings) {
  const qty = quantity || 1;

  if (productType === 'Hardwood Floor') {
    const floorRate = parseFloat(settings.pricing_floor_rate || 15000);
    return (squareMeters || 0) * floorRate * qty;
  }

  const w = measurementUnit === 'inches' ? width * 2.54 : width;
  const h = measurementUnit === 'inches' ? height * 2.54 : height;
  const area = w * h;
  const tier = getAreaTier(area);

  const baseRates = JSON.parse(settings.pricing_base_rates || '{}');
  const baseRate = baseRates[tier] || 6;
  let basePrice = area * baseRate;

  if (productType === 'Base Print') {
    return Math.round(basePrice * qty * 100) / 100;
  }

  const framingMult = JSON.parse(settings.pricing_framing_multipliers || '{}');
  let framedPrice = basePrice * (framingMult[tier] || 1.5);

  if (productType === 'Glass Frame') {
    const glassMult = JSON.parse(settings.pricing_glass_multipliers || '{}');
    framedPrice = framedPrice * (glassMult[tier] || 1.5);
  }

  return Math.round(framedPrice * qty * 100) / 100;
}

function getRequiredStages(productType, settings) {
  const routing = JSON.parse(settings.production_routing || '{}');
  return routing[productType] || [];
}

function getCommission(artisans, stage, sizeTier, settings) {
  const matrix = JSON.parse(settings.commission_matrix || '{}');
  const stageRates = matrix[stage] || { 'Small': 0, 'Medium': 0, 'Large': 0 };
  const rate = stageRates[sizeTier] || 0;
  const count = Array.isArray(artisans) ? artisans.length : (artisans ? 1 : 0);
  return {
    total: rate,
    split: count > 0 ? Math.round((rate / count) * 100) / 100 : 0,
    workerCount: count
  };
}

module.exports = { calculatePrice, getSizeTier, getRequiredStages, getCommission };
