import type { ChatRequest, ChatResponse, LLMProvider } from "./types.js";

/**
 * Mock LLM 提供商
 *
 * Week 1 占位实现，用于无 API Key 环境下的开发与测试。
 * 返回预设响应，不消耗 tokens。
 */
export class MockProvider implements LLMProvider {
  readonly name = "mock";

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    const lastUserMsg = [...request.messages]
      .reverse()
      .find((m) => m.role === "user");

    const content = this.generateMockResponse(lastUserMsg?.content ?? "");

    return {
      content,
      inputTokens: 0,
      outputTokens: 0,
      model: "mock-v1",
      durationMs: Date.now() - startTime,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  /**
   * 根据用户输入生成简单的 mock 响应
   */
  private generateMockResponse(userInput: string): string {
    return `[Mock LLM 响应]

收到输入："${userInput.slice(0, 100)}"

这是 Week 1 占位响应，用于开发期测试。
接入真实 Claude API 请在 .env 中配置 ANTHROPIC_API_KEY。

实际生产环境将返回：
- 意图识别 Agent：返回产品类型 + 置信度
- 配置填充 Agent：返回填充后的代码包
- 修复 Agent：返回修复后的代码
`;
  }
}
