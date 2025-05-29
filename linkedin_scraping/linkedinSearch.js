// linkedinSearch.js
import axios from "axios";
import dotenv from 'dotenv';

class LinkedInSearcher {
  constructor() {
    dotenv.config();
    this.headers = {
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
  }

  /**
   * Clean LinkedIn profile URL by removing query parameters
   */
  getProfileUrl(navigationUrl) {
    return navigationUrl?.split("?")?.[0];
  }

  /**
   * Extract handle from LinkedIn profile URL
   */
  getHandle(profileUrl) {
    const url = this.getProfileUrl(profileUrl);
    return url?.split("/in/")?.[1];
  }

  /**
   * Make API request to LinkedIn search
   */
  async searchPeople(query) {
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
        headers: this.headers,
        params,
        maxRedirects: 5,
        withCredentials: true
      });

      if (res.status !== 200) {
        console.log("Response:", JSON.stringify(res.data, null, 2));
      }
      
      return res.data || null;
    } catch (err) {
      console.log("Search failed:", err.message);
      return null;
    }
  }

  /**
   * Transform raw API response into clean profile objects
   */
  formatProfiles(peoplesProfiles) {
    return peoplesProfiles.map((p) => ({
      name: p?.title?.text || null,
      handle: this.getHandle(p?.navigationUrl) || null,
      jobTitle: p?.primarySubtitle?.text || null,
      summary: p?.summary?.text || null,
      location: p?.secondarySubtitle?.text || null,
      image: p?.image?.attributes?.[0]?.detailData?.nonEntityProfilePicture
        ?.vectorImage?.artifacts?.[0]?.fileIdentifyingUrlPathSegment || null,
      url: this.getProfileUrl(p?.navigationUrl) || null,
    }));
  }

  /**
   * Main search method
   */
  async search(query) {
    try {
      const search = await this.searchPeople(query);
      
      if (!search) {
        console.log("No search results returned");
        return [];
      }

      const profiles = search?.included?.filter(s => s?.template === "UNIVERSAL") || [];
      if (!profiles.length) {
        console.log("No profiles found for query:", query);
        return [];
      }

      return this.formatProfiles(profiles);
    } catch (error) {
      console.log("Search error:", error.message);
      return [];
    }
  }
}

// Main execution
async function main() {
  try {
    const searcher = new LinkedInSearcher();
    const query = "eitan bakirov";
    console.log("Searching for:", query, "\n");
    
    const results = await searcher.search(query);
    if (!results.length) {
      console.log("No results found");
      return;
    }

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
}

// Run if this is the main module
if (import.meta.url === import.meta.resolve('./linkedinSearch.js')) {
  main();
}

export { LinkedInSearcher };



