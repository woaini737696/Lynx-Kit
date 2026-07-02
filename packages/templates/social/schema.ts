import { pgTable, text, timestamp, integer, boolean, jsonb, vector } from 'drizzle-orm/pg-core';

// 用户表
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  phone: text('phone').unique(),
  nickname: text('nickname'),
  avatar: text('avatar'),
  gender: text('gender'), // male/female/other
  birthday: timestamp('birthday'),
  bio: text('bio'),
  interests: text('interests').array(), // 兴趣标签
  embedding: vector('embedding', { dimensions: 1536 }), // 兴趣向量
  createdAt: timestamp('created_at').defaultNow(),
});

// 匹配记录
export const matches = pgTable('matches', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  targetUserId: text('target_user_id'),
  score: integer('score'), // 匹配分数 0-100
  status: text('status'), // pending/accepted/rejected
  createdAt: timestamp('created_at').defaultNow(),
});

// 聊天会话
export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  userId1: text('user_id_1'),
  userId2: text('user_id_2'),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 消息
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id'),
  senderId: text('sender_id'),
  content: text('content'),
  type: text('type'), // text/image/voice
  sentiment: text('sentiment'), // positive/neutral/negative
  aiGenerated: boolean('ai_generated').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// AI 破冰建议
export const icebreakers = pgTable('icebreakers', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id'),
  suggestion: text('suggestion'),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});
