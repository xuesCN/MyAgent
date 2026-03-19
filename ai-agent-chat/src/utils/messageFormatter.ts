import { ChatSession, MessageContentItem } from '../types';

/**
 * 从会话的第一条消息提取标题
 * 支持文本和多模态消息
 */
export function extractSessionTitle(session: ChatSession): string {
  if (session.messages.length === 0) return session.title;

  const firstMessage = session.messages[0];

  if (Array.isArray(firstMessage.content)) {
    // 处理多模态消息内容
    const isTextItem = (item: any): item is { type: "text"; text: string } =>
      item.type === "text" && "text" in item;

    const textItem = (firstMessage.content as MessageContentItem[]).find(
      isTextItem,
    );

    if (textItem) {
      const firstSentence = textItem.text.split("。")[0];
      const hasPeriod = textItem.text.includes("。");
      return firstSentence + (hasPeriod ? "。" : "");
    }

    // 如果只有图片，返回默认文本
    return "[图片消息]";
  } else {
    // 处理纯文本消息
    const firstSentence = (firstMessage.content as string).split("。")[0];
    const hasPeriod = (firstMessage.content as string).includes("。");
    return firstSentence + (hasPeriod ? "。" : "");
  }
}

/**
 * 格式化会话更新时间
 * 显示"今天"、"昨天"、"X天前"或具体日期
 */
export function formatSessionDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return "今天";
  } else if (days === 1) {
    return "昨天";
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "short",
      day: "numeric",
    }).format(date);
  }
}

/**
 * 格式化消息时间戳
 * 显示为 HH:mm 格式
 */
export function formatMessageTime(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * 判断消息内容是否为纯文本
 */
export function isTextMessageContent(
  content: string | MessageContentItem[],
): boolean {
  return typeof content === "string";
}

/**
 * 从多模态消息内容中提取纯文本部分
 */
export function extractTextContent(
  content: string | MessageContentItem[],
): string {
  if (typeof content === "string") {
    return content;
  }

  const textItems = (content as MessageContentItem[]).filter(
    (item): item is { type: "text"; text: string } => item.type === "text",
  );

  return textItems.map((item) => item.text).join("\n");
}
