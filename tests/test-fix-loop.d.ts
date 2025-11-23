interface FixResult {
    finalPassRate: number;
    iterations: number;
    success: boolean;
}
export declare class TestFixLoop {
    private maxIterations;
    private successThreshold;
    private appliedFixes;
    runFixLoop(): Promise<FixResult>;
    private runTests;
    private analyzeFailures;
    private analyzeSingleFailure;
    private applyFixes;
    private applySimpleFix;
    private logForManualReview;
    getAppliedFixes(): string[];
}
export {};
