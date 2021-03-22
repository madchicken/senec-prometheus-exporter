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
