export interface Insight {
    type: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
}

export class InsightsEngine {
    async generateInsights(context: any): Promise<Insight[]> {
        return [
            { type: 'performance', description: 'Optimize loop', priority: 'medium' }
        ];
    }
}
