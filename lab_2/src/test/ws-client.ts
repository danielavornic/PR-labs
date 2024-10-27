import WebSocket from "ws";

function createTestClient(username: string) {
  const ws = new WebSocket("ws://localhost:3001");

  ws.on("open", () => {
    console.log(`${username} connected`);

    ws.send(
      JSON.stringify({
        type: "join_room",
        room: "test-room",
        username: username,
      })
    );

    if (username === "User1") {
      setTimeout(() => {
        ws.send(
          JSON.stringify({
            type: "send_msg",
            content: "Hello everyone!",
            username: username,
          })
        );
      }, 1000);
    }
  });

  ws.on("message", (data) => {
    console.log(`${username} received:`, JSON.parse(data.toString()));
  });

  return ws;
}

const client1 = createTestClient("User1");
const client2 = createTestClient("User2");

setTimeout(() => {
  ["User1", "User2"].forEach((username) => {
    const ws = username === "User1" ? client1 : client2;
    ws.send(
      JSON.stringify({
        type: "leave_room",
        username,
      })
    );
    ws.close();
  });
}, 5000);
