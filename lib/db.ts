import { Conversation, Insight } from '@/types';

const DB_NAME = 'JinTianLiaoShaDB';
const DB_VERSION = 1;
const CONVERSATIONS_STORE = 'conversations';
const INSIGHTS_STORE = 'insights';

/**
 * 初始化 IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建对话表
      if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
        const conversationStore = db.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'id' });
        conversationStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 创建观点表
      if (!db.objectStoreNames.contains(INSIGHTS_STORE)) {
        const insightStore = db.createObjectStore(INSIGHTS_STORE, { keyPath: 'id' });
        insightStore.createIndex('conversationId', 'conversationId', { unique: false });
        insightStore.createIndex('category', 'category', { unique: false });
      }
    };
  });
}

/**
 * 保存对话
 */
export async function saveConversation(conversation: Conversation): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(CONVERSATIONS_STORE, 'readwrite');
  const store = tx.objectStore(CONVERSATIONS_STORE);

  // 将 Date 对象转换为 ISO 字符串
  const conversationToSave = {
    ...conversation,
    createdAt: conversation.createdAt.toISOString(),
    messages: conversation.messages.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString()
    }))
  };

  store.put(conversationToSave);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * 获取所有对话
 */
export async function getAllConversations(): Promise<Conversation[]> {
  const db = await openDB();
  const tx = db.transaction(CONVERSATIONS_STORE, 'readonly');
  const store = tx.objectStore(CONVERSATIONS_STORE);
  const index = store.index('createdAt');

  return new Promise((resolve, reject) => {
    const request = index.openCursor(null, 'prev'); // 倒序
    const conversations: Conversation[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        const data = cursor.value;
        // 将 ISO 字符串转换回 Date 对象
        conversations.push({
          ...data,
          createdAt: new Date(data.createdAt),
          messages: data.messages.map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt)
          }))
        });
        cursor.continue();
      } else {
        resolve(conversations);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * 获取单个对话
 */
export async function getConversation(id: string): Promise<Conversation | null> {
  const db = await openDB();
  const tx = db.transaction(CONVERSATIONS_STORE, 'readonly');
  const store = tx.objectStore(CONVERSATIONS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.get(id);

    request.onsuccess = () => {
      if (request.result) {
        const data = request.result;
        resolve({
          ...data,
          createdAt: new Date(data.createdAt),
          messages: data.messages.map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt)
          }))
        });
      } else {
        resolve(null);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * 删除对话
 */
export async function deleteConversation(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(CONVERSATIONS_STORE, 'readwrite');
  const store = tx.objectStore(CONVERSATIONS_STORE);

  store.delete(id);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * 保存观点
 */
export async function saveInsight(insight: Insight): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(INSIGHTS_STORE, 'readwrite');
  const store = tx.objectStore(INSIGHTS_STORE);

  const insightToSave = {
    ...insight,
    createdAt: insight.createdAt.toISOString()
  };

  store.put(insightToSave);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * 获取所有观点
 */
export async function getAllInsights(): Promise<Insight[]> {
  const db = await openDB();
  const tx = db.transaction(INSIGHTS_STORE, 'readonly');
  const store = tx.objectStore(INSIGHTS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      const insights = request.result.map((data: any) => ({
        ...data,
        createdAt: new Date(data.createdAt)
      }));
      resolve(insights);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * 根据对话ID获取观点
 */
export async function getInsightsByConversationId(conversationId: string): Promise<Insight[]> {
  const db = await openDB();
  const tx = db.transaction(INSIGHTS_STORE, 'readonly');
  const store = tx.objectStore(INSIGHTS_STORE);
  const index = store.index('conversationId');

  return new Promise((resolve, reject) => {
    const request = index.getAll(conversationId);

    request.onsuccess = () => {
      const insights = request.result.map((data: any) => ({
        ...data,
        createdAt: new Date(data.createdAt)
      }));
      resolve(insights);
    };

    request.onerror = () => reject(request.error);
  });
}
