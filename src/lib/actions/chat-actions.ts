"use server";

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/session';
import type { ConversationView, Message } from '@/types/chat';
import type { Profile } from '@/contexts/AuthContext';

type ActionResult<T> = { data: T | null; error: { message: string } | null };

const nowIso = () => new Date().toISOString();

function mapProfile(profile: any) {
  if (!profile) return null;
  const isOnline = profile.last_seen ? new Date(profile.last_seen).getTime() > Date.now() - 60000 : false;
  return {
    id: String(profile._id),
    full_name: profile.full_name,
    business_name: profile.business_name,
    role: profile.role,
    email: profile.email,
    last_seen: profile.last_seen,
    is_online: isOnline,
  } as Pick<Profile, 'id' | 'full_name' | 'business_name' | 'role' | 'email' | 'last_seen' | 'is_online'>;
}

async function requireSessionUser() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error('You must be signed in to use chat.');
  }
  return sessionUser;
}

function buildConversationView(
  conversation: any,
  otherParticipant: Pick<Profile, 'id' | 'full_name' | 'business_name' | 'role' | 'email'>,
  unreadCount: number
): ConversationView {
  return {
    id: String(conversation._id),
    participant1_id: conversation.participant1_id,
    participant2_id: conversation.participant2_id,
    last_message_content: conversation.last_message_content ?? null,
    last_message_at: conversation.last_message_at,
    created_at: conversation.created_at,
    otherParticipant,
    unread_count: unreadCount,
  };
}

export async function getOrCreateConversationAction(targetUserId: string): Promise<ActionResult<ConversationView>> {
  try {
    const sessionUser = await requireSessionUser();
    if (!targetUserId || targetUserId === sessionUser.id) {
      return { data: null, error: { message: 'Invalid chat recipient.' } };
    }

    const db = await getDb();
    const conversation = await db.collection<any>('conversations').findOne({
      $or: [
        { participant1_id: sessionUser.id, participant2_id: targetUserId },
        { participant1_id: targetUserId, participant2_id: sessionUser.id },
      ],
    });

    let activeConversation = conversation;
    if (!activeConversation) {
      const createdAt = nowIso();
      const id = randomUUID();
      const payload = {
        _id: id,
        participant1_id: sessionUser.id,
        participant2_id: targetUserId,
        created_at: createdAt,
        last_message_at: createdAt,
        last_message_content: null,
      };
      await db.collection<any>('conversations').insertOne(payload);
      activeConversation = payload;
      revalidatePath('/', 'layout');
    }

    const otherProfile = await db.collection<any>('profiles').findOne({ _id: targetUserId });
    if (!otherProfile) {
      return { data: null, error: { message: 'Chat recipient not found.' } };
    }

    return { data: buildConversationView(activeConversation, mapProfile(otherProfile)!, 0), error: null };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : 'Failed to start chat.' } };
  }
}

export async function listUserConversationsAction(): Promise<ActionResult<ConversationView[]>> {
  try {
    const sessionUser = await requireSessionUser();
    const db = await getDb();

    const conversations = await db
      .collection<any>('conversations')
      .find({ $or: [{ participant1_id: sessionUser.id }, { participant2_id: sessionUser.id }] })
      .sort({ last_message_at: -1 })
      .toArray();

    if (conversations.length === 0) {
      return { data: [], error: null };
    }

    const otherIds = conversations.map((conv) =>
      conv.participant1_id === sessionUser.id ? conv.participant2_id : conv.participant1_id
    );

    const profiles = await db.collection<any>('profiles').find({ _id: { $in: otherIds } }).toArray();
    const profileMap = new Map(profiles.map((profile) => [String(profile._id), mapProfile(profile)!]));

    const unreadMessages = await db
      .collection<any>('messages')
      .find({ receiver_id: sessionUser.id, is_read: false, conversation_id: { $in: conversations.map((c) => c._id) } })
      .toArray();

    const unreadCountMap = unreadMessages.reduce<Record<string, number>>((acc, msg) => {
      acc[String(msg.conversation_id)] = (acc[String(msg.conversation_id)] || 0) + 1;
      return acc;
    }, {});

    const mapped = conversations
      .map((conversation) => {
        const otherId =
          conversation.participant1_id === sessionUser.id ? conversation.participant2_id : conversation.participant1_id;
        const otherProfile = profileMap.get(String(otherId));
        if (!otherProfile) return null;
        return buildConversationView(conversation, otherProfile, unreadCountMap[String(conversation._id)] || 0);
      })
      .filter(Boolean) as ConversationView[];

    return { data: mapped, error: null };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : 'Failed to load chats.' } };
  }
}

