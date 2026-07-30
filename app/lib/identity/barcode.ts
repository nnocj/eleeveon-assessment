const BARCODE_PREFIX = "ELV";

export function normalizeBarcode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export function buildIdentityBarcode(
  subjectCode: string,
  serial: string | number,
): string {
  const subject = normalizeBarcode(subjectCode);
  const normalizedSerial = normalizeBarcode(String(serial));
  return `${BARCODE_PREFIX}-${subject}-${normalizedSerial}`;
}

export function parseIdentityBarcode(
  value: string,
): { subjectCode: string; serial: string } | null {
  const normalized = normalizeBarcode(value);
  const match = normalized.match(/^ELV-([A-Z0-9]+)-([A-Z0-9-]+)$/);
  if (!match) return null;

  return {
    subjectCode: match[1],
    serial: match[2],
  };
}
