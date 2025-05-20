export type ZoneType = "withinCity" | "withinState" | "metroToMetro" | "restOfIndia" | "northEastJK";

export interface RateZone {
    base: string;
    additional: string;
    rto: string;
}

export interface RateData {
    mode: string;
    withinCity: RateZone;
    withinState: RateZone;
    metroToMetro: RateZone;
    restOfIndia: RateZone;
    northEastJK: RateZone;
    cod: string;
    codPercent: string;
}

export interface ShippingRate {
    zone: ZoneType;
    baseCharge: number;
    codCharge: number;
    gst: number;
    total: number;
    gstPercentage: number;
} 