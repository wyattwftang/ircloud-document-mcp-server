Ircloud Document MCP Server

这是铱云知识文档问答 MCP 服务器示例代码，使用node.js编写，通过stdio进行通信。

使用方式

npx：
{
  "mcpServers": {
    "ircloud-document-mcp-server": {
      "name": "ircloud-document-mcp-server",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "ircloud-document-mcp-server"]
    }
  }
}

