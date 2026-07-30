import type {
  Coordinate,
  GeocodingOptions,
  GeocodingProvider,
  GeocodingResult,
  ReverseGeocodingOptions,
} from "./types";

let activeProvider: GeocodingProvider | null = null;

export function configureGeocodingProvider(
  provider: GeocodingProvider | null,
): void {
  activeProvider = provider;
}

export function getGeocodingProvider(): GeocodingProvider | null {
  return activeProvider;
}

export async function geocodeAddress(
  query: string,
  options?: GeocodingOptions,
  provider = activeProvider,
): Promise<GeocodingResult[]> {
  const normalized = query.trim();
  if (!normalized) return [];
  if (!provider) {
    throw new Error(
      "No geocoding provider is configured. Register one with configureGeocodingProvider().",
    );
  }

  return provider.geocode(normalized, options);
}

export async function reverseGeocodeCoordinate(
  coordinate: Coordinate,
  options?: ReverseGeocodingOptions,
  provider = activeProvider,
): Promise<GeocodingResult[]> {
  if (!provider) {
    throw new Error(
      "No geocoding provider is configured. Register one with configureGeocodingProvider().",
    );
  }

  return provider.reverseGeocode(coordinate, options);
}

export function formatGeocodingAddress(
  result: Omit<GeocodingResult, "coordinate">,
): string {
  if (result.formattedAddress?.trim()) {
    return result.formattedAddress.trim();
  }

  return [
    result.addressLine1,
    result.addressLine2,
    result.locality,
    result.city,
    result.district,
    result.region,
    result.postalCode,
    result.country,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(", ");
}

export function createStaticGeocodingProvider(
  records: readonly GeocodingResult[],
): GeocodingProvider {
  return {
    async geocode(query, options) {
      const needle = query.toLowerCase();
      return records
        .filter((record) =>
          formatGeocodingAddress(record).toLowerCase().includes(needle),
        )
        .slice(0, options?.limit ?? 10);
    },

    async reverseGeocode(coordinate, options) {
      return [...records]
        .sort((a, b) => {
          const distanceA =
            (a.coordinate.latitude - coordinate.latitude) ** 2 +
            (a.coordinate.longitude - coordinate.longitude) ** 2;
          const distanceB =
            (b.coordinate.latitude - coordinate.latitude) ** 2 +
            (b.coordinate.longitude - coordinate.longitude) ** 2;
          return distanceA - distanceB;
        })
        .slice(0, options?.limit ?? 1);
    },
  };
}
