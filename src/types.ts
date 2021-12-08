export interface Payload {
  ENERGY: {
    GUI_BAT_DATA_POWER: string;
    GUI_HOUSE_POW: string;
    GUI_GRID_POW: string;
    GUI_BAT_DATA_FUEL_CHARGE: string;
    GUI_INVERTER_POWER: string;
  };
  WALLBOX?: {
    HW_TYPE: string;
    APPARENT_CHARGING_POWER: string;
    UTMP: string;
    L1_CHARGING_CURRENT: string;
    L2_CHARGING_CURRENT: string;
    L3_CHARGING_CURRENT: string;
    MAX_CHARGING_CURRENT_IC: string;
    MAX_CHARGING_CURRENT_RATED: string;
    MAX_CHARGING_CURRENT_DEFAULT: string;
    MAX_CHARGING_CURRENT_ICMAX: string;
    PROHIBIT_USAGE: string;
    STATE: string;
  };
}

export interface ResponsePayload {
  ENERGY: {
    GUI_BAT_DATA_POWER: string;
    GUI_HOUSE_POW: string;
    GUI_GRID_POW: string;
    GUI_BAT_DATA_FUEL_CHARGE: string;
    GUI_INVERTER_POWER: string;
  };
  WALLBOX?: {
    HW_TYPE: string[];
    APPARENT_CHARGING_POWER: string[];
    UTMP: string[];
    L1_CHARGING_CURRENT: string[];
    L2_CHARGING_CURRENT: string[];
    L3_CHARGING_CURRENT: string[];
    MAX_CHARGING_CURRENT_IC: string[];
    MAX_CHARGING_CURRENT_RATED: string[];
    MAX_CHARGING_CURRENT_DEFAULT: string[];
    MAX_CHARGING_CURRENT_ICMAX: string[];
    PROHIBIT_USAGE: string[];
    STATE: string[];
  };
}

interface MetricData {
  today: number;
  now: number;
}

export interface PublicResponsePayload {
  wartungsplan: {
    maintenanceOverdue: boolean;
    applicable: boolean;
    maintenanceDueSoon: boolean;
    possibleMaintenanceTypes: any[];
    minorMaintenancePossible: boolean;
  };
  suppressedNotificationIds: any[];
  wartungNotwendig: boolean;
  steuereinheitState: string;
  state: number;
  powergenerated: MetricData;
  consumption: MetricData;
  gridexport: MetricData;
  gridimport: MetricData;
  accuexport: MetricData;
  accuimport: MetricData;
  acculevel: MetricData;
  machine: string;
  lastupdated: number;
}

export interface WallboxResponsePayload {
  id: number;
  sequenceNumber: number;
  caseSerialNumber: string;
  controllerSerialNumber: number;
  powerSocketAvailable: boolean;
  firmwareVersion: string;
  hardwareVersion: string;
  minPossibleApparentChargingPowerInVa: number;
  maxPossibleChargingCurrentInA: number;
  minPossibleChargingCurrentInA: number;
  configuredMaxChargingCurrentInA: number;
  configuredMinChargingCurrentInA: number;
  chargingMode: string;
  lastContactDate: number;
  supportedChargingModes: string[];
  currentApparentChargingPowerInVa: number;
  maxApparentChargingPowerInVa: number;
  electricVehicleConnected: boolean;
  numberOfElectricPowerPhases: number;
  state: string;
  temperatureInCelsius: number;
  stateSeverity: string;
  maxApparentChargingPowerInKVa: number;
  currentApparentChargingPowerInKVa: number;
}
