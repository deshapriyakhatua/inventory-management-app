// Cache valid for 30 minutes
const CACHE_EXPIRATION_MS = 30 * 60 * 1000;

export const fetchVerticalsData = async (forceRefresh = false) => {
    // 1. Check Cache
    const cachedData = localStorage.getItem("verticals_cache");
    const cachedTime = localStorage.getItem("verticals_cache_timestamp");

    if (cachedData && cachedTime && !forceRefresh) {
        const timeElapsed = Date.now() - parseInt(cachedTime, 10);
        if (timeElapsed < CACHE_EXPIRATION_MS) {
            try {
                return JSON.parse(cachedData);
            } catch (e) {
                console.error("Failed to parse cached verticals");
            }
        }
    }

    // 2. Fetch Fresh Data
    try {
        const response = await fetch("/api/employee/vertical");
        const result = await response.json();
        
        if (response.ok) {
            const dataToCache = result.data || [];
            
            // 3. Update Cache
            localStorage.setItem("verticals_cache", JSON.stringify(dataToCache));
            localStorage.setItem("verticals_cache_timestamp", Date.now().toString());
            
            return dataToCache;
        } else {
            console.error("API Error fetching verticals:", result.error);
            return [];
        }
    } catch (error) {
        console.error("Network Error fetching verticals:", error);
        return [];
    }
};
