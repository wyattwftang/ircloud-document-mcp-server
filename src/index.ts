#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ircloudKnowledge, systemPrompt, VERSION } from "./service.js";

// 创建MCP服务器
const createServer = () => {
  const server = new McpServer({
    name: "ircloud-document-mcp-server",
    version: VERSION,
  });

  // 1. 资源 (Resource) - 提供知识库内容
  server.registerResource(
    "ircloud",
    "ircloud://knowledge-base",
    {
      title: "铱云知识库",
      description: "铱云产品使用知识库",
      mimeType: "text/markdown",
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            text: ircloudKnowledge,
          },
        ],
      };
    }
  );

  // 2. 提示词 (Prompt) - 生成问题模板
  server.registerPrompt(
    "ask-question",
    {
      title: "智能问答",
      description: "根据知识库回答用户问题",
      argsSchema: {
        question: z.string().describe("用户问题"),
        context: z.string().optional().describe("问题上下文"),
      },
    },
    ({ question, context }) => ({
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: systemPrompt,
          },
        },
        {
          role: "user",
          content: {
            type: "text",
            text: `问题：${question}${
              context ? `\n上下文：${context}` : ""
            }\n\n请根据铱云知识库回答这个问题。`,
          },
        },
      ],
    })
  );

  // 3. 注册工具 (Tool) - 搜索答案
  server.registerTool(
    "search-answer",
    {
      title: "知识搜索回答",
      description: "搜索知识库并生成答案",
      inputSchema: {
        question: z.string().describe("用户问题"),
      },
    },
    async ({ question }) => {
      return {
        content: [
          {
            type: "text",
            text: `${systemPrompt}\n\n铱云知识库:\n${ircloudKnowledge}\n\n用户问题: ${question}。请根据知识库回答用户问题。`,
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
