import { describe, it, expect, jest } from '@jest/globals';
import { ArchAgent } from '../ArchAgent/ArchAgent';
import { BackendAgent } from '../BackendAgent/BackendAgent';
import { DocsAgent } from '../DocsAgent/DocsAgent';
import { GodelAgent } from '../GodelAgent/GodelAgent';
import { JudgeAgent } from '../JudgeAgent/JudgeAgent';
import { RsiAgent } from '../RsiAgent/RsiAgent';
import { SecurityAgent } from '../SecurityAgent/SecurityAgent';
import { SpecAgent } from '../SpecAgent/SpecAgent';
import { TestAgent } from '../TestAgent/TestAgent';
import { LLMProvider } from '../../llm/interfaces';

// Mock dependencies with explicit explicit casting
const mockGenerate = jest.fn();
(mockGenerate as any).mockResolvedValue({ 
    content: 'mock response', 
    usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 } 
});

const mockEmbed = jest.fn();
(mockEmbed as any).mockResolvedValue([0.1, 0.2, 0.3]);

const mockLLMProvider: LLMProvider = {
    name: 'mock',
    model: 'mock',
    generate: mockGenerate,
    embed: mockEmbed
} as unknown as LLMProvider;

const mockLanceDB = {
    init: jest.fn(),
    ensureTable: jest.fn(),
    insert: jest.fn(),
    search: jest.fn()
};
(mockLanceDB.search as any).mockResolvedValue([]);

describe('All Agents Instantiation', () => {
    const config = {
        id: 'test-agent-id',
        llmProvider: mockLLMProvider,
        lanceDB: mockLanceDB as any
    };

    const agents = [
        { name: 'ArchAgent', Class: ArchAgent },
        { name: 'BackendAgent', Class: BackendAgent },
        { name: 'DocsAgent', Class: DocsAgent },
        { name: 'GodelAgent', Class: GodelAgent },
        { name: 'JudgeAgent', Class: JudgeAgent },
        { name: 'RsiAgent', Class: RsiAgent },
        { name: 'SecurityAgent', Class: SecurityAgent },
        { name: 'SpecAgent', Class: SpecAgent },
        { name: 'TestAgent', Class: TestAgent }
    ];

    agents.forEach(({ name, Class }) => {
        describe(name, () => {
            it('should instantiate correctly with config', () => {
                const agent = new Class(config);
                expect(agent).toBeDefined();
                expect(agent).toBeInstanceOf(Class);
                // Check inherited property if available to verify proper super() call
                if ((agent as any).id) {
                    expect((agent as any).id).toBe(config.id);
                }
            });
        });
    });
});
