#!/usr/bin/env node
import express, { Express } from 'express';
import client, { register } from 'prom-client';
import fetch from 'node-fetch';
import { PublicResponsePayload, WallboxResponsePayload } from './types';
import yargs = require('yargs');

const DEFAULT_HTTP_PORT = 9898;
const expr: Express = express();
expr.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

interface ClientOptions {
  host: string;
  token: string;
  username?: string;
  password?: string;
  port?: number;
  interval?: number;
  debug?: boolean;
  wallbox?: boolean;
}

const options: ClientOptions = yargs
  .options({
    host: {
      alias: 'h',
      description: 'Specify SENEC System HOST or IP',
      type: 'string',
      demandOption: true,
    },
    token: {
      alias: 't',
      description: 'Session Token',
      type: 'string',
      demandOption: false,
    },
    username: {
      alias: 'u',
      description: 'Username',
      type: 'string',
      demandOption: false,
    },
    password: {
      alias: 'p',
      description: 'Password',
      type: 'string',
      demandOption: true,
    },
    port: { description: 'Used HTTP port', default: DEFAULT_HTTP_PORT },
    wallbox: {
      alias: 'w',
      description: 'Scrape info about wallbox',
      boolean: true,
      default: false,
    },
    interval: { alias: 'i', description: 'Scraping interval in seconds', default: 60 },
    debug: { alias: 'd', description: 'Debug mode', boolean: true, default: false },
  })
  .help().argv;

const metrics = {
  batteryLevel: new client.Gauge({
    name: 'senec_battery_level',
    help: 'Current Battery Level (percentage)',
  }),

  batteryChargingPower: new client.Gauge({
    name: 'senec_battery_charging_power',
    help: 'Current Battery Charging Power',
  }),

  batteryDischargingPower: new client.Gauge({
    name: 'senec_battery_discharging_power',
    help: 'Current Battery Discharging Power',
  }),

  housePower: new client.Gauge({
    name: 'senec_house_consumption',
    help: 'Current House Consumption',
  }),

  gridPower: new client.Gauge({
    name: 'senec_grid_consumption',
    help: 'Current Consumption from the Drid',
  }),

  gridPowerEmission: new client.Gauge({
    name: 'senec_grid_emission',
    help: 'Current power emitted to the Drid',
  }),

  solarPower: new client.Gauge({
    name: 'senec_solar_power',
    help: 'Current Solar Production Power',
  }),

  wallboxPower: new client.Gauge({
    name: 'senec_wallbox_power',
    help: 'Current Wallbox Consumption Power',
    labelNames: ['serial', 'number'],
  }),

  wallboxState: new client.Gauge({
    name: 'senec_wallbox_state',
    help: 'Current Wallbox State',
    labelNames: ['serial', 'number'],
  }),

  wallboxTemp: new client.Gauge({
    name: 'senec_wallbox_temp',
    help: 'Current Wallbox Temperature in Celsius',
    labelNames: ['serial', 'number'],
  }),
};

function exposeSolarPanelsMetrics(data: PublicResponsePayload) {
  const batteryChargingPower = data.accuexport.now;
  const solarPower = data.powergenerated.now;
  const housePower = data.consumption.now;
  const gridExportedPower = data.gridexport.now;
  const gridImportedPower = data.gridimport.now;
  const batteryLevel = data.acculevel.now;

  metrics.batteryChargingPower.set(batteryChargingPower > 0 ? batteryChargingPower : 0);
  metrics.batteryDischargingPower.set(batteryChargingPower < 0 ? -batteryChargingPower : 0);
  metrics.batteryLevel.set(batteryLevel);
  metrics.solarPower.set(solarPower);
  metrics.housePower.set(housePower);
  metrics.gridPower.set(gridImportedPower);
  metrics.gridPowerEmission.set(gridExportedPower);

  if (options.debug) {
    console.log(`batteryChargingPower: ${batteryChargingPower > 0 ? batteryChargingPower : 0}`);
    console.log(`batteryDischargingPower: ${batteryChargingPower < 0 ? -batteryChargingPower : 0}`);
    console.log(`solarPower: ${solarPower}`);
    console.log(`housePower: ${housePower}`);
    console.log(`gridPowerImport: ${gridImportedPower}`);
    console.log(`gridPowerEmission: ${gridExportedPower}`);
    console.log(`batteryLevel: ${batteryLevel}`);
  }
}

