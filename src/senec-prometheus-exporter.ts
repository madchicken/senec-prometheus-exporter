#!/usr/bin/env node
import express, { Express } from 'express';
import yargs = require('yargs');
import client, { register } from 'prom-client';
import fetch from 'node-fetch';

function hex2float(hexNum: string) {
  const bytes = new Uint8Array(hexNum.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  const bits = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  const sign = bits >>> 31 == 0 ? 1.0 : -1.0;
  const e = (bits >>> 23) & 0xff;
  const m = e == 0 ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000;
  const f = sign * m * Math.pow(2, e - 150);

  return Number(f.toFixed(0));
}

const DEFAULT_HTTP_PORT = 9898;
const expr: Express = express();
expr.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

interface ClientOptions {
  host: string;
  port?: number;
  interval?: number;
  debug?: boolean;
}

const options: ClientOptions & any = yargs
  .options({
    host: { alias: 'h', description: 'Specify SENEC System HOST or IP', demandOption: true },
    port: { description: 'Used HTTP port', default: DEFAULT_HTTP_PORT },
    interval: { alias: 'i', description: 'Scraping interval in seconds', default: 60 },
    debug: { alias: 'd', description: 'Debug mode', boolean: true, default: false },
  })
  .help().argv;

interface Payload {
  ENERGY: {
    GUI_BAT_DATA_POWER: string;
    GUI_HOUSE_POW: string;
    GUI_GRID_POW: string;
    GUI_BAT_DATA_FUEL_CHARGE: string;
    GUI_INVERTER_POWER: string;
  };
}

const payload: Payload = {
  ENERGY: {
    GUI_BAT_DATA_POWER: '',
    GUI_INVERTER_POWER: '',
    GUI_HOUSE_POW: '',
    GUI_GRID_POW: '',
    GUI_BAT_DATA_FUEL_CHARGE: '',
  },
};

const metrics = {
  batteryLevel: new client.Gauge({
    name: 'senec_battery_level',
    help: 'Current Battery Level (percentage)',
  }),

  batteryChargingPower: new client.Gauge({
    name: 'senec_battery_charging_power',
    help: 'Current Battery Charging Power',
  }),

  housePower: new client.Gauge({
    name: 'senec_house_consumption',
    help: 'Current House Consumption',
  }),

  gridPower: new client.Gauge({
    name: 'senec_grid_consumption',
    help: 'Current Consumption from the Drid',
  }),

  solarPower: new client.Gauge({
    name: 'senec_solar_power',
    help: 'Current Solar Production Power',
  }),
};

async function readSenecData(config: ClientOptions) {
  try {
    const response = await fetch(`http://${config.host}/lala.cgi`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data: Payload = await response.json();
    const batteryChargingPower = hex2float(data.ENERGY.GUI_BAT_DATA_POWER.replace('fl_', ''));
    const solarPower = hex2float(data.ENERGY.GUI_INVERTER_POWER.replace('fl_', ''));
    const housePower = hex2float(data.ENERGY.GUI_HOUSE_POW.replace('fl_', ''));
    const gridPower = hex2float(data.ENERGY.GUI_GRID_POW.replace('fl_', ''));
    const batteryLevel = hex2float(data.ENERGY.GUI_BAT_DATA_FUEL_CHARGE.replace('fl_', ''));

    metrics.batteryChargingPower.set(batteryChargingPower);
    metrics.batteryLevel.set(batteryLevel);
    metrics.solarPower.set(solarPower);
    metrics.housePower.set(housePower);
    metrics.gridPower.set(gridPower);
  } catch (error) {
    this.log(error);
  }
}

async function run() {
  if (options.debug) {
    console.log(options);
  }
  try {
    const server = expr.listen(options.port);
    console.log(`Exporter listening on port ${options.port}...(press CTRL+c to interrupt)`);
    const timeout = setInterval(async () => await readSenecData(options), options.interval * 1000);
    await readSenecData(options);
    return new Promise<void>(resolve => {
      process.stdin.on('keypress', async (str, key) => {
        if (key.ctrl && key.name === 'c') {
          clearInterval(timeout);
          server.close();
          resolve();
        }
      });
    });
  } catch (e) {
    console.error(e.message, e);
    throw e;
  }
}

run()
  .then(() => {
    console.log('Exiting...');
    process.exit(0);
  })
  .catch(e => {
    console.error(`Exiting...${e.message}`);
    process.exit(1);
  });
