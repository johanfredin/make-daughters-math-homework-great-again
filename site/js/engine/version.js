// Cache busting (0005): the deploy stamps "?v=<sha>" onto every module URL, so this module's own
// import.meta.url carries the release version. Data files are fetched with the same query, so a
// new release never mixes old code with new data. Locally there is no query and nothing changes.

/** url with its query replaced by `search` ("" leaves the url as it is). */
export function withSearch(url, search) {
  const u = new URL(url)
  if (search) u.search = search
  return u
}

const RELEASE = new URL(import.meta.url).search

/** url tagged with this release's version. */
export const versioned = (url) => withSearch(url, RELEASE)
