import { prisma } from "@/lib/prisma";
import { presenceManager } from "@/lib/presence/presence-manager";
import { MessageType, MessageStatusType } from "@prisma/client";

export interface SendMessageInput {
  conversationId: string;
  content?: string;
  type?: MessageType;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToId?: string;
}

export class MessageService {
  /**
   * 1. Get or create a 1-1 Conversation between currentUserId and targetUserId
   */
  static async getOrCreate1v1Conversation(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new Error("Cannot create a conversation with yourself");
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, username: true, avatar: true },
    });

    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Search for existing 1-1 conversation containing both participants
    const existingConv = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true, lastSeen: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (existingConv) {
      return existingConv;
    }

    // Create new 1-1 conversation with participants
    const newConv = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { userId: currentUserId, role: "ADMIN" },
            { userId: targetUserId, role: "MEMBER" },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true, lastSeen: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return newConv;
  }

  /**
   * 2. List all conversations of current user with latest message + unread count
   */
  static async getUserConversations(currentUserId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: currentUserId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar: true, lastSeen: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            statuses: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const partnerParticipant =
          conv.participants.find((p) => p.userId !== currentUserId) || conv.participants[0];
        const partner = partnerParticipant?.user;

        // Calculate unread count for current user
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: currentUserId },
            statuses: {
              none: {
                userId: currentUserId,
                status: MessageStatusType.READ,
              },
            },
          },
        });

        const lastMsg = conv.messages[0];
        const presence = partner ? presenceManager.getPresence(partner.id) : null;

        return {
          id: conv.id,
          isGroup: conv.isGroup,
          name: conv.isGroup ? conv.name : partner?.name || partner?.username || "Direct Message",
          avatar: conv.isGroup
            ? conv.avatar
            : partner?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(partner?.name || "User")}`,
          partner: partner
            ? {
                id: partner.id,
                name: partner.name,
                username: partner.username,
                avatar: partner.avatar,
                isOnline: presence?.isOnline ?? false,
                lastSeen: presence?.lastSeen ?? partner.lastSeen,
                isTyping: presence?.typingConversationId === conv.id,
              }
            : null,
          unreadCount,
          lastMessage: lastMsg
            ? {
                id: lastMsg.id,
                senderId: lastMsg.senderId,
                content: lastMsg.content,
                type: lastMsg.type,
                mediaUrl: lastMsg.mediaUrl,
                createdAt: lastMsg.createdAt,
              }
            : null,
          updatedAt: conv.updatedAt,
        };
      })
    );

    return formattedConversations;
  }

  /**
   * 3. Get messages of a conversation (paginated with cursor)
   */
  static async getConversationMessages(
    conversationId: string,
    currentUserId: string,
    cursor?: string,
    limit = 30
  ) {
    // Verify participation
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: currentUserId,
        },
      },
    });

    if (!participant) {
      throw new Error("Unauthorized access to conversation");
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        replyTo: {
          include: {
            sender: { select: { id: true, name: true, username: true } },
          },
        },
        statuses: true,
      },
    });

    let nextCursor: string | undefined = undefined;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id;
    }

    const formattedMessages = messages.reverse().map((msg) => {
      const isMe = msg.senderId === currentUserId;
      const readStatus = msg.statuses.find((s) => s.userId !== currentUserId);

      let status: MessageStatusType = MessageStatusType.SENT;
      if (readStatus) {
        status = readStatus.status;
      }

      return {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        sender: msg.sender,
        content: msg.content,
        type: msg.type,
        mediaUrl: msg.mediaUrl,
        fileName: msg.fileName,
        fileSize: msg.fileSize,
        replyTo: msg.replyTo
          ? {
              id: msg.replyTo.id,
              content: msg.replyTo.content,
              senderName: msg.replyTo.sender.name || msg.replyTo.sender.username,
            }
          : null,
        status,
        isMe,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      };
    });

    return {
      messages: formattedMessages,
      nextCursor,
    };
  }

  /**
   * 4. Send new Message (TEXT, IMAGE, VIDEO, AUDIO, FILE) & Real-time SSE Dispatch
   */
  static async sendMessage(senderId: string, input: SendMessageInput) {
    const { conversationId, content, type, mediaUrl, fileName, fileSize, replyToId } = input;

    if (!content?.trim() && !mediaUrl) {
      throw new Error("Message must contain text content or media");
    }

    // Verify participation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: { userId: true },
        },
      },
    });

    if (!conversation || !conversation.participants.some((p) => p.userId === senderId)) {
      throw new Error("Conversation not found or unauthorized");
    }

    // Infer message type if not provided
    let messageType = type || MessageType.TEXT;
    if (!type && mediaUrl) {
      const url = mediaUrl.toLowerCase();
      if (url.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/) || url.startsWith("data:image")) {
        messageType = MessageType.IMAGE;
      } else if (url.match(/\.(mp4|webm|ogg|mov)($|\?)/) || url.startsWith("data:video")) {
        messageType = MessageType.VIDEO;
      } else if (url.match(/\.(mp3|wav|ogg|m4a|webm)($|\?)/) || url.startsWith("data:audio")) {
        messageType = MessageType.AUDIO;
      } else {
        messageType = MessageType.FILE;
      }
    }

    // 1. Create message in DB
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: content?.trim() || null,
        type: messageType,
        mediaUrl: mediaUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        replyToId: replyToId || null,
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        replyTo: {
          include: {
            sender: { select: { id: true, name: true, username: true } },
          },
        },
      },
    });

    // 2. Update Conversation lastMessageId and updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageId: message.id,
        updatedAt: new Date(),
      },
    });

    // 3. Create initial MessageStatus (SENT or DELIVERED if recipient online) for recipients
    const recipients = conversation.participants.filter((p) => p.userId !== senderId);

    const statusPromises = recipients.map(async (r) => {
      const isOnline = presenceManager.getPresence(r.userId).isOnline;
      const initialStatus = isOnline ? MessageStatusType.DELIVERED : MessageStatusType.SENT;

      await prisma.messageStatus.create({
        data: {
          messageId: message.id,
          userId: r.userId,
          status: initialStatus,
        },
      });

      // 4. Real-time delivery via SSE to recipient
      presenceManager.sendToUser(r.userId, {
        type: "message_new",
        payload: {
          message: {
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            sender: message.sender,
            content: message.content,
            type: message.type,
            mediaUrl: message.mediaUrl,
            fileName: message.fileName,
            fileSize: message.fileSize,
            replyTo: message.replyTo
              ? {
                  id: message.replyTo.id,
                  content: message.replyTo.content,
                  senderName: message.replyTo.sender.name || message.replyTo.sender.username,
                }
              : null,
            status: initialStatus,
            createdAt: message.createdAt,
          },
        },
      });
    });

    await Promise.all(statusPromises);

    return message;
  }

  /**
   * 5. Mark all unread messages as READ when receiver opens chat & Notify sender via SSE
   */
  static async markMessagesAsRead(currentUserId: string, conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: { select: { userId: true } },
      },
    });

    if (!conversation || !conversation.participants.some((p) => p.userId === currentUserId)) {
      throw new Error("Unauthorized access to conversation");
    }

    // Find all unread messages sent by other participants
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: currentUserId },
        statuses: {
          none: {
            userId: currentUserId,
            status: MessageStatusType.READ,
          },
        },
      },
      select: { id: true, senderId: true },
    });

    if (unreadMessages.length === 0) {
      return { count: 0 };
    }

    const now = new Date();

    // Upsert status as READ for receiver
    await Promise.all([
      ...unreadMessages.map((m) =>
        prisma.messageStatus.upsert({
          where: {
            messageId_userId: {
              messageId: m.id,
              userId: currentUserId,
            },
          },
          create: {
            messageId: m.id,
            userId: currentUserId,
            status: MessageStatusType.READ,
          },
          update: {
            status: MessageStatusType.READ,
            updatedAt: now,
          },
        })
      ),
      prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId: currentUserId,
          },
        },
        data: {
          lastReadAt: now,
        },
      }),
    ]);

    // Group message IDs by sender and dispatch SSE read receipts to original senders
    const senderIds = new Set(unreadMessages.map((m) => m.senderId));
    senderIds.forEach((senderId) => {
      const readMsgIds = unreadMessages
        .filter((m) => m.senderId === senderId)
        .map((m) => m.id);

      presenceManager.sendToUser(senderId, {
        type: "presence_update", // Triggers real-time checkmark update
        payload: {
          event: "message_read",
          conversationId,
          readerId: currentUserId,
          messageIds: readMsgIds,
          readAt: now.toISOString(),
        },
      });
    });

    return { count: unreadMessages.length };
  }

  /**
   * 6. Edit message content (Allowed ONLY within 15 minutes of creation)
   */
  static async editMessage(currentUserId: string, messageId: string, newContent: string) {
    if (!newContent || !newContent.trim()) {
      throw new Error("Message content cannot be empty");
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: { select: { userId: true } },
          },
        },
      },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== currentUserId) {
      throw new Error("You can only edit your own messages");
    }

    // 15-minute edit window verification
    const EDIT_WINDOW_MS = 15 * 60 * 1000;
    const elapsed = Date.now() - new Date(message.createdAt).getTime();

    if (elapsed > EDIT_WINDOW_MS) {
      throw new Error("Messages can only be edited within 15 minutes of sending");
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: newContent.trim(),
        updatedAt: new Date(),
      },
    });

    // Notify participants over SSE
    message.conversation.participants.forEach((p) => {
      presenceManager.sendToUser(p.userId, {
        type: "message_new",
        payload: {
          event: "message_edited",
          messageId,
          conversationId: message.conversationId,
          newContent: updatedMessage.content,
          updatedAt: updatedMessage.updatedAt.toISOString(),
        },
      });
    });

    return updatedMessage;
  }

  /**
   * 7. Delete message (mode: "everyone" or "me")
   */
  static async deleteMessage(
    currentUserId: string,
    messageId: string,
    mode: "everyone" | "me" = "everyone"
  ) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: { select: { userId: true } },
          },
        },
      },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    if (mode === "everyone") {
      if (message.senderId !== currentUserId) {
        throw new Error("You can only delete your own messages for everyone");
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: {
          content: "This message was deleted",
          mediaUrl: null,
          fileName: null,
          fileSize: null,
          type: MessageType.SYSTEM,
        },
      });

      // Broadcast real-time deletion over SSE
      message.conversation.participants.forEach((p) => {
        presenceManager.sendToUser(p.userId, {
          type: "message_new",
          payload: {
            event: "message_deleted",
            messageId,
            conversationId: message.conversationId,
            mode: "everyone",
          },
        });
      });

      return updated;
    } else {
      // Delete for me
      await prisma.messageStatus.deleteMany({
        where: {
          messageId,
          userId: currentUserId,
        },
      });

      return { success: true, messageId, mode: "me" };
    }
  }
}
