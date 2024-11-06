import { IndicatedAmountsSchemaType } from "../zod-json/dataJsonSchema";

export type FieldNames = {
  Title: string;
  Nazwafirmy: string;
  ImieINazwiskoDluznika: string;
  Pesel?: string;
  Nip?: string;
  ImieINazwiskoKomornika: string;
  NumerTelefonu?: string;
  NumerKm: string;
  RachunekBankowy: string;
  SumaKosztow?: number;
};

const fieldMapping: Record<keyof FieldNames, string> = {
  Title: "Title",
  Nazwafirmy: "Nazwafirmy",
  ImieINazwiskoDluznika: "Imi_x0119_inazwiskod_x0142_u_x01",
  Pesel: "Pesel",
  Nip: "Nip",
  ImieINazwiskoKomornika: "Imi_x0119_inazwiskokomornika",
  NumerTelefonu: "Numertelefonu",
  NumerKm: "Numerkm",
  RachunekBankowy: "Rachunekbankowy",
  SumaKosztow: "Sumakoszt_x00f3_w",
};

export function mapFields(data: FieldNames) {
  const mappedFields: Record<string, any> = {};
  for (const key in data) {
    const sharePointField = fieldMapping[key as keyof FieldNames];
    if (sharePointField) {
      mappedFields[sharePointField] = data[key as keyof FieldNames];
    }
  }
  return mappedFields;
}
