import { WebSocket } from "ws";

export interface ChatMessage {
  type: "join_room" | "leave_room" | "send_msg";
  username: string;
  room?: string;
  content?: string;
}

export interface ChatClient extends WebSocket {
  currentRoom?: string;
  username?: string;
}

export interface ChatRoom {
  name: string;
  users: Map<string, ChatClient>;
}
