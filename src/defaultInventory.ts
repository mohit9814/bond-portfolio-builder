export interface DefaultBond {
  isin: string;
  issuer: string;
  coupon: number | null;
  yield: number;
  maturity: string;
  months: number;
  rating: string;
  frequency: string;
  totalTradableFV?: number;
  /** Total tradable quantity in units. Bonds with qty = 0 or undefined are illiquid and must be excluded. */
  totalTradableQty?: number;
  /** Per-unit face value of the bond (e.g. ₹1,00,000) */
  faceValue?: number;
  /** Whether the bond is secured or unsecured (e.g. "Secured", "Unsecured") */
  securedUnsecured?: string;
  /** Residual tenure as formatted string from the Excel (e.g. "1Y,3M,12D") */
  residualTenure?: string;
  /** How the principal is redeemed (e.g. "ON MATURITY", "Amortising") */
  principalRedemption?: string;
  sector?: string;
  category?: string;
  guarantor?: string;
  guarantorRating?: string;
  ratingTrend?: 'stable' | 'improving' | 'deteriorating';
  ratingOutlookNote?: string;
}

export const DEFAULT_INVENTORY: DefaultBond[] = [
  {
    "isin": "INE0Z4807015",
    "issuer": "CYQURE INDIA PVT LTD",
    "coupon": null,
    "yield": 0.135,
    "maturity": "2028-03-17",
    "months": 19.4,
    "rating": "CARE BBB-",
    "frequency": "ON MATURITY",
    "guarantor": "CyberTech Systems Holding",
    "guarantorRating": "CARE BBB",
    "ratingTrend": "deteriorating",
    "ratingOutlookNote": "Watch negative due to recent refinancing obligations."
  },
  {
    "isin": "INE03K307132",
    "issuer": "SATIN FINSERV LTD",
    "coupon": 0.1025,
    "yield": 0.115,
    "maturity": "2028-03-20",
    "months": 19.5,
    "rating": "ICRA A-",
    "frequency": "MONTHLY",
    "guarantor": "Satin Creditcare Network Ltd",
    "guarantorRating": "ICRA A",
    "ratingTrend": "improving",
    "ratingOutlookNote": "Upgraded outlook due to lower NNPA and fresh capital injection."
  },
  {
    "isin": "INE0Q6I07017",
    "issuer": "TYGER HOME FIN PVT LTD",
    "coupon": 0.0975,
    "yield": 0.0975,
    "maturity": "2027-08-16",
    "months": 12.4,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY",
    "guarantor": "Tyger Capital Holdings",
    "guarantorRating": "CRISIL A+",
    "ratingTrend": "stable",
    "ratingOutlookNote": "Stable capitalization and strong parent backing."
  },
  {
    "isin": "INE916Y07040",
    "issuer": "AKME FINTRADE (INDIA) LTD",
    "coupon": 0.12,
    "yield": 0.112,
    "maturity": "2027-09-15",
    "months": 13.4,
    "rating": "ACUITE A-",
    "frequency": "MONTHLY",
    "guarantor": "Akme Group Enterprise",
    "guarantorRating": "ACUITE A-",
    "ratingTrend": "stable"
  },
  {
    "isin": "INE916Y07032",
    "issuer": "AKME FINTRADE (INDIA) LTD",
    "coupon": 0.12,
    "yield": 0.112,
    "maturity": "2027-08-22",
    "months": 12.6,
    "rating": "ACUITE A-",
    "frequency": "MONTHLY",
    "guarantor": "Akme Group Enterprise",
    "guarantorRating": "ACUITE A-",
    "ratingTrend": "stable"
  },
  {
    "isin": "INE836B07915",
    "issuer": "SATIN CREDITCARE NETWORK LTD",
    "coupon": 0.1,
    "yield": 0.11,
    "maturity": "2028-01-30",
    "months": 17.9,
    "rating": "ICRA A",
    "frequency": "MONTHLY",
    "guarantor": "Satin Creditcare Network Ltd",
    "guarantorRating": "ICRA A",
    "ratingTrend": "improving"
  },
  {
    "isin": "INE01YL07441",
    "issuer": "EARLYSALARY SERV PVT LTD",
    "coupon": 0.105,
    "yield": 0.1085,
    "maturity": "2028-07-04",
    "months": 23.0,
    "rating": "CARE A-",
    "frequency": "QUARTERLY",
    "guarantor": "Social Worth Technologies Pvt Ltd",
    "guarantorRating": "CARE A",
    "ratingTrend": "improving"
  },
  {
    "isin": "INE657N07613",
    "issuer": "EDELWEISS RURAL AND CORPORATE SERV LTD",
    "coupon": 0.099,
    "yield": 0.105,
    "maturity": "2027-06-30",
    "months": 10.9,
    "rating": "ICRA A+",
    "frequency": "ANNUALLY",
    "guarantor": "Edelweiss Financial Services Ltd",
    "guarantorRating": "ICRA AA-",
    "ratingTrend": "stable"
  },
  {
    "isin": "INE101Q07BX1",
    "issuer": "MUTHOOT MCRED LTD",
    "coupon": 0.093,
    "yield": 0.105,
    "maturity": "2028-06-17",
    "months": 22.5,
    "rating": "ICRA A",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE342T07544",
    "issuer": "NAVI FINSERV LTD",
    "coupon": 0.1075,
    "yield": 0.103,
    "maturity": "2027-12-31",
    "months": 16.9,
    "rating": "CRISIL A",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE414G07GE8",
    "issuer": "MUTHOOT FIN LTD",
    "coupon": 0.0675,
    "yield": 0.086,
    "maturity": "2027-05-05",
    "months": 9.0,
    "rating": "ICRA AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE342T07635",
    "issuer": "NAVI FINSERV LTD",
    "coupon": 0.103,
    "yield": 0.103,
    "maturity": "2027-09-30",
    "months": 13.9,
    "rating": "CRISIL A",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE605Y07197",
    "issuer": "AUXILO FINSERVE PVT LTD",
    "coupon": 0.098,
    "yield": 0.1025,
    "maturity": "2028-01-29",
    "months": 17.9,
    "rating": "CRISIL A+",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE07HK07825",
    "issuer": "KRAZYBEE SERV LTD",
    "coupon": 0.1065,
    "yield": 0.1,
    "maturity": "2027-08-12",
    "months": 12.3,
    "rating": "CARE A",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE0MYJ07187",
    "issuer": "PROGFIN PRIVATE LIMITED",
    "coupon": 0.105,
    "yield": 0.114,
    "maturity": "2027-12-30",
    "months": 16.9,
    "rating": "ICRA BBB+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE046W07347",
    "issuer": "MUTHOOT MICROFIN LTD",
    "coupon": 0.0985,
    "yield": 0.099,
    "maturity": "2027-12-16",
    "months": 16.4,
    "rating": "CRISIL AA-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE07HK07866",
    "issuer": "KRAZYBEE SERV LTD",
    "coupon": 0.105,
    "yield": 0.1,
    "maturity": "2027-12-02",
    "months": 16.0,
    "rating": "CRISIL A+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE530L07BB8",
    "issuer": "NIDO HOME FIN LTD",
    "coupon": 0.09,
    "yield": 0.1,
    "maturity": "2027-09-10",
    "months": 13.2,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530L07855",
    "issuer": "NIDO HOME FIN LTD",
    "coupon": 0.0958,
    "yield": 0.1,
    "maturity": "2027-10-08",
    "months": 14.2,
    "rating": "CRISIL A+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE532F07FR3",
    "issuer": "EDELWEISS FINANCIAL SERV LTD",
    "coupon": 0.0957,
    "yield": 0.1,
    "maturity": "2027-07-26",
    "months": 11.7,
    "rating": "CRISIL A+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE549K07FJ4",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0925,
    "yield": 0.093,
    "maturity": "2028-01-10",
    "months": 17.2,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE583D07653",
    "issuer": "UGRO CAP LTD",
    "coupon": 0.095,
    "yield": 0.1,
    "maturity": "2027-04-18",
    "months": 8.5,
    "rating": "IND A+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE148I07SG8",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.099,
    "yield": 0.091,
    "maturity": "2027-03-26",
    "months": 7.7,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE148I07UC3",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0948,
    "yield": 0.091,
    "maturity": "2027-09-25",
    "months": 13.7,
    "rating": "CRISIL AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE148I07ME6",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0955,
    "yield": 0.091,
    "maturity": "2027-09-28",
    "months": 13.8,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE523L07710",
    "issuer": "NUVAMA WEALTH AND INVT LTD",
    "coupon": 0.0916,
    "yield": 0.0915,
    "maturity": "2027-07-15",
    "months": 11.4,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE549K07IE9",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0851,
    "yield": 0.093,
    "maturity": "2028-05-12",
    "months": 21.3,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE046W07305",
    "issuer": "MUTHOOT MICROFIN LTD",
    "coupon": 0.098,
    "yield": 0.099,
    "maturity": "2027-11-04",
    "months": 15.0,
    "rating": "CRISIL AA-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE148I07XX3",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": null,
    "yield": 0.091,
    "maturity": "2027-08-01",
    "months": 11.9,
    "rating": "CRISIL AA+",
    "frequency": "ON MATURITY"
  },
  {
    "isin": "INE342T07619",
    "issuer": "NAVI FINSERV LTD",
    "coupon": 0.1,
    "yield": 0.103,
    "maturity": "2027-03-25",
    "months": 7.7,
    "rating": "IND A",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE549K07IP5",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0851,
    "yield": 0.093,
    "maturity": "2028-07-07",
    "months": 23.1,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE549K07BU0",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.085,
    "yield": 0.093,
    "maturity": "2028-02-02",
    "months": 18.0,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE530B07310",
    "issuer": "IIFL FIN LTD",
    "coupon": 0.0865,
    "yield": 0.093,
    "maturity": "2028-01-24",
    "months": 17.7,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE530B07260",
    "issuer": "IIFL FIN LTD",
    "coupon": 0.09,
    "yield": 0.093,
    "maturity": "2028-01-24",
    "months": 17.7,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE549K07HL6",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.087,
    "yield": 0.093,
    "maturity": "2028-02-12",
    "months": 18.3,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE549K07BW6",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.088,
    "yield": 0.093,
    "maturity": "2028-02-02",
    "months": 18.0,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530B07377",
    "issuer": "IIFL FIN LTD",
    "coupon": 0.09,
    "yield": 0.093,
    "maturity": "2028-06-28",
    "months": 22.8,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE549K07HE1",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0837,
    "yield": 0.093,
    "maturity": "2028-02-12",
    "months": 18.3,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE348L07340",
    "issuer": "MAS FINANCIAL SERV LTD",
    "coupon": 0.089,
    "yield": 0.0925,
    "maturity": "2027-11-28",
    "months": 15.8,
    "rating": "CARE AA-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE348L07332",
    "issuer": "MAS FINANCIAL SERV LTD",
    "coupon": 0.091,
    "yield": 0.0925,
    "maturity": "2027-08-29",
    "months": 12.8,
    "rating": "CARE AA-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE523L07751",
    "issuer": "NUVAMA WEALTH AND INVT LTD",
    "coupon": 0.0955,
    "yield": 0.0915,
    "maturity": "2027-07-15",
    "months": 11.4,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE741K07611",
    "issuer": "CREDITACCESS GRAMEEN LTD",
    "coupon": 0.0925,
    "yield": 0.091,
    "maturity": "2028-06-26",
    "months": 22.8,
    "rating": "ICRA AA-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE148I08298",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0835,
    "yield": 0.091,
    "maturity": "2027-09-08",
    "months": 13.2,
    "rating": "ICRA AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE414G07HG1",
    "issuer": "MUTHOOT FIN LTD",
    "coupon": null,
    "yield": 0.0875,
    "maturity": "2027-12-23",
    "months": 16.7,
    "rating": "ICRA AA+",
    "frequency": "ON MATURITY"
  },
  {
    "isin": "INE244L08059",
    "issuer": "SAMMAAN FINSERVE LTD",
    "coupon": 0.088,
    "yield": 0.087,
    "maturity": "2028-05-02",
    "months": 21.0,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE018E08334",
    "issuer": "SBI CARDS AND PAYMENT SERV LTD",
    "coupon": 0.0785,
    "yield": 0.069,
    "maturity": "2028-05-17",
    "months": 21.5,
    "rating": "CRISIL AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE046W07313",
    "issuer": "MUTHOOT MICROFIN LTD",
    "coupon": 0.099,
    "yield": 0.099,
    "maturity": "2027-11-11",
    "months": 15.3,
    "rating": "CRISIL AA-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE342T07494",
    "issuer": "NAVI FINSERV LTD",
    "coupon": 0.105,
    "yield": 0.105,
    "maturity": "2027-06-18",
    "months": 10.5,
    "rating": "IND A",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE219X07223",
    "issuer": "INDIGRID INFRA TRUST",
    "coupon": 0.079,
    "yield": 0.068,
    "maturity": "2028-05-06",
    "months": 21.1,
    "rating": "IND AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530B07476",
    "issuer": "IIFL FIN LTD",
    "coupon": 0.0975,
    "yield": 0.0975,
    "maturity": "2028-04-21",
    "months": 20.6,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530B08094",
    "issuer": "IIFL FIN LTD",
    "coupon": 0.1,
    "yield": 0.1,
    "maturity": "2028-06-24",
    "months": 22.7,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530L07475",
    "issuer": "NIDO HOME FIN LTD",
    "coupon": 0.0915,
    "yield": 0.0915,
    "maturity": "2027-04-29",
    "months": 8.8,
    "rating": "CRISIL A+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE101Q07BS1",
    "issuer": "MUTHOOT MCRED LTD",
    "coupon": 0.093,
    "yield": 0.093,
    "maturity": "2028-01-27",
    "months": 17.8,
    "rating": "ICRA A",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE0BUS07BV9",
    "issuer": "INDEL MONEY LTD",
    "coupon": 0.1125,
    "yield": 0.1125,
    "maturity": "2027-03-17",
    "months": 7.4,
    "rating": "CRISIL BBB+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE532F07DC0",
    "issuer": "EDELWEISS FINANCIAL SERV LTD",
    "coupon": 0.0975,
    "yield": 0.0975,
    "maturity": "2027-10-20",
    "months": 14.6,
    "rating": "ACUITE A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE549K07EO7",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0965,
    "yield": 0.0965,
    "maturity": "2027-10-30",
    "months": 14.9,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE532F07DJ5",
    "issuer": "EDELWEISS FINANCIAL SERV LTD",
    "coupon": 0.101,
    "yield": 0.101,
    "maturity": "2028-01-20",
    "months": 17.6,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE07HK07841",
    "issuer": "KRAZYBEE SERV LTD",
    "coupon": 0.1045,
    "yield": 0.1045,
    "maturity": "2027-03-16",
    "months": 7.4,
    "rating": "CRISIL A+",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE01YL07409",
    "issuer": "EARLYSALARY SERV PVT LTD",
    "coupon": 0.107,
    "yield": 0.107,
    "maturity": "2028-01-08",
    "months": 17.2,
    "rating": "CARE A-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE0NES07329",
    "issuer": "KEERTANA FINSERV LTD",
    "coupon": 0.12,
    "yield": 0.12,
    "maturity": "2027-09-22",
    "months": 13.6,
    "rating": "IND BBB+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE532F07IM8",
    "issuer": "EDELWEISS FINANCIAL SERV LTD",
    "coupon": 0.0885,
    "yield": 0.0885,
    "maturity": "2027-12-12",
    "months": 16.3,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE413U07418",
    "issuer": "IIFL SAMASTA FIN LTD",
    "coupon": 0.0975,
    "yield": 0.0975,
    "maturity": "2028-07-16",
    "months": 23.4,
    "rating": "CRISIL AA-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE532F07IT3",
    "issuer": "EDELWEISS FINANCIAL SERV LTD",
    "coupon": 0.0865,
    "yield": 0.0865,
    "maturity": "2028-03-18",
    "months": 19.5,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE501X07703",
    "issuer": "AYE FIN LTD",
    "coupon": 0.1025,
    "yield": 0.1025,
    "maturity": "2027-06-30",
    "months": 10.9,
    "rating": "IND A+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE501X07570",
    "issuer": "AYE FIN LTD",
    "coupon": 0.105,
    "yield": 0.105,
    "maturity": "2027-04-30",
    "months": 8.9,
    "rating": "IND A+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE01YL07391",
    "issuer": "EARLYSALARY SERV PVT LTD",
    "coupon": 0.107,
    "yield": 0.107,
    "maturity": "2027-08-06",
    "months": 12.1,
    "rating": "CARE A-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE01YL07383",
    "issuer": "EARLYSALARY SERV PVT LTD",
    "coupon": 0.107,
    "yield": 0.107,
    "maturity": "2027-03-05",
    "months": 7.0,
    "rating": "CARE A-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE148I07WU1",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0902,
    "yield": 0.0902,
    "maturity": "2028-03-19",
    "months": 19.5,
    "rating": "CRISIL AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE549K07GA1",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.09,
    "yield": 0.09,
    "maturity": "2027-05-19",
    "months": 9.5,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE0M2307057",
    "issuer": "A.P. STATE BEVERAGES CORP LTD",
    "coupon": 0.0962,
    "yield": 0.0962,
    "maturity": "2027-05-31",
    "months": 9.9,
    "rating": "IND AA (CE)",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE413U07392",
    "issuer": "IIFL SAMASTA FIN LTD",
    "coupon": 0.095,
    "yield": 0.095,
    "maturity": "2027-04-22",
    "months": 8.6,
    "rating": "CRISIL AA-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE148I07VH0",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0948,
    "yield": 0.0948,
    "maturity": "2027-12-27",
    "months": 16.8,
    "rating": "CRISIL AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE549K07GT1",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0945,
    "yield": 0.0945,
    "maturity": "2028-07-16",
    "months": 23.4,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE342T07569",
    "issuer": "NAVI FINSERV LTD",
    "coupon": 0.106,
    "yield": 0.106,
    "maturity": "2027-05-21",
    "months": 9.6,
    "rating": "IND A",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE540P07475",
    "issuer": "U.P. POWER CORP LTD",
    "coupon": 0.0995,
    "yield": 0.0995,
    "maturity": "2028-03-31",
    "months": 19.9,
    "rating": "CRISIL A+",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE0GCN07021",
    "issuer": "ADANI AIRPORT HOLDINGS LTD",
    "coupon": 0.0995,
    "yield": 0.0995,
    "maturity": "2027-03-15",
    "months": 7.4,
    "rating": "CRISIL AA-",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE101Q07BO0",
    "issuer": "MUTHOOT MCRED LTD",
    "coupon": 0.0925,
    "yield": 0.0925,
    "maturity": "2027-09-18",
    "months": 13.5,
    "rating": "ICRA A",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE101Q07BY9",
    "issuer": "MUTHOOT MCRED LTD",
    "coupon": 0.0925,
    "yield": 0.0925,
    "maturity": "2028-02-25",
    "months": 18.8,
    "rating": "ICRA A",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE860H07IK3",
    "issuer": "ADITYA BIRLA CAP LTD",
    "coupon": 0.0801,
    "yield": 0.0801,
    "maturity": "2028-05-02",
    "months": 21.0,
    "rating": "IND AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE528S07128",
    "issuer": "ECL FIN LTD",
    "coupon": 0.0925,
    "yield": 0.0925,
    "maturity": "2028-03-22",
    "months": 19.6,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE148I07UE9",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.099,
    "yield": 0.099,
    "maturity": "2027-09-25",
    "months": 13.7,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530B07617",
    "issuer": "IIFL FIN LTD",
    "coupon": 0.087,
    "yield": 0.087,
    "maturity": "2028-03-06",
    "months": 19.1,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE549K07IA7",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.087,
    "yield": 0.087,
    "maturity": "2028-03-25",
    "months": 19.7,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE148I07MV0",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0955,
    "yield": 0.0955,
    "maturity": "2027-11-03",
    "months": 15.0,
    "rating": "ICRA AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE528L07115",
    "issuer": "EAAA INDIA ALTERNATIVES LTD",
    "coupon": 0.108,
    "yield": 0.108,
    "maturity": "2027-07-02",
    "months": 10.9,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE03K307157",
    "issuer": "SATIN FINSERV LTD",
    "coupon": 0.1175,
    "yield": 0.1175,
    "maturity": "2027-10-28",
    "months": 14.8,
    "rating": "ICRA A-",
    "frequency": "ON MATURITY"
  },
  {
    "isin": "INE146O08209",
    "issuer": "HINDUJA LEYLAND FIN LTD",
    "coupon": 0.0975,
    "yield": 0.0975,
    "maturity": "2028-04-21",
    "months": 20.6,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE532F07GE9",
    "issuer": "EDELWEISS FINANCIAL SERV LTD",
    "coupon": 0.1,
    "yield": 0.1,
    "maturity": "2027-10-24",
    "months": 14.7,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE477L07BC0",
    "issuer": "IIFL HOME FIN LTD",
    "coupon": 0.09,
    "yield": 0.09,
    "maturity": "2027-12-26",
    "months": 16.8,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE148I07WI6",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.099,
    "yield": 0.099,
    "maturity": "2028-03-19",
    "months": 19.5,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE0NES07311",
    "issuer": "KEERTANA FINSERV LTD",
    "coupon": 0.12,
    "yield": 0.12,
    "maturity": "2028-06-25",
    "months": 22.7,
    "rating": "IND BBB+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE530B07658",
    "issuer": "IIFL FIN LTD",
    "coupon": 0.0837,
    "yield": 0.0837,
    "maturity": "2028-03-06",
    "months": 19.1,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE0TLC07085",
    "issuer": "THE  A.P. MINERAL DEV CORP LTD",
    "coupon": 0.093,
    "yield": 0.093,
    "maturity": "2027-05-07",
    "months": 9.1,
    "rating": "IND AA(CE)",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE414G07IR6",
    "issuer": "MUTHOOT FIN LTD",
    "coupon": 0.0878,
    "yield": 0.0878,
    "maturity": "2027-05-20",
    "months": 9.5,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530B07385",
    "issuer": "IIFL FIN LTD",
    "coupon": 0.0865,
    "yield": 0.0865,
    "maturity": "2028-06-28",
    "months": 22.8,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE413U07426",
    "issuer": "IIFL SAMASTA FIN LTD",
    "coupon": 0.095,
    "yield": 0.095,
    "maturity": "2027-07-23",
    "months": 11.6,
    "rating": "CRISIL AA-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE148I07YA9",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.09,
    "yield": 0.09,
    "maturity": "2027-08-01",
    "months": 11.9,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE148I07VJ6",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0902,
    "yield": 0.0902,
    "maturity": "2027-12-27",
    "months": 16.8,
    "rating": "CRISIL AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE148I07TF8",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.099,
    "yield": 0.099,
    "maturity": "2027-05-31",
    "months": 9.9,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE148I07TY9",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0975,
    "yield": 0.0975,
    "maturity": "2028-04-12",
    "months": 20.3,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE0GCN07039",
    "issuer": "ADANI AIRPORT HOLDINGS LTD",
    "coupon": 0.0995,
    "yield": 0.0995,
    "maturity": "2028-06-12",
    "months": 22.3,
    "rating": "CRISIL AA-",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE148I07XG8",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0865,
    "yield": 0.0865,
    "maturity": "2027-08-01",
    "months": 11.9,
    "rating": "CRISIL AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE148I07XA1",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0945,
    "yield": 0.0945,
    "maturity": "2028-06-19",
    "months": 22.5,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE342T07460",
    "issuer": "NAVI FINSERV LTD",
    "coupon": 0.1065,
    "yield": 0.1065,
    "maturity": "2027-03-13",
    "months": 7.3,
    "rating": "CRISIL A",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE423A07450",
    "issuer": "ADANI ENTERPRISES LTD",
    "coupon": 0.0895,
    "yield": 0.0895,
    "maturity": "2027-07-17",
    "months": 11.4,
    "rating": "ICRA AA-",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530L07483",
    "issuer": "NIDO HOME FIN LTD",
    "coupon": 0.0955,
    "yield": 0.0955,
    "maturity": "2027-04-29",
    "months": 8.8,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE501X07729",
    "issuer": "AYE FIN LTD",
    "coupon": 0.1005,
    "yield": 0.1005,
    "maturity": "2027-09-12",
    "months": 13.3,
    "rating": "IND A+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE658F08037",
    "issuer": "KERALA INFRA INVT FUND BOARD",
    "coupon": 0.0849,
    "yield": 0.0849,
    "maturity": "2027-07-02",
    "months": 10.9,
    "rating": "IND AA(CE)",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE148I07XP9",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0925,
    "yield": 0.091,
    "maturity": "2028-08-01",
    "months": 24.0,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE532F07FS1",
    "issuer": "EDELWEISS FINANCIAL SERV LTD",
    "coupon": 0.1,
    "yield": 0.1,
    "maturity": "2027-07-26",
    "months": 11.7,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530L07AT2",
    "issuer": "NIDO HOME FIN LTD",
    "coupon": 0.0925,
    "yield": 0.0925,
    "maturity": "2027-07-02",
    "months": 10.9,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE148I07XK0",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0888,
    "yield": 0.0888,
    "maturity": "2028-08-01",
    "months": 24.0,
    "rating": "CRISIL AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE530B07518",
    "issuer": "IIFL FIN LTD",
    "coupon": 0.0935,
    "yield": 0.0935,
    "maturity": "2028-04-21",
    "months": 20.6,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE413U07293",
    "issuer": "IIFL SAMASTA FIN LTD",
    "coupon": 0.1,
    "yield": 0.1,
    "maturity": "2027-06-21",
    "months": 10.6,
    "rating": "CRISIL AA-",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE348L07316",
    "issuer": "MAS FINANCIAL SERV LTD",
    "coupon": 0.0925,
    "yield": 0.0925,
    "maturity": "2027-05-16",
    "months": 9.4,
    "rating": "CARE AA-",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE04VS07438",
    "issuer": "OXYZO FINANCIAL SERV LTD",
    "coupon": 0.096,
    "yield": 0.096,
    "maturity": "2027-06-14",
    "months": 10.3,
    "rating": "ICRA A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE939X07200",
    "issuer": "MANBA FIN LTD",
    "coupon": 0.113,
    "yield": 0.113,
    "maturity": "2027-06-05",
    "months": 10.1,
    "rating": "CARE BBB+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE532F07HI8",
    "issuer": "EDELWEISS FINANCIAL SERV LTD",
    "coupon": 0.1,
    "yield": 0.1,
    "maturity": "2028-04-30",
    "months": 20.9,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE08KJ07175",
    "issuer": "MUFIN GREEN FIN LTD",
    "coupon": 0.11,
    "yield": 0.11,
    "maturity": "2027-08-29",
    "months": 12.8,
    "rating": "Acuite A-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE04VS07404",
    "issuer": "OXYZO FINANCIAL SERV LTD",
    "coupon": 0.0975,
    "yield": 0.0975,
    "maturity": "2027-03-27",
    "months": 7.8,
    "rating": "ICRA A+",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE148I07MZ1",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0915,
    "yield": 0.0915,
    "maturity": "2027-11-03",
    "months": 15.0,
    "rating": "CRISIL AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE157D07EJ4",
    "issuer": "CLIX CAP SERV PVT LTD",
    "coupon": 0.102,
    "yield": 0.102,
    "maturity": "2027-03-18",
    "months": 7.5,
    "rating": "CARE A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE148I07SI4",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0948,
    "yield": 0.0948,
    "maturity": "2027-03-26",
    "months": 7.7,
    "rating": "CRISIL AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE532F07HN8",
    "issuer": "EDELWEISS FINANCIAL SERV LTD",
    "coupon": 0.0975,
    "yield": 0.0975,
    "maturity": "2028-07-24",
    "months": 23.7,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE896L07991",
    "issuer": "INDOSTAR CAP FIN LTD",
    "coupon": 0.103,
    "yield": 0.103,
    "maturity": "2027-09-25",
    "months": 13.7,
    "rating": "CARE AA-",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE549K07HR3",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0837,
    "yield": 0.0837,
    "maturity": "2028-03-25",
    "months": 19.7,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE583D07612",
    "issuer": "UGRO CAP LTD",
    "coupon": 0.0975,
    "yield": 0.0975,
    "maturity": "2027-10-16",
    "months": 14.4,
    "rating": "IND A+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE583D07604",
    "issuer": "UGRO CAP LTD",
    "coupon": 0.1015,
    "yield": 0.1015,
    "maturity": "2027-04-24",
    "months": 8.7,
    "rating": "IND A+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE549K07DN1",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.095,
    "yield": 0.095,
    "maturity": "2027-06-30",
    "months": 10.9,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530L07806",
    "issuer": "NIDO HOME FIN LTD",
    "coupon": 0.0958,
    "yield": 0.0958,
    "maturity": "2027-07-03",
    "months": 11.0,
    "rating": "CRISIL A+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE549K07GU9",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.092,
    "yield": 0.092,
    "maturity": "2027-07-16",
    "months": 11.4,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE549K07FB1",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0965,
    "yield": 0.0965,
    "maturity": "2028-01-10",
    "months": 17.2,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE338I07149",
    "issuer": "MOTILAL OSWAL FINANCIAL SERV LTD",
    "coupon": 0.091,
    "yield": 0.091,
    "maturity": "2027-05-09",
    "months": 9.2,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE01YL07417",
    "issuer": "EARLYSALARY SERV PVT LTD",
    "coupon": 0.105,
    "yield": 0.105,
    "maturity": "2028-03-09",
    "months": 19.2,
    "rating": "CARE A-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE549K07GW5",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0885,
    "yield": 0.0885,
    "maturity": "2027-07-16",
    "months": 11.4,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE721A07NX5",
    "issuer": "SHRIRAM FIN LTD",
    "coupon": 0.094,
    "yield": 0.094,
    "maturity": "2028-07-12",
    "months": 23.3,
    "rating": "CRISIL AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE08XP07423",
    "issuer": "AKARA CAP ADVISORS PVT LTD",
    "coupon": 0.12,
    "yield": 0.12,
    "maturity": "2027-05-21",
    "months": 9.6,
    "rating": "ICRA BBB",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE540P07467",
    "issuer": "U.P. POWER CORP LTD",
    "coupon": 0.0995,
    "yield": 0.0995,
    "maturity": "2027-03-31",
    "months": 7.9,
    "rating": "CRISIL A+ (CE)",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE532F07HA5",
    "issuer": "EDELWEISS FINANCIAL SERV LTD",
    "coupon": 0.095,
    "yield": 0.095,
    "maturity": "2027-04-30",
    "months": 8.9,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE01XO07017",
    "issuer": "IFL FIN LTD",
    "coupon": 0.1225,
    "yield": 0.1225,
    "maturity": "2027-11-18",
    "months": 15.5,
    "rating": "CRISIL BBB",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE549K07GE3",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0965,
    "yield": 0.0965,
    "maturity": "2028-05-19",
    "months": 21.5,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE0BUS07BW7",
    "issuer": "INDEL MONEY LTD",
    "coupon": 0.1125,
    "yield": 0.1125,
    "maturity": "2027-04-23",
    "months": 8.6,
    "rating": "CRISIL BBB+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE0NES07287",
    "issuer": "KEERTANA FINSERV LTD",
    "coupon": 0.114,
    "yield": 0.114,
    "maturity": "2027-10-24",
    "months": 14.7,
    "rating": "IND BBB+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE296G07291",
    "issuer": "MUTHOOT CAP SERV LTD",
    "coupon": 0.095,
    "yield": 0.095,
    "maturity": "2027-07-23",
    "months": 11.6,
    "rating": "CRISIL AA-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE836K07064",
    "issuer": "EDEL FIN CO LTD",
    "coupon": 0.1047,
    "yield": 0.1047,
    "maturity": "2027-04-09",
    "months": 8.2,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE423A07310",
    "issuer": "ADANI ENTERPRISES LTD",
    "coupon": 0.0932,
    "yield": 0.0932,
    "maturity": "2027-09-12",
    "months": 13.3,
    "rating": "ICRA AA-",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE248U07FG8",
    "issuer": "360 ONE PRIME LTD",
    "coupon": 0.0955,
    "yield": 0.0955,
    "maturity": "2027-06-12",
    "months": 10.3,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE248U07FH6",
    "issuer": "360 ONE PRIME LTD",
    "coupon": 0.0916,
    "yield": 0.0916,
    "maturity": "2027-06-12",
    "months": 10.3,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "IN0020240043",
    "issuer": "7.02% G SEC 27",
    "coupon": 0.0702,
    "yield": 0.0702,
    "maturity": "2027-05-27",
    "months": 9.8,
    "rating": "SOVEREIGN",
    "frequency": "SEMI ANNUALLY"
  },
  {
    "isin": "IN0020170174",
    "issuer": "7.17% G SEC 28",
    "coupon": 0.0717,
    "yield": 0.0717,
    "maturity": "2028-01-08",
    "months": 17.2,
    "rating": "SOVEREIGN",
    "frequency": "SEMI ANNUALLY"
  },
  {
    "isin": "IN1520230039",
    "issuer": "7.18% GJ SDL 28",
    "coupon": 0.0718,
    "yield": 0.0718,
    "maturity": "2028-06-07",
    "months": 22.1,
    "rating": "SOVEREIGN",
    "frequency": "SEMI ANNUALLY"
  },
  {
    "isin": "IN2220230030",
    "issuer": "7.20% MH SDL 28",
    "coupon": 0.072,
    "yield": 0.072,
    "maturity": "2028-05-24",
    "months": 21.7,
    "rating": "SOVEREIGN",
    "frequency": "SEMI ANNUALLY"
  },
  {
    "isin": "IN2220230014",
    "issuer": "7.36% MH SDL 28",
    "coupon": 0.0736,
    "yield": 0.0736,
    "maturity": "2028-04-12",
    "months": 20.3,
    "rating": "SOVEREIGN",
    "frequency": "SEMI ANNUALLY"
  },
  {
    "isin": "IN0020220037",
    "issuer": "7.38% G SEC 27",
    "coupon": 0.0738,
    "yield": 0.0738,
    "maturity": "2027-06-20",
    "months": 10.5,
    "rating": "SOVEREIGN",
    "frequency": "SEMI ANNUALLY"
  },
  {
    "isin": "IN1520230062",
    "issuer": "7.40% GJ SDL 27",
    "coupon": 0.074,
    "yield": 0.074,
    "maturity": "2027-09-22",
    "months": 13.6,
    "rating": "SOVEREIGN",
    "frequency": "SEMI ANNUALLY"
  },
  {
    "isin": "IN1520220337",
    "issuer": "7.49% GJ SDL 28",
    "coupon": 0.0749,
    "yield": 0.0749,
    "maturity": "2028-03-29",
    "months": 19.8,
    "rating": "SOVEREIGN",
    "frequency": "SEMI ANNUALLY"
  },
  {
    "isin": "IN3120180010",
    "issuer": "8.05% TN SDL 28",
    "coupon": 0.0805,
    "yield": 0.0805,
    "maturity": "2028-04-18",
    "months": 20.5,
    "rating": "SOVEREIGN",
    "frequency": "SEMI ANNUALLY"
  },
  {
    "isin": "INE423A07484",
    "issuer": "ADANI ENTERPRISES LTD",
    "coupon": 0.086,
    "yield": 0.086,
    "maturity": "2028-01-12",
    "months": 17.3,
    "rating": "ICRA AA-",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE423A07328",
    "issuer": "ADANI ENTERPRISES LTD",
    "coupon": 0.0965,
    "yield": 0.0965,
    "maturity": "2027-09-12",
    "months": 13.3,
    "rating": "ICRA AA-",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE423A07435",
    "issuer": "ADANI ENTERPRISES LTD",
    "coupon": 0.0915,
    "yield": 0.0915,
    "maturity": "2028-07-17",
    "months": 23.5,
    "rating": "ICRA AA-",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE08XP07431",
    "issuer": "AKARA CAP ADVISORS PVT LTD",
    "coupon": 0.12,
    "yield": 0.12,
    "maturity": "2027-06-11",
    "months": 10.3,
    "rating": "ICRA BBB",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE08XP07399",
    "issuer": "AKARA CAP ADVISORS PVT LTD",
    "coupon": 0.12,
    "yield": 0.12,
    "maturity": "2027-04-13",
    "months": 8.3,
    "rating": "ICRA BBB",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE916Y07057",
    "issuer": "AKME FINTRADE (INDIA) LTD",
    "coupon": 0.12,
    "yield": 0.12,
    "maturity": "2028-04-16",
    "months": 20.4,
    "rating": "ACUITE A-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE0M2307156",
    "issuer": "A.P. STATE BEVERAGES CORP LTD",
    "coupon": 0.0962,
    "yield": 0.0962,
    "maturity": "2027-11-30",
    "months": 15.9,
    "rating": "IND AA (CE)",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE0M2307065",
    "issuer": "A.P. STATE BEVERAGES CORP LTD",
    "coupon": 0.0962,
    "yield": 0.0962,
    "maturity": "2028-05-31",
    "months": 21.9,
    "rating": "IND AA (CE)",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE891K07952",
    "issuer": "AXIS FIN LTD",
    "coupon": 0.0835,
    "yield": 0.0835,
    "maturity": "2027-05-07",
    "months": 9.1,
    "rating": "IND AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE501X07661",
    "issuer": "AYE FIN LTD",
    "coupon": 0.0995,
    "yield": 0.0995,
    "maturity": "2027-03-20",
    "months": 7.5,
    "rating": "IND A+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE121A08OG9",
    "issuer": "CHOLAMANDALAM INVT AND FIN CO LTD",
    "coupon": 0.0905,
    "yield": 0.0905,
    "maturity": "2028-03-24",
    "months": 19.7,
    "rating": "IND AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE121A07QY9",
    "issuer": "CHOLAMANDALAM INVT AND FIN CO LTD",
    "coupon": 0.084,
    "yield": 0.084,
    "maturity": "2028-05-04",
    "months": 21.0,
    "rating": "IND AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE741K07587",
    "issuer": "CREDITACCESS GRAMEEN LTD",
    "coupon": 0.094,
    "yield": 0.094,
    "maturity": "2027-11-07",
    "months": 15.1,
    "rating": "IND AA-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE741K07496",
    "issuer": "CREDITACCESS GRAMEEN LTD",
    "coupon": 0.1,
    "yield": 0.1,
    "maturity": "2027-11-23",
    "months": 15.7,
    "rating": "IND AA-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE804I08759",
    "issuer": "ECL FIN LTD",
    "coupon": 0.0965,
    "yield": 0.0965,
    "maturity": "2027-06-08",
    "months": 10.2,
    "rating": "CRISIL A",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE532F07IC9",
    "issuer": "EDELWEISS FINANCIAL SERV LTD",
    "coupon": 0.09,
    "yield": 0.09,
    "maturity": "2027-10-07",
    "months": 14.1,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE532F07FL6",
    "issuer": "EDELWEISS FINANCIAL SERV LTD",
    "coupon": 0.096,
    "yield": 0.096,
    "maturity": "2027-04-29",
    "months": 8.8,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE532F07FK8",
    "issuer": "EDELWEISS FINANCIAL SERV LTD",
    "coupon": 0.092,
    "yield": 0.092,
    "maturity": "2027-04-29",
    "months": 8.8,
    "rating": "CRISIL A+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE532F07DK3",
    "issuer": "EDELWEISS FINANCIAL SERV LTD",
    "coupon": 0.0967,
    "yield": 0.0967,
    "maturity": "2028-01-20",
    "months": 17.6,
    "rating": "CRISIL A+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE532F07GZ4",
    "issuer": "EDELWEISS FINANCIAL SERV LTD",
    "coupon": 0.1,
    "yield": 0.1,
    "maturity": "2028-01-24",
    "months": 17.7,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE861G08027",
    "issuer": "FOOD CORP OF INDIA",
    "coupon": 0.088,
    "yield": 0.088,
    "maturity": "2028-03-22",
    "months": 19.6,
    "rating": "CRISIL AAA (CE)",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE756I07FA8",
    "issuer": "HDB FINANCIAL SERV LTD",
    "coupon": 0.0833,
    "yield": 0.0833,
    "maturity": "2027-08-06",
    "months": 12.1,
    "rating": "CRISIL AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE031A07865",
    "issuer": "HUDCO LTD",
    "coupon": 0.0751,
    "yield": 0.0751,
    "maturity": "2028-02-16",
    "months": 18.5,
    "rating": "IND AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE031A07881",
    "issuer": "HUDCO LTD",
    "coupon": 0.0719,
    "yield": 0.0719,
    "maturity": "2028-03-28",
    "months": 19.8,
    "rating": "IND AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530B07534",
    "issuer": "IIFL FIN LTD",
    "coupon": 0.093,
    "yield": 0.093,
    "maturity": "2027-04-21",
    "months": 8.6,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530B08102",
    "issuer": "IIFL FIN LTD",
    "coupon": 0.096,
    "yield": 0.096,
    "maturity": "2028-06-24",
    "months": 22.7,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE477L07BB2",
    "issuer": "IIFL HOME FIN LTD",
    "coupon": 0.0865,
    "yield": 0.0865,
    "maturity": "2027-12-26",
    "months": 16.8,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE053F07595",
    "issuer": "IRFC LTD",
    "coupon": 0.0704,
    "yield": 0.0704,
    "maturity": "2028-03-23",
    "months": 19.6,
    "rating": "CRISIL AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE219X07249",
    "issuer": "INDIGRID INFRA TRUST",
    "coupon": 0.0769,
    "yield": 0.0769,
    "maturity": "2028-05-06",
    "months": 21.1,
    "rating": "IND AAA",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE896L07AA7",
    "issuer": "INDOSTAR CAP FIN LTD",
    "coupon": 0.107,
    "yield": 0.107,
    "maturity": "2027-09-25",
    "months": 13.7,
    "rating": "CARE AA-",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE651J07622",
    "issuer": "JM FINANCIAL CREDIT SOL LTD",
    "coupon": 0.0975,
    "yield": 0.0975,
    "maturity": "2028-06-07",
    "months": 22.1,
    "rating": "IND AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE651J07630",
    "issuer": "JM FINANCIAL CREDIT SOL LTD",
    "coupon": 0.0934,
    "yield": 0.0934,
    "maturity": "2028-06-07",
    "months": 22.1,
    "rating": "IND AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE0NES07113",
    "issuer": "KEERTANA FINSERV LTD",
    "coupon": 0.114,
    "yield": 0.114,
    "maturity": "2027-06-13",
    "months": 10.3,
    "rating": "ICRA BBB",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE658F08086",
    "issuer": "KERALA INFRA INVT FUND BOARD",
    "coupon": 0.0895,
    "yield": 0.0895,
    "maturity": "2027-12-22",
    "months": 16.6,
    "rating": "IND AA(CE)",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE07HK07858",
    "issuer": "KRAZYBEE SERV LTD",
    "coupon": 0.115,
    "yield": 0.115,
    "maturity": "2027-03-29",
    "months": 7.8,
    "rating": "CARE A",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE774D08MK5",
    "issuer": "MAHINDRA AND MAHINDRA FINANCIAL SERV LTD",
    "coupon": 0.08,
    "yield": 0.08,
    "maturity": "2027-07-24",
    "months": 11.7,
    "rating": "IND AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE774D07VE1",
    "issuer": "MAHINDRA AND MAHINDRA FINANCIAL SERV LTD",
    "coupon": 0.0825,
    "yield": 0.0825,
    "maturity": "2027-03-25",
    "months": 7.7,
    "rating": "IND AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE774D07UM6",
    "issuer": "MAHINDRA AND MAHINDRA FINANCIAL SERV LTD",
    "coupon": 0.079,
    "yield": 0.079,
    "maturity": "2027-08-30",
    "months": 12.9,
    "rating": "IND AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE950O08147",
    "issuer": "MAHINDRA RURAL HSG FIN LTD",
    "coupon": 0.085,
    "yield": 0.085,
    "maturity": "2027-06-15",
    "months": 10.4,
    "rating": "IND AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE939X07234",
    "issuer": "MANBA FIN LTD",
    "coupon": 0.1095,
    "yield": 0.1095,
    "maturity": "2027-10-20",
    "months": 14.6,
    "rating": "CARE BBB+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE348L07209",
    "issuer": "MAS FINANCIAL SERV LTD",
    "coupon": 0.0957,
    "yield": 0.0957,
    "maturity": "2027-06-21",
    "months": 10.6,
    "rating": "CARE AA-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE884Q07764",
    "issuer": "MIDLAND MICROFIN LTD",
    "coupon": 0.1075,
    "yield": 0.1075,
    "maturity": "2027-05-27",
    "months": 9.8,
    "rating": "ACUITE A-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE414G07GM1",
    "issuer": "MUTHOOT FIN LTD",
    "coupon": 0.07,
    "yield": 0.07,
    "maturity": "2027-06-23",
    "months": 10.6,
    "rating": "ICRA AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE414G07HH9",
    "issuer": "MUTHOOT FIN LTD",
    "coupon": 0.075,
    "yield": 0.075,
    "maturity": "2027-12-23",
    "months": 16.7,
    "rating": "ICRA AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE414G07HE6",
    "issuer": "MUTHOOT FIN LTD",
    "coupon": 0.0775,
    "yield": 0.0775,
    "maturity": "2027-12-23",
    "months": 16.7,
    "rating": "ICRA AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE414G07GG3",
    "issuer": "MUTHOOT FIN LTD",
    "coupon": 0.07,
    "yield": 0.07,
    "maturity": "2027-05-05",
    "months": 9.0,
    "rating": "ICRA AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE414G07GO7",
    "issuer": "MUTHOOT FIN LTD",
    "coupon": 0.0725,
    "yield": 0.0725,
    "maturity": "2027-06-23",
    "months": 10.6,
    "rating": "ICRA AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE414G07GY6",
    "issuer": "MUTHOOT FIN LTD",
    "coupon": 0.075,
    "yield": 0.075,
    "maturity": "2027-11-03",
    "months": 15.0,
    "rating": "ICRA AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE414G07GV2",
    "issuer": "MUTHOOT FIN LTD",
    "coupon": 0.0725,
    "yield": 0.0725,
    "maturity": "2027-11-03",
    "months": 15.0,
    "rating": "ICRA AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE414G07HM9",
    "issuer": "MUTHOOT FIN LTD",
    "coupon": 0.0785,
    "yield": 0.0785,
    "maturity": "2028-04-10",
    "months": 20.2,
    "rating": "ICRA AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE414G07HQ0",
    "issuer": "MUTHOOT FIN LTD",
    "coupon": 0.081,
    "yield": 0.081,
    "maturity": "2028-04-10",
    "months": 20.2,
    "rating": "ICRA AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE414G07HZ1",
    "issuer": "MUTHOOT FIN LTD",
    "coupon": 0.0785,
    "yield": 0.0785,
    "maturity": "2028-06-03",
    "months": 22.0,
    "rating": "ICRA AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE414G07IC8",
    "issuer": "MUTHOOT FIN LTD",
    "coupon": 0.081,
    "yield": 0.081,
    "maturity": "2028-06-03",
    "months": 22.0,
    "rating": "ICRA AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE549K07FZ0",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0965,
    "yield": 0.0965,
    "maturity": "2028-02-24",
    "months": 18.7,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE549K07EE8",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0965,
    "yield": 0.0965,
    "maturity": "2027-09-16",
    "months": 13.4,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE549K07ET6",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0925,
    "yield": 0.0925,
    "maturity": "2027-10-30",
    "months": 14.9,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE549K07CB8",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0915,
    "yield": 0.0915,
    "maturity": "2028-05-02",
    "months": 21.0,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE549K08210",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.094,
    "yield": 0.094,
    "maturity": "2027-03-15",
    "months": 7.4,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE549K07GC7",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.094,
    "yield": 0.094,
    "maturity": "2027-05-19",
    "months": 9.5,
    "rating": "CRISIL AA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE549K07EC2",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0925,
    "yield": 0.0925,
    "maturity": "2027-09-16",
    "months": 13.4,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE549K07FU1",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0925,
    "yield": 0.0925,
    "maturity": "2028-02-24",
    "months": 18.7,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE549K07CD4",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.088,
    "yield": 0.088,
    "maturity": "2028-05-02",
    "months": 21.0,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE549K07GX3",
    "issuer": "MUTHOOT FINCORP LTD",
    "coupon": 0.0905,
    "yield": 0.0905,
    "maturity": "2028-07-16",
    "months": 23.4,
    "rating": "CRISIL AA",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE261F08AD8",
    "issuer": "NABARD",
    "coupon": 0.082,
    "yield": 0.082,
    "maturity": "2028-03-09",
    "months": 19.2,
    "rating": "CRISIL AAA",
    "frequency": "SEMI ANNUALLY"
  },
  {
    "isin": "INE342T07445",
    "issuer": "NAVI FINSERV LTD",
    "coupon": 0.1119,
    "yield": 0.1119,
    "maturity": "2027-03-13",
    "months": 7.3,
    "rating": "CRISIL A",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530L07AW6",
    "issuer": "NIDO HOME FIN LTD",
    "coupon": 0.1,
    "yield": 0.1,
    "maturity": "2028-07-02",
    "months": 23.0,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530L07AF1",
    "issuer": "NIDO HOME FIN LTD",
    "coupon": 0.095,
    "yield": 0.095,
    "maturity": "2027-04-03",
    "months": 8.0,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530L07970",
    "issuer": "NIDO HOME FIN LTD",
    "coupon": 0.0958,
    "yield": 0.0958,
    "maturity": "2028-01-06",
    "months": 17.1,
    "rating": "CRISIL A+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE530L07863",
    "issuer": "NIDO HOME FIN LTD",
    "coupon": 0.1,
    "yield": 0.1,
    "maturity": "2027-10-08",
    "months": 14.2,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE530L07AK1",
    "issuer": "NIDO HOME FIN LTD",
    "coupon": 0.1,
    "yield": 0.1,
    "maturity": "2028-04-03",
    "months": 20.0,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE134E07364",
    "issuer": "PFC LTD",
    "coupon": 0.0704,
    "yield": 0.0704,
    "maturity": "2028-03-28",
    "months": 19.8,
    "rating": "CRISIL AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE134E08JP5",
    "issuer": "PFC LTD",
    "coupon": 0.0785,
    "yield": 0.0785,
    "maturity": "2028-04-03",
    "months": 20.0,
    "rating": "CRISIL AAA",
    "frequency": "SEMI ANNUALLY"
  },
  {
    "isin": "INE020B07GX4",
    "issuer": "REC LTD",
    "coupon": 0.0738,
    "yield": 0.0738,
    "maturity": "2027-12-19",
    "months": 16.5,
    "rating": "CRISIL AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE020B07GZ9",
    "issuer": "REC LTD",
    "coupon": 0.0704,
    "yield": 0.0704,
    "maturity": "2028-03-25",
    "months": 19.7,
    "rating": "CRISIL AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE148I07WE5",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0965,
    "yield": 0.0965,
    "maturity": "2027-03-19",
    "months": 7.5,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE148I07NV8",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0971,
    "yield": 0.0971,
    "maturity": "2028-03-23",
    "months": 19.6,
    "rating": "CRISIL AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE148I07TH4",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0902,
    "yield": 0.0902,
    "maturity": "2027-05-31",
    "months": 9.9,
    "rating": "CRISIL AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE148I07WH8",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0925,
    "yield": 0.0925,
    "maturity": "2027-03-19",
    "months": 7.5,
    "rating": "CRISIL AA+",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE894F08087",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.1065,
    "yield": 0.1065,
    "maturity": "2027-06-05",
    "months": 10.1,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE148I07UF6",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.094,
    "yield": 0.094,
    "maturity": "2027-09-25",
    "months": 13.7,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE148I07VS7",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.094,
    "yield": 0.094,
    "maturity": "2027-12-27",
    "months": 16.8,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE244L08034",
    "issuer": "SAMMAAN FINSERVE LTD",
    "coupon": 0.0845,
    "yield": 0.0845,
    "maturity": "2028-01-05",
    "months": 17.1,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE244L07283",
    "issuer": "SAMMAAN FINSERVE LTD",
    "coupon": 0.103,
    "yield": 0.103,
    "maturity": "2028-02-02",
    "months": 18.0,
    "rating": "CRISIL AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE836B07857",
    "issuer": "SATIN CREDITCARE NETWORK LTD",
    "coupon": 0.104,
    "yield": 0.104,
    "maturity": "2027-04-30",
    "months": 8.9,
    "rating": "ICRA A",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE721A08DA2",
    "issuer": "SHRIRAM FIN LTD",
    "coupon": 0.09,
    "yield": 0.09,
    "maturity": "2028-03-28",
    "months": 19.8,
    "rating": "CRISIL AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE033L07GU2",
    "issuer": "TATA CAP HSG FIN LTD",
    "coupon": 0.084,
    "yield": 0.084,
    "maturity": "2028-01-14",
    "months": 17.4,
    "rating": "CRISIL AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE306N07LM5",
    "issuer": "TATA CAP LTD",
    "coupon": 0.0865,
    "yield": 0.0865,
    "maturity": "2027-08-26",
    "months": 12.7,
    "rating": "CRISIL AAA",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE1C3207057",
    "issuer": "TELANGANA STATE IND INFRA CORP LTD",
    "coupon": 0.0935,
    "yield": 0.0935,
    "maturity": "2027-12-31",
    "months": 16.9,
    "rating": "IND AA(CE)",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE0TLC07093",
    "issuer": "THE  A.P. MINERAL DEV CORP LTD",
    "coupon": 0.093,
    "yield": 0.093,
    "maturity": "2028-05-09",
    "months": 21.2,
    "rating": "IND AA(CE)",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE540P07178",
    "issuer": "U.P. POWER CORP LTD",
    "coupon": 0.0848,
    "yield": 0.0848,
    "maturity": "2027-03-15",
    "months": 7.4,
    "rating": "IND AA (CE)",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE540P07269",
    "issuer": "U.P. POWER CORP LTD",
    "coupon": 0.0975,
    "yield": 0.0975,
    "maturity": "2027-10-20",
    "months": 14.6,
    "rating": "CRISIL A+ (CE)",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE540P07350",
    "issuer": "U.P. POWER CORP LTD",
    "coupon": 0.1015,
    "yield": 0.1015,
    "maturity": "2028-01-20",
    "months": 17.6,
    "rating": "CRISIL A+ (CE)",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE540P07392",
    "issuer": "U.P. POWER CORP LTD",
    "coupon": 0.097,
    "yield": 0.097,
    "maturity": "2028-03-31",
    "months": 19.9,
    "rating": "CRISIL A+ (CE)",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE0M2307321",
    "issuer": "A.P. STATE BEVERAGES CORP LTD",
    "coupon": 0.0915,
    "yield": 0.0915,
    "maturity": "2027-11-30",
    "months": 15.9,
    "rating": "IND AA (CE)",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE0BUS07CK0",
    "issuer": "INDEL MONEY LTD",
    "coupon": 0.1,
    "yield": 0.1,
    "maturity": "2028-04-17",
    "months": 20.5,
    "rating": "IND A-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE148I07SY1",
    "issuer": "SAMMAAN CAP LTD",
    "coupon": 0.0975,
    "yield": 0.0975,
    "maturity": "2027-04-03",
    "months": 8.0,
    "rating": "ICRA AA+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE03K307116",
    "issuer": "SATIN FINSERV LTD",
    "coupon": 0.1075,
    "yield": 0.1075,
    "maturity": "2028-02-26",
    "months": 18.8,
    "rating": "ICRA A-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE03K307074",
    "issuer": "SATIN FINSERV LTD",
    "coupon": 0.1095,
    "yield": 0.1095,
    "maturity": "2027-09-29",
    "months": 13.9,
    "rating": "ICRA A-",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE658F08151",
    "issuer": "KERALA INFRA INVT FUND BOARD",
    "coupon": 0.091,
    "yield": 0.091,
    "maturity": "2028-03-26",
    "months": 19.7,
    "rating": "IND AA(CE)",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE530L07772",
    "issuer": "NIDO HOME FIN LTD",
    "coupon": 0.1,
    "yield": 0.1,
    "maturity": "2027-07-03",
    "months": 11.0,
    "rating": "CRISIL A+",
    "frequency": "ANNUALLY"
  },
  {
    "isin": "INE01YL07433",
    "issuer": "EARLYSALARY SERV PVT LTD",
    "coupon": 0.105,
    "yield": 0.105,
    "maturity": "2028-06-09",
    "months": 22.2,
    "rating": "CARE A-",
    "frequency": "QUARTERLY"
  },
  {
    "isin": "INE08XP07498",
    "issuer": "AKARA CAP ADVISORS PVT LTD",
    "coupon": 0.12,
    "yield": 0.12,
    "maturity": "2027-11-07",
    "months": 15.1,
    "rating": "ICRA  BBB",
    "frequency": "MONTHLY"
  },
  {
    "isin": "INE530B07666",
    "issuer": "IIFL FINANCE LIMITED",
    "coupon": 0.086,
    "yield": 0.086,
    "maturity": "2027-03-24",
    "months": 7.7,
    "rating": "CRISIL AA",
    "frequency": "ON MATURITY"
  },
  {
    "isin": "INE342T07536",
    "issuer": "NAVI FINSERV LTD",
    "coupon": 0.105,
    "yield": 0.105,
    "maturity": "2027-08-27",
    "months": 12.8,
    "rating": "CRISIL A",
    "frequency": "MONTHLY"
  }
];
