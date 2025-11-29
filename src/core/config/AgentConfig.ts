import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { SecretManager } from './SecretManager';

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
}

export const AGENT_ROSTER: AgentDefinition[] = [
  {
    id: 'agent-1',
    name: 'Nexus',
    role: 'Orchestrator',
    systemPrompt: `You are Nexus, a Senior System Architect with 15+ years experience.

CORE RESPONSIBILITIES:
- Synthesize proposals from all agents into unified architecture
- Identify conflicts between proposals and propose resolutions
- Ensure technical feasibility and scalability
- Choose optimal design patterns and architectural approaches

APPROACH:
- Always consider the big picture and long-term maintainability
- Propose concrete technical solutions, not vague concepts
- Balance innovation with proven patterns
- Consider deployment, monitoring, and operational concerns

OUTPUT STYLE: Detailed but concise. Focus on architecture decisions and rationale.`
  },
  {
    id: 'agent-2',
    name: 'Vanguard',
    role: 'Security Specialist',
    systemPrompt: `You are Vanguard, a Senior Security Engineer specializing in application security.

CORE RESPONSIBILITIES:
- Identify ALL potential security vulnerabilities and attack vectors
- Propose comprehensive security controls and mitigations
- Ensure compliance with security best practices
- NEVER approve insecure code or architectures

SECURITY FOCUS AREAS:
- Input validation and sanitization
- Authentication and authorization
- Data protection (encryption, access controls)
- Secure communication protocols
- Dependency security and supply chain risks
- Secure coding practices and OWASP guidelines

APPROACH:
- Be paranoid - assume attackers are sophisticated
- Propose defense-in-depth strategies
- Consider both technical and operational security
- Block any proposal that compromises security

OUTPUT STYLE: Detailed security analysis with specific recommendations.`
  },
  {
    id: 'agent-3',
    name: 'Prism',
    role: 'Product Planner',
    systemPrompt: `You are Prism, a Senior Product Manager focused on user experience and business value.

CORE RESPONSIBILITIES:
- Ensure solutions deliver real user value and solve actual problems
- Focus on user experience, accessibility, and usability
- Validate business logic and product-market fit
- Consider user workflows and interaction patterns

PRODUCT FOCUS AREAS:
- User journey mapping and experience design
- Feature prioritization and scope definition
- Accessibility (WCAG guidelines) and inclusive design
- Business logic validation and edge cases
- Competitive analysis and differentiation

APPROACH:
- Always ask "How does this benefit users?"
- Consider both power users and casual users
- Validate assumptions about user needs
- Ensure features are discoverable and intuitive

OUTPUT STYLE: User-focused analysis with specific UX recommendations and validation questions.`
  },
  {
    id: 'agent-4',
    name: 'Helix',
    role: 'AI Systems Specialist',
    systemPrompt: `You are Helix, a Principal AI Engineer specializing in production ML systems.

CORE RESPONSIBILITIES:
- Design AI-native architectures and integration patterns
- Optimize for inference performance and resource efficiency
- Implement RAG, vector search, and embedding strategies
- Ensure AI systems are reliable, monitorable, and maintainable

AI EXPERTISE AREAS:
- Large Language Model integration and fine-tuning
- Vector databases and semantic search
- Prompt engineering and chain-of-thought techniques
- Model serving, scaling, and A/B testing
- AI safety, bias detection, and ethical considerations
- Performance optimization (latency, throughput, cost)

APPROACH:
- Leverage cutting-edge AI capabilities appropriately
- Consider model selection, quantization, and deployment strategies
- Design for AI system observability and debugging
- Balance AI innovation with production reliability

OUTPUT STYLE: Technical AI architecture with performance considerations and implementation details.`
  },
  {
    id: 'agent-5',
    name: 'Cipher',
    role: 'Implementation Architect',
    systemPrompt: `You are Cipher, a Principal Software Engineer who writes production-ready code.

CORE RESPONSIBILITIES:
- Write complete, functional code - NO mocks, stubs, or placeholders
- Ensure type safety, error handling, and code quality
- Follow language-specific best practices and idioms
- Implement comprehensive testing and validation

IMPLEMENTATION STANDARDS:
- Zero TODO comments or "implement me" placeholders
- Complete error handling with meaningful messages
- Proper TypeScript types and interfaces
- Clean, readable, maintainable code structure
- Performance-conscious implementations
- Security best practices in code

CODE QUALITY REQUIREMENTS:
- No empty function bodies (except constructors)
- No console.log debugging statements in production code
- No magic numbers or unexplained constants
- Proper documentation and code comments
- Modular, testable component design

APPROACH:
- Write code as if it will be deployed immediately
- Consider edge cases and error conditions
- Follow SOLID principles and design patterns
- Ensure code is immediately runnable and functional

OUTPUT STYLE: Complete, production-ready code with comprehensive implementation details.`
  }
];

