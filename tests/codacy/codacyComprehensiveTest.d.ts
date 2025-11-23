/**
 * Comprehensive Codacy Test Suite
 *
 * This test suite covers all Codacy scan tools:
 * - ESLint: Code quality and style
 * - Lizard: Code complexity analysis
 * - Semgrep: Security patterns
 * - Trivy: Vulnerability scanning
 *
 * Each test validates compliance with Codacy standards and best practices.
 */
interface CodacyTestResult {
    tool: string;
    passed: boolean;
    score: number;
    issues: Array<{
        file: string;
        line?: number;
        message: string;
        severity: 'error' | 'warning' | 'info';
    }>;
    recommendations: string[];
}
interface CodacyScanResults {
    eslint: CodacyTestResult;
    lizard: CodacyTestResult;
    semgrep: CodacyTestResult;
    trivy: CodacyTestResult;
    overallScore: number;
    overallPassed: boolean;
}
export declare class CodacyTestSuite {
    private testResults;
    /**
     * Run all Codacy tests and return comprehensive results
     */
    runAllTests(): Promise<CodacyScanResults>;
    /**
     * ESLint: Code Quality and Style Analysis
     */
    private runESLintTests;
    /**
     * Lizard: Code Complexity Analysis
     */
    private runLizardTests;
    /**
     * Semgrep: Security Pattern Analysis
     */
    private runSemgrepTests;
    /**
     * Trivy: Vulnerability Scanning
     */
    private runTrivyTests;
    /**
     * Parse ESLint output for issues
     */
    private parseESLintOutput;
    /**
     * Parse Trivy output for vulnerabilities
     */
    private parseTrivyOutput;
    /**
     * Calculate overall test results
     */
    private calculateOverallResults;
    /**
     * Display comprehensive test results
     */
    private displayResults;
    private getToolIcon;
}
export default CodacyTestSuite;
