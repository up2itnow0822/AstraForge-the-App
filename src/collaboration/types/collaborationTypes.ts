export interface CollaborationRequest {
sessionId: string;
prompt: string;
priority: 'low' | 'medium' | 'high';
timeout?: number;
maxParticipants?: number;
requireConsensus?: boolean;
consensusThreshold?: number;
metadata?: Record<string, any>;
}

export interface CollaborationSession {
sessionId: string;
prompt: string;
priority: 'low' | 'medium' | 'high';
timeout: number;
maxParticipants: number;
status: 'active' | 'paused' | 'completed' | 'timeout' | 'error';
participants: Participant[];
startTime: number;
lastActivity: number;
endTime?: number;
errorCount: number;
requireConsensus: boolean;
consensusThreshold: number;
metadata?: Record<string, any>;
expiresAt?: number;
result?: string;
}

export interface Participant {
providerId: string;
role: string;
status: 'active' | 'inactive' | 'error';
joinedAt?: number;
lastSeen?: number;
}

export interface Message {
role: string;
content: string;
timestamp: number;
sender: string;
targetParticipantId?: string;
sessionId?: string;
}

export interface ConsensusResult {
consensusReached: boolean;
consensusLevel: number;
finalResponse: string;
confidence: number;
alternativeSuggestions?: string[];
}

export interface ParticipantData {
providerId: string;
role: string;
status: 'active' | 'inactive' | 'error';
}
