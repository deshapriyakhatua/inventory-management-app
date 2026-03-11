// Cache valid for 30 minutes
const CACHE_EXPIRATION_MS = 30 * 60 * 1000;

export const fetchVerticalsData = async (pin) => {
    // 1. Check Cache
    const cachedData = localStorage.getItem("verticals_cache");
    const cachedTime = localStorage.getItem("verticals_cache_timestamp");

    if (cachedData && cachedTime) {
        const timeElapsed = Date.now() - parseInt(cachedTime, 10);
        if (timeElapsed < CACHE_EXPIRATION_MS) {
            try {
                return JSON.parse(cachedData);
            } catch (e) {
                console.error("Failed to parse cached verticals");
                // Fall back to fetching if parsing fails
            }
        }
    }

    // 2. Fetch Fresh Data
    const payload = {
        pin,
        action: "getVertical",
        pageSize: 100,
        sort: "name_asc"
    };

    try {
        const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload),
        });
        
        const result = await response.json();
        
        if (result.status === 200) {
            const dataToCache = result.data || [];
            
            // 3. Update Cache
            localStorage.setItem("verticals_cache", JSON.stringify(dataToCache));
            localStorage.setItem("verticals_cache_timestamp", Date.now().toString());
            
            return dataToCache;
        } else {
            console.error("API Error fetching verticals:", result.message);
            return [];
        }
    } catch (error) {
        console.error("Network Error fetching verticals:", error);
        return [];
    }
};
