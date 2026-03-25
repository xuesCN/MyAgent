import {
  executeAgentStream,
  executeAgentStateSync,
  AgentExecutionOptions,
  AgentState,
} from "./agentService";
import { Message } from "../../types";

/**
 * Agent runtime facade.
 * 对外只暴露主入口：executeAgentStream / executeAgentStateSync。
 */
export const agentRuntimeFacade = {
  stream(
    messages: Message[],
    options: AgentExecutionOptions = {}
  ): AsyncGenerator<string, AgentState, unknown> {
    return executeAgentStream(messages, options);
  },

  run(
    messages: Message[],
    options: AgentExecutionOptions = {}
  ): Promise<AgentState> {
    return executeAgentStateSync(messages, options);
  },
};

