export type AssetPrices = {
  BTC: number;
  ETH: number;
  XLM: number;
};

const DEFAULT_COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,stellar&vs_currencies=usd';

const CACHE_TTL_MS = 30_000;

type PriceCache = {
  prices: AssetPrices;
  fetchedAt: number;
};

let cache: PriceCache | null = null;

function getCoingeckoUrl(): string {
  return process.env.COINGECKO_API_URL?.trim() || DEFAULT_COINGECKO_URL;
}

function mapCoingeckoResponse(data: unknown): AssetPrices {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid CoinGecko response');
  }

  const payload = data as Record<string, { usd?: number } | undefined>;
  const btc = payload.bitcoin?.usd;
  const eth = payload.ethereum?.usd;
  const xlm = payload.stellar?.usd;

  if (
    typeof btc !== 'number' ||
    typeof eth !== 'number' ||
    typeof xlm !== 'number'
  ) {
    throw new Error('CoinGecko response missing BTC, ETH, or XLM prices');
  }

  return { BTC: btc, ETH: eth, XLM: xlm };
}

async function fetchFromCoingecko(): Promise<AssetPrices> {
  const response = await fetch(getCoingeckoUrl(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko request failed with status ${response.status}`);
  }

  const data = await response.json();
  return mapCoingeckoResponse(data);
}

/** Clears the in-memory cache (for tests). */
export function resetPriceCache(): void {
  cache = null;
}

/**
 * Returns BTC/ETH/XLM USD prices with a 30-second in-memory cache.
 * Serves stale cache on transient upstream failures when available.
 *
 * TODO: Replace CoinGecko with dedicated oracle service for production
 */
export async function getPrices(): Promise<AssetPrices> {
  const now = Date.now();

  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.prices;
  }

  try {
    const prices = await fetchFromCoingecko();
    cache = { prices, fetchedAt: now };
    return prices;
  } catch (error) {
    if (cache) {
      return cache.prices;
    }
    throw error;
  }
}