export async function getMessagesForConversationAction(conversationId: string): Promise<ActionResult<Message[]>> {
  try {
    const sessionUser = await requireSessionUser();
    const db = await getDb();
    const conversation = await db.collection<any>('conversations').findOne({ _id: conversationId });

    if (!conversation) {
      return { data: null, error: { message: 'Conversation not found.' } };
    }

    if (![conversation.participant1_id, conversation.participant2_id].includes(sessionUser.id)) {
      return { data: null, error: { message: 'You do not have access to this conversation.' } };
    }

    const messages = await db
      .collection<any>('messages')
      .find({ conversation_id: conversationId })
      .sort({ created_at: 1 })
      .limit(200)
      .toArray();

    const senderIds = [...new Set(messages.map((msg) => msg.sender_id))];
    const profiles = await db.collection<any>('profiles').find({ _id: { $in: senderIds } }).toArray();
    const profileMap = new Map(profiles.map((profile) => [String(profile._id), mapProfile(profile)!]));

    const mapped = messages.map((msg) => ({
      id: String(msg._id),
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      receiver_id: msg.receiver_id,
      content: msg.content,
      image_url: msg.image_url,
      message_type: msg.message_type || 'text',
      created_at: msg.created_at,
      is_read: Boolean(msg.is_read),
      sender: profileMap.get(String(msg.sender_id)),
    })) as Message[];

    return { data: mapped, error: null };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : 'Failed to load messages.' } };
  }
}

export async function sendMessageAction(
  conversationId: string,
  content: string,
  messageType: 'text' | 'image' = 'text'
): Promise<ActionResult<Message>> {
  try {
    const sessionUser = await requireSessionUser();
    const db = await getDb();
    const conversation = await db.collection<any>('conversations').findOne({ _id: conversationId });

    if (!conversation) {
      return { data: null, error: { message: 'Conversation not found.' } };
    }

    if (![conversation.participant1_id, conversation.participant2_id].includes(sessionUser.id)) {
      return { data: null, error: { message: 'You do not have access to this conversation.' } };
    }

    const receiverId =
      conversation.participant1_id === sessionUser.id ? conversation.participant2_id : conversation.participant1_id;
    const createdAt = nowIso();

    const messageDoc = {
      _id: randomUUID(),
      conversation_id: conversationId,
      sender_id: sessionUser.id,
      receiver_id: receiverId,
      content,
      message_type: messageType,
      created_at: createdAt,
      is_read: false,
    };

    await db.collection<any>('messages').insertOne(messageDoc);
    await db.collection<any>('conversations').updateOne(
      { _id: conversationId },
      { $set: { last_message_at: createdAt, last_message_content: content } }
    );
    
    revalidatePath('/', 'layout');

    return {
      data: {
        id: String(messageDoc._id),
        conversation_id: conversationId,
        sender_id: sessionUser.id,
        receiver_id: receiverId,
        content,
        message_type: messageType,
        created_at: createdAt,
        is_read: false,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : 'Failed to send message.' } };
  }
}

export async function markMessagesAsReadAction(conversationId: string): Promise<ActionResult<boolean>> {
  try {
    const sessionUser = await requireSessionUser();
    const db = await getDb();

    await db
      .collection<any>('messages')
      .updateMany({ conversation_id: conversationId, receiver_id: sessionUser.id, is_read: false }, { $set: { is_read: true } });

    return { data: true, error: null };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : 'Failed to mark messages as read.' } };
  }
}

export async function updateLastSeenAction(): Promise<void> {
  try {
    const sessionUser = await requireSessionUser();
    const db = await getDb();
    await db.collection<any>('profiles').updateOne({ _id: sessionUser.id }, { $set: { last_seen: nowIso() } });
  } catch (error) {
    // Silently fail, it's just a presence update
  }
}
