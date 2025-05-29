# ArXiv Research MCP Server

A Model Context Protocol (MCP) server that provides tools for searching and retrieving academic papers from arXiv.

## Features

- Search papers by topic on arXiv
- Extract detailed information about specific papers
- Automatic storage of paper metadata in JSON format
- Integration with MCP inspector for easy testing

## Prerequisites

- Python 3.8+
- `uv` package manager
- Node.js (for MCP inspector)

## Installation

1. Clone the repository and navigate to the project directory:
```bash
cd mcp/mcp_project
```

2. Create and activate a virtual environment using `uv`:
```bash
uv venv
.venv\Scripts\activate  # On Windows
```

3. Install dependencies:
```bash
uv add mcp arxiv
```

## Usage

1. Start the server with MCP inspector:
```bash
npx @modelcontextprotocol/inspector uv run research_server.py
```

2. The server exposes two main tools:

### search_papers
Searches for papers on arXiv based on a topic:
```python
search_papers(topic: str, max_results: int = 5) -> List[str]
```

### extract_info
Retrieves information about a specific paper:
```python
extract_info(paper_id: str) -> str
```

## Data Storage

Papers information is stored in JSON files under the `papers` directory, organized by search topics. Each topic creates a subdirectory containing a `papers_info.json` file with the following structure:

```json
{
  "paper_id": {
    "title": "Paper Title",
    "authors": ["Author 1", "Author 2"],
    "summary": "Paper abstract...",
    "pdf_url": "https://arxiv.org/pdf/...",
    "published": "YYYY-MM-DD"
  }
}
```

## License

MIT
