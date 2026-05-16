const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { safeLog } = require('../utils/logger');

const vehiclesFile = path.join(config.dataDir, 'vehicles.json');
const maintenanceFile = path.join(config.dataDir, 'maintenance.json');

const ensureDataFiles = () => {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
  if (!fs.existsSync(vehiclesFile)) {
    fs.writeFileSync(vehiclesFile, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(maintenanceFile)) {
    fs.writeFileSync(maintenanceFile, JSON.stringify([], null, 2));
  }
};

const readJsonFile = async (filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`File read failed for ${path.basename(filePath)}: ${error.message}`);
  }
};

const writeJsonFile = async (filePath, data) => {
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    throw new Error(`File write failed for ${path.basename(filePath)}: ${error.message}`);
  }
};

const getAllVehicles = async () => {
  ensureDataFiles();
  return readJsonFile(vehiclesFile);
};

const saveVehicles = async (vehicles) => {
  await writeJsonFile(vehiclesFile, vehicles);
  await safeLog('debug', 'db', `Persisted ${vehicles.length} vehicle records to vehicles.json`);
};

const getAllMaintenanceRecords = async () => {
  ensureDataFiles();
  return readJsonFile(maintenanceFile);
};

const saveMaintenanceRecords = async (records) => {
  await writeJsonFile(maintenanceFile, records);
  await safeLog(
    'debug',
    'db',
    `Persisted ${records.length} maintenance records to maintenance.json`
  );
};

const generateId = () => uuidv4();

module.exports = {
  ensureDataFiles,
  getAllVehicles,
  saveVehicles,
  getAllMaintenanceRecords,
  saveMaintenanceRecords,
  generateId,
};
