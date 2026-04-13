export type MeasurementType = 'Length' | 'Weight' | 'Temperature' | 'Volume';
export type ActionType = 'comparison' | 'conversion' | 'arithmetic';
export type SubOpType = 'ADD' | 'SUBTRACT' | 'DIVIDE';

export interface QuantityPayload {
  value: number;
  unit: string;
  measurementType: string;
}

export interface CompareRequest {
  this: QuantityPayload;
  that: QuantityPayload;
}

export interface ConvertRequest {
  from: QuantityPayload;
  toUnit: string;
}

export interface ArithmeticRequest {
  this: QuantityPayload;
  that: QuantityPayload;
}

export interface ApiResponse {
  resultValue?: number;
  resultUnit?: string;
  resultString?: string;
  result?: boolean;
}

export interface HistoryRecord {
  id: string;
  type: MeasurementType;
  operation: string;
  details: string;
  outcome: string;
  time: string;
  user?: string;
}

export const UNITS: Record<MeasurementType, string[]> = {
  Length:      ['FEET', 'INCHES', 'YARDS', 'CENTIMETERS'],
  Weight:      ['KILOGRAM', 'GRAM', 'POUND'],
  Volume:      ['LITRE', 'MILLILITRE', 'GALLON'],
  Temperature: ['CELSIUS', 'FAHRENHEIT', 'KELVIN']
};

export const UNIT_LABELS: Record<string, string> = {
  FEET: 'Feet', INCHES: 'Inches', YARDS: 'Yards', CENTIMETERS: 'Centimeters',
  KILOGRAM: 'Kilogram', GRAM: 'Gram', POUND: 'Pound',
  LITRE: 'Litre', MILLILITRE: 'Millilitre', GALLON: 'Gallon',
  CELSIUS: 'Celsius', FAHRENHEIT: 'Fahrenheit', KELVIN: 'Kelvin'
};

export const TYPE_ICONS: Record<MeasurementType, string> = {
  Length: '✏️', Weight: '⚖️', Temperature: '🌡️', Volume: '🧴'
};
