const addDays = (dateInput, days) => {
  const date = new Date(dateInput);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const isDateOnOrBefore = (dateStr, referenceDate = new Date()) => {
  const target = new Date(dateStr);
  const ref = new Date(referenceDate);
  target.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);
  return target <= ref;
};

const isDateWithinDays = (dateStr, days, referenceDate = new Date()) => {
  const target = new Date(dateStr);
  const ref = new Date(referenceDate);
  const limit = new Date(referenceDate);
  limit.setDate(limit.getDate() + days);
  target.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);
  limit.setHours(23, 59, 59, 999);
  return target >= ref && target <= limit;
};

module.exports = {
  addDays,
  isDateOnOrBefore,
  isDateWithinDays,
};
