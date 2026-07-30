import {
  IDENTITY_QR_VERSION,
  IDENTITY_TOKEN_PREFIX,
} from "./constants";

export interface IdentityQrPayload {
  version: number;
  credentialId: string;
  reference: string;
  issuedAt: number;
  expiresAt?: number | null;
  nonce?: string;
}

function encodeBase64Url(value: string): string {
  if (typeof btoa === "function") {
    const bytes = new TextEncoder().encode(value);
    let binary = "";

    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }

    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  const BufferCtor = (
    globalThis as unknown as {
      Buffer?: {
        from(
          input: string,
          encoding?: string,
        ): {
          toString(encoding: string): string;
        };
      };
    }
  ).Buffer;

  if (!BufferCtor) {
    throw new Error("Base64 encoding is unavailable.");
  }

  return BufferCtor.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    normalized +
    "=".repeat((4 - (normalized.length % 4)) % 4);

  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = Uint8Array.from(
      binary,
      (character) => character.charCodeAt(0),
    );

    return new TextDecoder().decode(bytes);
  }

  const BufferCtor = (
    globalThis as unknown as {
      Buffer?: {
        from(
          input: string,
          encoding?: string,
        ): {
          toString(encoding: string): string;
        };
      };
    }
  ).Buffer;

  if (!BufferCtor) {
    throw new Error("Base64 decoding is unavailable.");
  }

  return BufferCtor.from(padded, "base64").toString("utf8");
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

export function buildIdentityQrValue(
  payload: Omit<IdentityQrPayload, "version"> &
    Partial<Pick<IdentityQrPayload, "version">>,
): string {
  const credentialId = normalizeText(payload.credentialId);
  const reference = normalizeText(payload.reference);

  if (!credentialId) {
    throw new Error(
      "Cannot build an identity QR value without a credentialId.",
    );
  }

  if (!reference) {
    throw new Error(
      "Cannot build an identity QR value without a reference.",
    );
  }

  if (!Number.isFinite(payload.issuedAt)) {
    throw new Error(
      "Cannot build an identity QR value without a valid issuedAt value.",
    );
  }

  if (
    payload.expiresAt != null &&
    !Number.isFinite(payload.expiresAt)
  ) {
    throw new Error(
      "Identity QR expiresAt must be a valid timestamp.",
    );
  }

  const body: IdentityQrPayload = {
    version: payload.version ?? IDENTITY_QR_VERSION,
    credentialId,
    reference,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt ?? null,
    nonce: normalizeText(payload.nonce) || undefined,
  };

  return `${IDENTITY_TOKEN_PREFIX}.${encodeBase64Url(
    JSON.stringify(body),
  )}`;
}

export function parseIdentityQrValue(
  rawValue: string,
): IdentityQrPayload | null {
  const normalizedValue = normalizeText(rawValue);
  if (!normalizedValue) return null;

  const separatorIndex = normalizedValue.indexOf(".");
  if (separatorIndex <= 0) return null;

  const prefix = normalizedValue.slice(0, separatorIndex);
  const encoded = normalizedValue.slice(separatorIndex + 1);

  if (
    prefix !== IDENTITY_TOKEN_PREFIX ||
    !encoded ||
    encoded.includes(".")
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      decodeBase64Url(encoded),
    ) as Partial<IdentityQrPayload>;

    const credentialId = normalizeText(parsed.credentialId);
    const reference = normalizeText(parsed.reference);
    const nonce = normalizeText(parsed.nonce);

    if (
      parsed.version !== IDENTITY_QR_VERSION ||
      !credentialId ||
      !reference ||
      !Number.isFinite(parsed.issuedAt) ||
      (parsed.expiresAt != null &&
        !Number.isFinite(parsed.expiresAt))
    ) {
      return null;
    }

    return {
      version: parsed.version,
      credentialId,
      reference,
      issuedAt: parsed.issuedAt as number,
      expiresAt: parsed.expiresAt ?? null,
      nonce: nonce || undefined,
    };
  } catch {
    return null;
  }
}

export function isQrPayloadExpired(
  payload: IdentityQrPayload,
  now = Date.now(),
): boolean {
  return (
    payload.expiresAt != null &&
    Number.isFinite(payload.expiresAt) &&
    payload.expiresAt <= now
  );
}

export function isIdentityQrValueExpired(
  rawValue: string,
  now = Date.now(),
): boolean {
  const payload = parseIdentityQrValue(rawValue);
  return payload ? isQrPayloadExpired(payload, now) : true;
}