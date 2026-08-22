/**
 * Parses a search query into inclusion terms (normal strings) and exclusion terms (starting with '-').
 * Supports comma-separated multi-term queries.
 *
 * Example: "NL-01-0103, -CMB-02-004"
 * => { includeTerms: ['nl-01-0103'], excludeTerms: ['cmb-02-004'] }
 */
export function parseSearchQuery(query) {
    if (!query || typeof query !== 'string') {
        return { includeTerms: [], excludeTerms: [] };
    }

    const rawTerms = query.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const includeTerms = [];
    const excludeTerms = [];

    for (const term of rawTerms) {
        if (term.startsWith('-')) {
            const clean = term.slice(1).trim();
            if (clean) {
                excludeTerms.push(clean);
            }
        } else {
            includeTerms.push(term);
        }
    }

    return { includeTerms, excludeTerms };
}

/**
 * Checks if a single string value satisfies search terms (includes any includeTerm and excludes all excludeTerms).
 */
export function matchesSearchTerms(value, includeTerms, excludeTerms) {
    const val = (value || '').toLowerCase();

    // 1. Check exclusions first: if matching any exclude term, filter out
    if (excludeTerms.length > 0) {
        if (excludeTerms.some(term => val.includes(term))) {
            return false;
        }
    }

    // 2. Check inclusions: if include terms exist, must match at least one
    if (includeTerms.length > 0) {
        return includeTerms.some(term => val.includes(term));
    }

    return true;
}

/**
 * Checks if an array of string values satisfies search terms.
 * An item fails if any of its values match an excludeTerm.
 * An item passes if it passes exclusion check AND (no includeTerms OR matches at least one includeTerm).
 */
export function matchesArraySearchTerms(valuesArray, includeTerms, excludeTerms) {
    const lowerVals = (valuesArray || []).map(v => (v || '').toLowerCase()).filter(Boolean);

    // 1. Exclude if ANY value matches ANY excludeTerm
    if (excludeTerms.length > 0) {
        if (lowerVals.some(v => excludeTerms.some(term => v.includes(term)))) {
            return false;
        }
    }

    // 2. Include if includeTerms exist and ANY value matches ANY includeTerm
    if (includeTerms.length > 0) {
        return lowerVals.some(v => includeTerms.some(term => v.includes(term)));
    }

    return true;
}
