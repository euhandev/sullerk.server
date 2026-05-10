export const SocketEvents = {
  // Input Events (Subscribe)
  AUTHENTICATE: 'authenticate',
  DIRECT_MESSAGE: 'directMessage',
  TYPING: 'typing',
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  MESSAGE: 'message',
  FETCH_CHATS: 'fetchChats',
  MESSAGE_LIST: 'messageList',

  // Output Events (Emit)
  STATUS: 'status',
  ERROR: 'error',
  NOTIFICATION_NEW: 'notification:new',
  JOINED_ROOM: 'joinedRoom',
  USER_JOINED: 'room:userJoined',
  LEFT_ROOM: 'leftRoom',
  USER_LEFT: 'room:userLeft',
};
