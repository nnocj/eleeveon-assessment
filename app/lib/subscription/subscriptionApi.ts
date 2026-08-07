import type { EffectiveAccessResponse } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";

function token() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("eleeveon_access_token") ??
    localStorage.getItem("access_token") ??
    localStorage.getItem("token")
  );
}

async function request(path: string, method = "GET") {
  const auth = token();
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const body = await response.json() as { message?: string | string[] };
      message = Array.isArray(body.message)
        ? body.message.join("; ")
        : body.message ?? message;
    } catch {}
    throw new Error(message);
  }

  return response.json() as Promise<EffectiveAccessResponse>;
}

export const fetchCurrentAccess = () =>
  request("/entitlements/current");

export const rebuildCurrentAccess = () =>
  request("/entitlements/rebuild", "POST");
