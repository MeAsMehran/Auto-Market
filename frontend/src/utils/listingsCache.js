import { getMyListings } from '../lib/carApi';

// Shared cache for the current user's listings, with a short TTL so revisits
// render instantly while still picking up server-side changes within a minute.
let listingsCache = { data: null, at: 0 };
const TTL = 60_000;

export function invalidateListingsCache() {
  listingsCache = { data: null, at: 0 };
}

export async function getAllListings() {
  if (listingsCache.data && Date.now() - listingsCache.at < TTL) {
    return listingsCache.data;
  }

  let allResults = [];
  const pageSize = 50;

  const first = await getMyListings(1, pageSize);
  allResults = allResults.concat(Array.isArray(first) ? first : first.results || []);

  if (!Array.isArray(first) && first.next) {
    const count = first.count ?? allResults.length;
    const totalPages = Math.min(Math.ceil(count / pageSize), 10);
    const restPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        getMyListings(i + 2, pageSize)
          .then((d) => (Array.isArray(d) ? d : d.results || []))
          .catch(() => [])
      )
    );
    for (const results of restPages) allResults = allResults.concat(results);
  }

  listingsCache = { data: allResults, at: Date.now() };
  return allResults;
}