function exposeWallboxMetrics(data: WallboxResponsePayload[]) {
  data.forEach(d => {
    metrics.wallboxPower.set(
      { serial: d.caseSerialNumber, number: d.id },
      d.currentApparentChargingPowerInKVa
    );
    metrics.wallboxTemp.set({ serial: d.caseSerialNumber, number: d.id }, d.temperatureInCelsius);
    if (options.debug) {
      console.log(`wallbox:`, d);
    }
  });
}

async function readSenecData(sessionIds: string[]) {
  try {
    const response = await fetch(
      `https://mein-senec.de/endkunde/api/status/getstatusoverview.php?anlageNummer=0`,
      {
        method: 'GET',
        headers: {
          Cookie: sessionIds.map(sessionId => `JSESSIONID=${sessionId}`).join('; '),
          Referer: 'https://mein-senec.de/endkunde/',
        },
      }
    );
    const data: PublicResponsePayload = await response.json();
    exposeSolarPanelsMetrics(data);
    if (options.wallbox) {
      const response2 = await fetch(
        ` https://mein-senec.de/endkunde/api/wallboxes?anlageNummer=0&wallboxNummer=1`,
        {
          method: 'GET',
          headers: {
            Cookie: sessionIds.map(sessionId => `JSESSIONID=${sessionId}`).join('; '),
            Referer: 'https://mein-senec.de/endkunde/',
          },
        }
      );
      const wallboxData: WallboxResponsePayload[] = await response2.json();
      exposeWallboxMetrics(wallboxData);
    }
  } catch (error) {
    console.log(error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function login(username: string, password: string): Promise<string> {
  try {
    const response = await fetch(`https://mein-senec.de/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'text/plain',
      },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    });
    return response.headers
      .get('set-cookie')
      .split(';')
      .find(c => c.trim().startsWith('JSESSIONID'))
      .split('=')[1];
  } catch (e) {
    console.error(e.message, e);
    return null;
  }
}

async function refreshToken(sessionIds: string[]) {
  try {
    const response = await fetch(
      `https://mein-senec.de/endkunde/api/context/getAnlage?anlageNummer=0`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Cookie: sessionIds.map(sessionId => `JSESSIONID=${sessionId}`).join('; '),
          Referer: 'https://mein-senec.de/endkunde/',
        },
      }
    );
    const json = await response.json();
    console.log(`Read information for product ${json.produktName}`, json);
    return json;
  } catch (e) {
    console.error(e.message, e);
    return null;
  }
}

async function run() {
  if (options.debug) {
    console.log(options);
  }
  try {
    const server = expr.listen(options.port);
    console.log(`Exporter listening on port ${options.port}...(press CTRL+c to interrupt)`);
    const sessionIds = options.token.split(',');
    if (!sessionIds) {
      console.error('Error: Token not provided.');
      process.exit(1);
    }

    await readSenecData(sessionIds);
    const timeout = setInterval(
      async () => await readSenecData(sessionIds),
      options.interval * 1000
    );
    const sessionRefreshTimeout = setInterval(
      async () => await refreshToken(sessionIds),
      10 * 60 * 1000 // every 10 minutes
    );

    return new Promise<void>(resolve => {
      process.stdin.on('keypress', async (str, key) => {
        if (key.ctrl && key.name === 'c') {
          clearInterval(timeout);
          clearInterval(sessionRefreshTimeout);
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
