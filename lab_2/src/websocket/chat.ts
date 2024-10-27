import { WebSocket, WebSocketServer } from "ws";
import { ChatRoom, ChatMessage } from "./types";

export class ChatServer {
  private wss: WebSocketServer;
  private rooms: Map<string, ChatRoom> = new Map();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.initialize();
  }

  private initialize() {
    this.wss.on("connection", (ws: WebSocket) => {
      console.log("New client connected");

      ws.on("message", (data: string) => {
        try {
          const message: ChatMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("Error parsing message:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              content: "Invalid message format",
            })
          );
        }
      });

      ws.on("close", () => {
        this.handleDisconnect(ws);
      });
    });

    console.log("WebSocket server is running");
  }

  private handleMessage(ws: WebSocket, message: ChatMessage) {
    switch (message.type) {
      case "join_room":
        this.handleJoinRoom(ws, message);
        break;
      case "leave_room":
        this.handleLeaveRoom(ws, message);
        break;
      case "send_msg":
        this.handleSendMessage(ws, message);
        break;
      default:
        ws.send(
          JSON.stringify({
            type: "error",
            content: "Unknown message type",
          })
        );
    }
  }

  private handleJoinRoom(ws: WebSocket, message: ChatMessage) {
    if (!message.room) {
      ws.send(
        JSON.stringify({
          type: "error",
          content: "Room name is required",
        })
      );
      return;
    }

    if (!this.rooms.has(message.room)) {
      this.rooms.set(message.room, {
        name: message.room,
        users: new Map(),
      });
    }

    const room = this.rooms.get(message.room)!;
    room.users.set(message.username, ws);

    (ws as any).currentRoom = message.room;
    (ws as any).username = message.username;

    this.broadcastToRoom(room, {
      type: "system",
      content: `${message.username} has joined the room`,
      username: "System",
    });

    ws.send(
      JSON.stringify({
        type: "system",
        content: `You have joined room: ${message.room}`,
        username: "System",
      })
    );
  }

  private handleLeaveRoom(ws: WebSocket, message: ChatMessage) {
    const room = this.rooms.get((ws as any).currentRoom);
    if (room) {
      room.users.delete((ws as any).username);

      this.broadcastToRoom(room, {
        type: "system",
        content: `${message.username} has left the room`,
        username: "System",
      });

      if (room.users.size === 0) {
        this.rooms.delete(room.name);
      }
    }

    delete (ws as any).currentRoom;
    delete (ws as any).username;
  }

  private handleSendMessage(ws: WebSocket, message: ChatMessage) {
    const room = this.rooms.get((ws as any).currentRoom);
    if (!room) {
      ws.send(
        JSON.stringify({
          type: "error",
          content: "You are not in any room",
        })
      );
      return;
    }

    this.broadcastToRoom(room, {
      type: "message",
      content: message.content,
      username: message.username,
    });
  }

  private handleDisconnect(ws: WebSocket) {
    const room = this.rooms.get((ws as any).currentRoom);
    if (room) {
      room.users.delete((ws as any).username);

      this.broadcastToRoom(room, {
        type: "system",
        content: `${(ws as any).username} has disconnected`,
        username: "System",
      });

      if (room.users.size === 0) {
        this.rooms.delete(room.name);
      }
    }
  }

  private broadcastToRoom(room: ChatRoom, message: any) {
    const messageStr = JSON.stringify(message);
    room.users.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}
