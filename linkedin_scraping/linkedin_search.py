import os
import json
from typing import Optional, List, Dict
from dataclasses import dataclass
import httpx
from dotenv import load_dotenv

@dataclass
class LinkedInProfile:
    name: Optional[str]
    handle: Optional[str]
    job_title: Optional[str]
    summary: Optional[str]
    location: Optional[str]
    image: Optional[str]
    url: Optional[str]

class LinkedInSearcher:
    def __init__(self):
        load_dotenv()
        csrf_token = os.getenv('LINKEDIN_CSRF_TOKEN')
        # Updated cookie format to match your .env file
        self.headers = {
            "cookie": (
                f"li_at={os.getenv('LINKEDIN_LI_AT')}; "
                f"JSESSIONID=ajax:{csrf_token}; "
                f"bcookie={os.getenv('LINKEDIN_BCOOKIE')}; "  # Already includes v=2
                f"bscookie={os.getenv('LINKEDIN_BSCOOKIE')}; "  # Already includes v=1
                f"lidc={os.getenv('LINKEDIN_LIDC')}"  # Already includes full format
            ),
            "csrf-token": f"ajax:{csrf_token}",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
            "accept-language": "en-US,en;q=0.9",
            "accept": "application/vnd.linkedin.normalized+json+2.1",
            "x-restli-protocol-version": "2.0.0",
            "origin": "https://www.linkedin.com",
            "referer": "https://www.linkedin.com/search/results/people/"
        }

    def get_profile_url(self, navigation_url: Optional[str]) -> Optional[str]:
        """Clean LinkedIn profile URL by removing query parameters"""
        return navigation_url.split("?")[0] if navigation_url else None

    def get_handle(self, profile_url: Optional[str]) -> Optional[str]:
        """Extract handle from LinkedIn profile URL"""
        url = self.get_profile_url(profile_url)
        return url.split("/in/")[1] if url and "/in/" in url else None

    async def search_people(self, query: str) -> Optional[Dict]:
        """Make API request to LinkedIn search"""
        # Use same parameters as JS implementation
        params = {
            "decorationId": "com.linkedin.voyager.dash.deco.search.SearchClusterCollection-165",
            "origin": "FACETED_SEARCH",
            "q": "all",
            "query": f"(keywords:{query},flagshipSearchIntent:SEARCH_SRP,queryParameters:(position:List(0),resultType:List(PEOPLE)),includeFiltersInResponse:false)",
            "start": 0,
            "count": 10
        }

        # Simplified headers matching JS version
        headers = {
            **self.headers,
            "accept": "application/vnd.linkedin.normalized+json+2.1",
            "x-li-lang": "en_US",
            "x-li-track": "{\"clientVersion\":\"1.12.6\"}",
            "referer": "https://www.linkedin.com/search/results/people/",
            "origin": "https://www.linkedin.com"
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Match JS axios configuration
                response = await client.get(
                    "https://www.linkedin.com/voyager/api/search/dash/clusters",
                    headers=headers,
                    params=params,
                    follow_redirects=True
                )

                if response.status_code != 200:
                    print("Response:", json.dumps(response.json(), indent=2))
                    return None

                return response.json()

        except Exception as err:
            print(f"Search failed: {str(err)}")
            return None

    def format_profiles(self, peoples_profiles: List[Dict]) -> List[LinkedInProfile]:
        """Transform raw API response into clean profile objects"""
        return [
            LinkedInProfile(
                name=p.get("title", {}).get("text"),
                handle=self.get_handle(p.get("navigationUrl")),
                job_title=p.get("primarySubtitle", {}).get("text"),
                summary=p.get("summary", {}).get("text"),
                location=p.get("secondarySubtitle", {}).get("text"),
                image=p.get("image", {}).get("attributes", [{}])[0].get("detailData", {}).get("nonEntityProfilePicture", {}).get("vectorImage", {}).get("artifacts", [{}])[0].get("fileIdentifyingUrlPathSegment"),
                url=self.get_profile_url(p.get("navigationUrl"))
            )
            for p in peoples_profiles
        ]

    async def search(self, query: str) -> List[LinkedInProfile]:
        """Main search method"""
        try:
            search_data = await self.search_people(query)
            if not search_data:
                print("No search results returned")
                return []

            profiles = [s for s in search_data.get("included", []) if s.get("template") == "UNIVERSAL"]
            if not profiles:
                print("No profiles found for query:", query)
                return []

            return self.format_profiles(profiles)
        except Exception as error:
            print("Search error:", str(error))
            return []

async def main():
    try:
        searcher = LinkedInSearcher()
        query = "eitan bakirov"
        print("Searching for:", query, "\n")
        
        results = await searcher.search(query)
        if not results:
            print("No results found")
            return

        print(f"Found {len(results)} profiles:\n")
        for i, profile in enumerate(results, 1):
            print(f"Profile {i}:")
            print(f"Name: {profile.name}")
            print(f"Title: {profile.job_title}")
            print(f"Location: {profile.location}")
            print(f"URL: {profile.url}")
            print(f"Handle: {profile.handle}\n")
    except Exception as error:
        print("Script execution failed:", str(error))

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())