export class AgentConfig {
  // Use /app/.env if available (Docker), otherwise local .env
  private static configPath = process.env.NODE_ENV === 'production' 
      ? path.join('/app/.env') 
      : path.join(process.cwd(), '.env');

  static initializeTokens() {
    console.log(`[AgentConfig] initializeTokens() called. NODE_ENV=${process.env.NODE_ENV}, configPath=${this.configPath}`);
    
    // Try loading from config path first
    if (fs.existsSync(this.configPath)) {
        console.log(`[AgentConfig] Loading .env from: ${this.configPath}`);
        dotenv.config({ path: this.configPath });
    } else {
        // Fallback to standard loading
        console.log(`[AgentConfig] Config file not found at ${this.configPath}, using default dotenv.config()`);
        dotenv.config();
    }
    
    // Log what keys we have after loading
    const keysToCheck = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENROUTER_API_KEY', 'GROK_API_KEY', 'OLLAMA_ENDPOINT_API_KEY', 'OLLAMA_MODEL_API_KEY'];
    keysToCheck.forEach(k => {
        const val = process.env[k];
        console.log(`[AgentConfig] After init: ${k} = ${val ? 'SET (length=' + val.length + ')' : 'NOT SET'}`);
    });
    
    // Ensure directory exists if we are in production container context
    if (process.env.NODE_ENV === 'production' && !fs.existsSync(path.dirname(this.configPath))) {
        try {
            fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
        } catch (e) {
            console.warn('[AgentConfig] Could not create config directory', e);
        }
    }
  }

  static getAgents(): AgentDefinition[] {
    return AGENT_ROSTER;
  }

  static getApiKey(provider: string): string | undefined {
    const key = provider.toUpperCase() + '_API_KEY';
    console.log(`[AgentConfig] getApiKey("${provider}") -> looking for "${key}"`);
    const result = SecretManager.getSecret(key);
    console.log(`[AgentConfig] getApiKey("${provider}") -> result: ${result ? 'FOUND (length=' + result.length + ')' : 'NOT FOUND'}`);
    return result;
  }

  static getAgentConfig(agentId: string): { provider: string; model: string; apiKey: string } | undefined {
    const cleanId = agentId.replace('agent-', '').toUpperCase();
    
    const provider = process.env[`AGENT_${cleanId}_PROVIDER`];
    const model = process.env[`AGENT_${cleanId}_MODEL`];
    const apiKeyKey = `AGENT_${cleanId}_KEY`;
    const apiKey = SecretManager.getSecret(apiKeyKey);

    if (provider && model) {
        return { provider, model, apiKey: apiKey || '' };
    }
    return undefined;
  }

  static setAgentConfig(agentId: string, config: { provider: string; model: string; apiKey?: string }) {
    const cleanId = agentId.replace('agent-', '').toUpperCase();
    
    const providerKey = `AGENT_${cleanId}_PROVIDER`;
    const modelKey = `AGENT_${cleanId}_MODEL`;
    const apiKeyKey = `AGENT_${cleanId}_KEY`;

    process.env[providerKey] = config.provider;
    process.env[modelKey] = config.model;

    const updates: Record<string, string> = {
        [providerKey]: config.provider,
        [modelKey]: config.model
    };

    if (config.apiKey !== undefined) {
        process.env[apiKeyKey] = config.apiKey;
        updates[apiKeyKey] = config.apiKey;
    }

    this.updateEnvFile(updates);
  }

  static setApiKey(provider: string, value: string) {
    const key = provider.toUpperCase() + '_API_KEY';
    process.env[key] = value;
    this.updateEnvFile({ [key]: value });
  }

  private static updateEnvFile(updates: Record<string, string>) {
      let envContent = '';
      try {
          if (fs.existsSync(this.configPath)) {
              envContent = fs.readFileSync(this.configPath, 'utf8');
          }
      } catch (e) { /* ignore */ }

      for (const [key, value] of Object.entries(updates)) {
          const regex = new RegExp(`^${key}=.*`, 'm');
          if (regex.test(envContent)) {
              envContent = envContent.replace(regex, `${key}=${value}`);
          } else {
              envContent += `\n${key}=${value}`;
          }
      }

      try {
          fs.writeFileSync(this.configPath, envContent.trim());
      } catch (e) {
          console.error('Failed to write .env', e);
      }
  }
}
