---
title: Strands Agent Best Practices
inclusion: always
---

# Strands Agent Best Practices

## Overview
Strands is a framework for building AI agents with structured workflows, state management, and tool integration. Follow these practices for robust agent development.

## Project Structure
- Agent definitions in `src/agents/` directory
- Tool implementations in `src/tools/` directory
- Workflow definitions in `src/workflows/` directory
- State schemas in `src/schemas/` directory
- Use TypeScript for type safety and better IDE support

## Agent Design
- Keep agents focused on single responsibilities
- Define clear input/output schemas using Zod or similar
- Use descriptive agent names that reflect their purpose
- Document agent capabilities and limitations
- Implement proper error handling and fallback strategies

## State Management
- Define explicit state schemas for each agent
- Use immutable state updates
- Validate state transitions
- Persist critical state for recovery
- Keep state minimal and focused

## Tool Integration
- Create reusable, composable tools
- Define clear tool interfaces with input/output types
- Implement proper error handling in tools
- Use tool descriptions that help the agent understand when to use them
- Mock external dependencies in tests

## Workflow Patterns
- Use sequential workflows for dependent tasks
- Use parallel workflows for independent tasks
- Implement retry logic with exponential backoff
- Set appropriate timeouts for long-running operations
- Use checkpoints for complex multi-step workflows

## Prompt Engineering
- Use clear, specific system prompts
- Provide examples in prompts when helpful
- Structure prompts with clear sections (context, task, constraints)
- Use few-shot examples for complex reasoning tasks
- Test prompts with various inputs

## Error Handling
- Implement graceful degradation
- Provide meaningful error messages
- Log errors with sufficient context
- Use circuit breakers for external services
- Implement retry strategies with limits

## Testing
- Write unit tests for individual tools
- Test agent workflows end-to-end
- Mock LLM responses for deterministic tests
- Test error scenarios and edge cases
- Use snapshot tests for prompt templates

## Performance
- Cache expensive operations
- Use streaming for long responses
- Implement request batching where possible
- Monitor token usage and costs
- Set appropriate rate limits

## Security
- Validate all inputs before processing
- Sanitize outputs before returning to users
- Use environment variables for API keys
- Implement proper authentication/authorization
- Audit tool permissions and capabilities

## Observability
- Log agent decisions and reasoning
- Track workflow execution metrics
- Monitor token usage and costs
- Implement distributed tracing for complex workflows
- Use structured logging for better analysis

## Configuration
- Use environment-specific configurations
- Externalize model parameters (temperature, max_tokens)
- Version control prompt templates
- Document configuration options
- Use type-safe configuration schemas

## Best Practices
- Start with simple agents and iterate
- Test agents with real-world scenarios
- Monitor agent behavior in production
- Collect user feedback for improvement
- Version agents and workflows
- Document agent capabilities and limitations
- Use semantic versioning for agent releases

## Common Patterns
```typescript
// Agent with structured output
const agent = new Agent({
  name: "data-analyzer",
  systemPrompt: "You analyze data and provide insights...",
  tools: [queryDatabase, generateChart],
  outputSchema: z.object({
    insights: z.array(z.string()),
    recommendations: z.array(z.string())
  })
});

// Workflow with error handling
const workflow = new Workflow({
  steps: [
    { agent: dataCollector, retry: 3 },
    { agent: dataAnalyzer, timeout: 30000 },
    { agent: reportGenerator, fallback: simpleReport }
  ]
});

// Tool with validation
const queryTool = {
  name: "query_database",
  description: "Query the database with SQL",
  inputSchema: z.object({
    query: z.string(),
    params: z.array(z.any()).optional()
  }),
  execute: async (input) => {
    // Validate and sanitize query
    // Execute with proper error handling
    // Return structured results
  }
};
```

## Debugging
- Use verbose logging during development
- Inspect agent reasoning steps
- Test tools independently
- Use breakpoints in tool execution
- Monitor state transitions
- Review LLM token usage and costs

## Deployment
- Use environment variables for configuration
- Implement health checks
- Set up monitoring and alerting
- Use blue-green deployments for updates
- Document deployment procedures
- Implement rollback strategies
