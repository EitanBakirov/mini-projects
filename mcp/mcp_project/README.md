# ArXiv Research MCP Server

A Model Context Protocol (MCP) server that provides tools for searching and retrieving academic papers from arXiv.

## Features

- Search papers by topic on arXiv
- Extract detailed information about specific papers
- Automatic storage of paper metadata in JSON format
- Multiple client options:
  - MCP Inspector for visual testing
  - AI-powered chatbot for natural language interactions

## Prerequisites

- Python 3.8+
- `uv` package manager
- Node.js (for MCP inspector)
- Anthropic API key (for chatbot)

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
uv add mcp arxiv anthropic
```

4. Set up your Anthropic API key (for chatbot):
Create a `.env` file in the project root:
```plaintext
ANTHROPIC_API_KEY=your_api_key_here
```

## Usage

You can interact with the system in three ways:

### 1. MCP Inspector (Visual Interface)
```bash
npx @modelcontextprotocol/inspector uv run research_server.py
```
This will:
- Start a new server instance
- Open the MCP Inspector UI at http://127.0.0.1:6274
- Allow visual interaction with the research tools

### 2. AI Chatbot (Research Server Only)
```bash
uv run mcp_chatbot.py
```
This will:
- Start a new dedicated research server instance
- Launch an AI-powered chatbot interface
- Allow natural language queries about research papers

### 3. AI Chatbot with Multiple Servers
```bash
uv run mcp_chatbot_several_servers.py
```
This will:
- Start multiple MCP servers:
  - Research server (ArXiv paper search and info)
  - Filesystem server (Local file operations)
  - Fetch server (HTTP requests)
- Enable the chatbot to:
  - Search and retrieve papers
  - Save papers locally
  - Download PDFs
  - Access external APIs

Additional dependencies for multi-server setup:
```bash
# Install filesystem server
npm install @modelcontextprotocol/server-filesystem

# Install fetch server
uv add mcp-server-fetch
```

**Note**: All server instances (regardless of client choice) read from and write to the same `papers/` directory, ensuring data persistence across different sessions.

## Available Tools

Both interfaces provide access to the same tools:

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

## Shared Data Access
While each run creates a new server instance, all servers share the same filesystem storage:
```
papers/
├── topic_1/
│   └── papers_info.json
├── topic_2/
│   └── papers_info.json
└── ...
```
This means:
- Papers saved by the inspector can be accessed by the chatbot
- Papers found through the chatbot can be viewed in the inspector
- Data persists between different server instances

## License

MIT
