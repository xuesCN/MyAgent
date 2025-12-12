import { ChatSession } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'ai_chat_sessions',
  SETTINGS: 'ai_chat_settings'
};

class StorageService {
  // 获取所有会话
  async getSessions(): Promise<ChatSession[]> {
    try {
      console.log('Checking localStorage for sessions...');
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      console.log('Raw localStorage data:', data);
      if (!data) return [];
      
      const sessions = JSON.parse(data);
      console.log('Parsed sessions:', sessions);
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((message: any) => ({
          ...message,
          timestamp: new Date(message.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Failed to get sessions from storage:', error);
      return [];
    }
  }

  // 保存会话
  async saveSessions(sessions: ChatSession[]): Promise<void> {
    try {
      console.log('Attempting to save sessions:', sessions);
      const stringifiedData = JSON.stringify(sessions);
      console.log('Stringified sessions:', stringifiedData);
      localStorage.setItem(STORAGE_KEYS.SESSIONS, stringifiedData);
      console.log('Sessions saved to localStorage');
      // 验证保存是否成功
      const storedData = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      console.log('Verified stored data:', storedData);
    } catch (error) {
      console.error('Failed to save sessions to storage:', error);
      throw new Error('保存会话失败');
    }
  }

  // 获取设置
  async getSettings(): Promise<any> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get settings from storage:', error);
      return null;
    }
  }

  // 保存设置
  async saveSettings(settings: any): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to storage:', error);
      throw new Error('保存设置失败');
    }
  }

  // 清除所有数据
  async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSIONS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw new Error('清除数据失败');
    }
  }

  // 导出数据
  async exportData(): Promise<string> {
    try {
      const sessions = await this.getSessions();
      const settings = await this.getSettings();
      
      const exportData = {
        sessions,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('导出数据失败');
    }
  }

  // 导入数据
  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.sessions) {
        await this.saveSessions(data.sessions);
      }
      
      if (data.settings) {
        await this.saveSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('导入数据失败');
    }
  }
}

export const storageService = new StorageService();