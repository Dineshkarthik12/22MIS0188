const validateCreateVehicle = (body) => {
  const errors = [];
  const requiredFields = ['ownerName', 'vehicleNumber', 'brand', 'model', 'lastServiceDate', 'mileage'];

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push(`${field} is required`);
    }
  }

  if (body.mileage !== undefined && (isNaN(Number(body.mileage)) || Number(body.mileage) < 0)) {
    errors.push('mileage must be a non-negative number');
  }

  if (body.lastServiceDate && isNaN(Date.parse(body.lastServiceDate))) {
    errors.push('lastServiceDate must be a valid date');
  }

  return errors;
};

const validateMaintenanceRecord = (body) => {
  const errors = [];
  const requiredFields = ['serviceType', 'description', 'cost', 'serviceDate'];

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push(`${field} is required`);
    }
  }

  if (body.cost !== undefined && (isNaN(Number(body.cost)) || Number(body.cost) < 0)) {
    errors.push('cost must be a non-negative number');
  }

  if (body.serviceDate && isNaN(Date.parse(body.serviceDate))) {
    errors.push('serviceDate must be a valid date');
  }

  if (body.nextRecommendedDate && isNaN(Date.parse(body.nextRecommendedDate))) {
    errors.push('nextRecommendedDate must be a valid date when provided');
  }

  return errors;
};

module.exports = {
  validateCreateVehicle,
  validateMaintenanceRecord,
};
