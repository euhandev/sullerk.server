export const SocketEvents = {
  // Input Events (Subscribe)
  AUTHENTICATE: 'authenticate',
  DIRECT_MESSAGE: 'directMessage',
  TYPING: 'typing',
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  MESSAGE: 'message',
  EDIT_MESSAGE: 'editMessage',
  DELETE_MESSAGE: 'deleteMessage',
  FETCH_CHATS: 'fetchChats',
  MESSAGE_LIST: 'messageList',
  MARK_READ: 'markRead',

  // Output Events (Emit)
  STATUS: 'status',
  ERROR: 'error',
  NOTIFICATION_NEW: 'notification:new',
  JOINED_ROOM: 'joinedRoom',
  USER_JOINED: 'room:userJoined',
  LEFT_ROOM: 'leftRoom',
  USER_LEFT: 'room:userLeft',
  MESSAGE_LIST_UPDATE: 'messageList:update',
};
