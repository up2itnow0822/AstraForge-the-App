export interface Session {
  id: string;
  agents: any[];
  status: string;
}

export interface SessionResult {
  id: string;
  success: boolean;
  result?: any;
}
