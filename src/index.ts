import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

// 创建MCP服务器
const createServer = () => {
  const server = new McpServer({
    name: "ircloud-document-mcp-server",
    version: "1.0.0",
  });

  // 1. 注册资源 (Resource)
  server.registerResource(
    "ircloud",
    "ircloud://system-prompt",
    {
      title: "系统提示词",
      description: "智能业务助手的核心提示词",
      mimeType: "text/plain",
    },
    async (uri) => {
      // 读取知识文档
      const docPath = path.resolve(process.cwd(), "ircloud-knowledge.txt");
      const content = await fs.readFile(docPath, "utf-8");

      return {
        contents: [
          {
            uri: uri.href,
            text: content,
          },
        ],
      };
    }
  );

  // 2. 注册提示词 (Prompt)
  server.registerPrompt(
    "document-qa",
    {
      title: "文档问答",
      description: "根据知识文档回答用户问题",
      argsSchema: { question: z.string() }, // 输入参数校验
    },
    ({ question }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `请根据知识文档回答以下问题：\n\n${question}`,
          },
        },
      ],
    })
  );

  // 3. 注册工具 (Tool)
  server.registerTool(
    "search-document",
    {
      title: "知识文档搜索",
      description: "在知识文档中搜索用户答案",
      inputSchema: {
        question: z.string().describe("用户的问题"),
      },
    },
    async ({ question }) => {
      // 读取系统提示词
      const promptPath = path.resolve(process.cwd(), "system-prompt.txt");
      // 读取知识文档
      const docPath = path.resolve(process.cwd(), "ircloud-knowledge.txt");
      const [systemPrompt, knowledge] = await Promise.all([
        fs.readFile(promptPath, "utf-8"),
        fs.readFile(docPath, "utf-8"),
      ]);

      return {
        content: [
          {
            type: "text",
            text: `${systemPrompt}\n\n铱云知识库:\n${knowledge}\n\n用户问题: ${question}。请根据知识库回答用户问题。`,
          },
        ],
      };
    }
  );

  return server;
};

/** 启动Stdio传输的服务器 */
async function startServer() {
  const server = createServer();
  const transport = new StdioServerTransport();

  try {
    console.error("铱云知识文档问答MCP服务器正在启动...");
    await server.connect(transport);
    console.error("✅ 服务器已就绪，等待客户端连接");
  } catch (error) {
    console.error("❌ 服务器启动失败:", error);
    process.exit(1);
  }
}

startServer();
