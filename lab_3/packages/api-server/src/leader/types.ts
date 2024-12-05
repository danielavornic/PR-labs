export interface ElectionMessage {
  type: "REQUEST_VOTE" | "VOTE_RESPONSE" | "APPEND_ENTRIES";
  term: number;
  serverId: string;
  votedFor?: string;
  timestamp: number;
}
