/**
 * @deprecated 历史兼容层。
 * 实际实现统一在 agentService.ts，请新代码直接从 agentService 导入。
 */
export {
  executeAgentGraphStream,
  executeAgentGraphSync,
  executeAgentStateStream,
  executeAgentStateSync,
} from "./agentService";
