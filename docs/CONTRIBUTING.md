
## Testing (TDD)
Use Vitest/Jest for units: Write tests first (Arrange/Act/Assert), include doc strings:
```ts
/**
 * Test LLM integration.
 * @fileoverview Covers mocks, edge cases.
 */
describe('LLM', () => {
  it('generates consensus', () => {
    // Arrange: Mock API
    // Act: Call generate
    // Assert: Matches expected
  });
});
```
Run: npm test; TDD cycle: Red-Green-Refactor with docs.
