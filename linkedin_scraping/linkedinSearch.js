// linkedinSearch.js
import axios from "axios";
import dotenv from 'dotenv';
dotenv.config();

/**
 * Returns a clean LinkedIn profile URL by removing query parameters.
 * @param {string} navigationUrl - The raw LinkedIn profile URL
 * @returns {string} Clean URL without query parameters
 */
function getLinkedinProfileUrl(navigationUrl) {
  return navigationUrl?.split("?")?.[0];
}

/**
 * Extracts the LinkedIn handle from a profile URL.
 * @param {string} linkedinProfileUrl - The LinkedIn profile URL
 * @returns {string} Profile handle (e.g., "john-doe-123")
 */
function getHandle(linkedinProfileUrl) {
  const url = getLinkedinProfileUrl(linkedinProfileUrl);
  return url?.split("/in/")?.[1];
}

/**
 * Makes an authenticated request to LinkedIn's internal search API.
 * Requires environment variables for authentication tokens.
 * @param {string} query - Search query string
 * @returns {Object|null} Raw API response data or null on failure
 */
async function searchPeople(query) {
  // Request headers required by LinkedIn API
  const headers = {
    "cookie": `bcookie=${process.env.LINKEDIN_BCOOKIE}; li_at=${process.env.LINKEDIN_LI_AT}; JSESSIONID=ajax:${process.env.LINKEDIN_CSRF_TOKEN}; bscookie=${process.env.LINKEDIN_BSCOOKIE}; lidc=${process.env.LINKEDIN_LIDC}`,
    "csrf-token": `ajax:${process.env.LINKEDIN_CSRF_TOKEN}`,
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "accept-language": "en-US,en;q=0.9",
    "accept": "application/vnd.linkedin.normalized+json+2.1",
    "x-restli-protocol-version": "2.0.0",
    "x-li-lang": "en_US",
    "x-li-track": "{\"clientVersion\":\"1.12.6\"}",
    "referer": "https://www.linkedin.com/search/results/people/",
    "origin": "https://www.linkedin.com"
  };

  // Search parameters matching LinkedIn's API requirements
  const params = {
    decorationId: "com.linkedin.voyager.dash.deco.search.SearchClusterCollection-165",
    origin: "FACETED_SEARCH",
    q: "all",
    query: `(keywords:${query},flagshipSearchIntent:SEARCH_SRP,queryParameters:(position:List(0),resultType:List(PEOPLE)),includeFiltersInResponse:false)`,
    start: 0,
    count: 10
  };

  try {
    const res = await axios.get("https://www.linkedin.com/voyager/api/search/dash/clusters", {
      headers,
      params,
      maxRedirects: 5,
      withCredentials: true // Required for cookie handling
    });

    // Validate response status
    if (res.status !== 200) {
      console.log("Response:", JSON.stringify(res.data, null, 2));
    }
    
    if (!res.data) {
      console.log("No data in response");
      return null;
    }
    
    return res.data;
  } catch (err) {
    // Log detailed error information for debugging
    console.log("Failed to search LinkedIn:", err.message);
    if (err.response) {
      console.log("Response status:", err.response.status);
      console.log("Response headers:", JSON.stringify(err.response.headers, null, 2));
    }
    return null;
  }
}

/**
 * Main search function that returns structured profile data.
 * @param {string} query - Search query string
 * @returns {Array<Object>} Array of profile objects with structured data
 */
export async function searchLinkedIn(query) {
  try {
    const search = await searchPeople(query);
    
    if (!search) {
      console.log("No search results returned");
      return [];
    }

    // Filter for profile results only
    const peoplesProfiles = search?.included?.filter(
      (s) => s?.template === "UNIVERSAL"
    ) || [];

    if (!peoplesProfiles.length) {
      console.log("No profiles found for query:", query);
      return [];
    }

    // Transform API response into clean profile objects
    const jsonify = peoplesProfiles.map((p) => ({
      name: p?.title?.text || null,
      handle: getHandle(p?.navigationUrl) || null,
      jobTitle: p?.primarySubtitle?.text || null,
      summary: p?.summary?.text || null,
      location: p?.secondarySubtitle?.text || null,
      image: p?.image?.attributes?.[0]?.detailData?.nonEntityProfilePicture
        ?.vectorImage?.artifacts?.[0]?.fileIdentifyingUrlPathSegment || null,
      url: getLinkedinProfileUrl(p?.navigationUrl) || null,
    }));

    return jsonify;
  } catch (error) {
    console.log("Error in searchLinkedIn:", error.message);
    return [];
  }
}

// Example usage
(async () => {
  try {
    const query = "eitan bakirov";
    console.log(`Searching for: ${query}\n`);
    
    const results = await searchLinkedIn(query);
    if (!results?.length) {
      console.log("No results found");
      return;
    }

    // Display formatted results
    console.log(`Found ${results.length} profiles:\n`);
    results.forEach((profile, index) => {
      console.log(`Profile ${index + 1}:`);
      console.log(`Name: ${profile.name}`);
      console.log(`Title: ${profile.jobTitle}`);
      console.log(`Location: ${profile.location}`);
      console.log(`URL: ${profile.url}`);
      console.log(`Handle: ${profile.handle}\n`);
    });

  } catch (error) {
    console.log("Script execution failed:", error.message);
  }
})();



