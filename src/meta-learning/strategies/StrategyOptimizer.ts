export interface Strategy {
    id: string;
    name: string;
    parameters: Record<string, any>;
}

export class StrategyOptimizer {
    async optimizeStrategy(strategy: Strategy, performanceMetrics: any): Promise<Strategy> {
        return {
            ...strategy,
            parameters: { ...strategy.parameters, optimized: true }
        };
    }
}
