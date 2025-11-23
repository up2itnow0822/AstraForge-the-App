export interface TestModule {
    module: string;
    methods: string[];
    coverage: number;
}
export declare class TestGenerator {
    private lanceDB;
    constructor();
    scanForNewModules(srcDir?: string): Promise<TestModule[]>;
    private extractMethods;
    private getCoverageForModule;
    generateTestsForModule(modulePath: string, methods: string[]): Promise<string[]>;
    generateTestFile(module: TestModule): Promise<string>;
    generateMissingTests(): Promise<string[]>;
    run(): Promise<void>;
}
export default TestGenerator;
