import dgram from "dgram";

export interface ElectionMessage {
  type: "REQUEST_VOTE" | "VOTE_RESPONSE" | "APPEND_ENTRIES";
  term: number;
  serverId: string;
  votedFor?: string;
  timestamp: number;
}

export class LeaderElection {
  private socket: dgram.Socket;
  private currentTerm: number = 0;
  private votedFor: string | null = null;
  private votes: Set<string> = new Set();
  private isLeader: boolean = false;
  private lastHeartbeat: number = 0;
  private electionTimeout: number;
  private electionTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private peers: { id: string; port: number }[] = [];

  constructor(
    private port: number,
    private serverId: string,
    private onLeaderElected: (leaderId: string) => void
  ) {
    this.electionTimeout = 1500 + Math.floor(Math.random() * 1500); // 1.5-3s
    this.socket = dgram.createSocket("udp4");
    this.setupSocket();
  }

  private setupSocket() {
    this.socket.on("message", (msg, rinfo) => {
      const message: ElectionMessage = JSON.parse(msg.toString());
      this.handleMessage(message, rinfo.port);
    });

    this.socket.on("listening", () => {
      console.log(`UDP Server listening on port ${this.port}`);

      setTimeout(() => this.startElectionTimer(), Math.random() * 1000);
    });

    this.socket.bind(this.port, "0.0.0.0");
  }

  private startElectionTimer() {
    if (this.electionTimer) {
      clearTimeout(this.electionTimer);
    }

    this.electionTimer = setTimeout(() => {
      this.startElection();
    }, this.electionTimeout);
  }

  private startElection() {
    this.currentTerm++;
    this.votedFor = this.serverId;
    this.votes = new Set([this.serverId]); // for self
    this.isLeader = false;

    console.log(
      `Server ${this.serverId} starting election for term ${this.currentTerm}`
    );

    // Request votes from all
    this.peers.forEach((peer) => {
      this.send(
        {
          type: "REQUEST_VOTE",
          term: this.currentTerm,
          serverId: this.serverId,
          timestamp: Date.now(),
        },
        peer.port,
        peer.id
      );
    });

    this.startElectionTimer();
  }

  private handleMessage(message: ElectionMessage, senderPort: number) {
    // If a message with higher term, update our term
    if (message.term > this.currentTerm) {
      this.currentTerm = message.term;
      this.isLeader = false;
      this.votedFor = null;
      this.stopHeartbeat();
    }

    switch (message.type) {
      case "REQUEST_VOTE":
        this.handleVoteRequest(message, senderPort);
        break;

      case "VOTE_RESPONSE":
        this.handleVoteResponse(message);
        break;

      case "APPEND_ENTRIES":
        this.handleHeartbeat(message);
        break;
    }
  }

  private handleVoteRequest(message: ElectionMessage, senderPort: number) {
    // grant vote if our term is not higher
    // and we haven't voted for someone else
    if (
      message.term >= this.currentTerm &&
      (this.votedFor === null || this.votedFor === message.serverId)
    ) {
      this.currentTerm = message.term;
      this.votedFor = message.serverId;
      this.isLeader = false;

      this.send(
        {
          type: "VOTE_RESPONSE",
          term: this.currentTerm,
          serverId: this.serverId,
          votedFor: message.serverId,
          timestamp: Date.now(),
        },
        senderPort,
        message.serverId
      );

      this.startElectionTimer();
    }
  }

  private handleVoteResponse(message: ElectionMessage) {
    if (
      message.term === this.currentTerm &&
      message.votedFor === this.serverId
    ) {
      this.votes.add(message.serverId);

      // Check for majority
      if (this.votes.size > Math.floor((this.peers.length + 1) / 2)) {
        this.becomeLeader();
      }
    }
  }

  private handleHeartbeat(message: ElectionMessage) {
    if (message.term >= this.currentTerm) {
      if (this.electionTimer) {
        clearTimeout(this.electionTimer);
      }
      this.lastHeartbeat = Date.now();
      this.currentTerm = message.term;
      this.isLeader = false;
      this.onLeaderElected(message.serverId);
    }
  }

  private becomeLeader() {
    this.isLeader = true;
    this.stopHeartbeat();

    console.log(
      `Server ${this.serverId} becomes leader for term ${this.currentTerm}`
    );

    // Start sending heartbeats
    this.heartbeatInterval = setInterval(() => {
      this.peers.forEach((peer) => {
        this.send(
          {
            type: "APPEND_ENTRIES",
            term: this.currentTerm,
            serverId: this.serverId,
            timestamp: Date.now(),
          },
          peer.port,
          peer.id
        );
      });
    }, 500);

    this.onLeaderElected(this.serverId);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private send(message: ElectionMessage, port: number, peerId: string) {
    const buffer = Buffer.from(JSON.stringify(message));
    this.socket.send(buffer, port, `api-server-${peerId}`, (err) => {
      if (err) {
        console.error(`Error sending message to peer ${peerId}:`, err);
      }
    });
  }

  public addPeer(id: string, port: number) {
    this.peers.push({ id, port });
  }

  public isCurrentLeader(): boolean {
    return this.isLeader;
  }
}
