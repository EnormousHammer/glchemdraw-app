# Testing Documentation

## Overview
GlChemDraw uses a comprehensive testing strategy with unit tests, integration tests, and end-to-end tests.

## Test Structure

### Unit Tests (`src/test/unit/`)
- **Component Tests**: React component testing with React Testing Library
- **Utility Tests**: Pure function and utility testing
- **Hook Tests**: Custom React hooks testing

### Integration Tests (`src/test/integration/`)
- **API Integration**: PubChem API integration tests
- **RDKit Integration**: Chemical library integration tests
- **File Operations**: Tauri file system integration tests

### End-to-End Tests (`src/test/e2e/`)
- **User Workflows**: Complete user journey testing
- **Cross-Platform**: Desktop app functionality testing
- **Performance**: Load and stress testing

## Running Tests

### All Tests
```bash
npm run test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### E2E Tests Only
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

### Test UI (Interactive)
```bash
npm run test:ui
```

## Test Configuration

### Vitest Configuration
- **Environment**: jsdom for React testing
- **Coverage**: 70% minimum coverage required
- **Setup**: Global test setup in `src/test/setup.ts`

### Playwright Configuration
- **Browsers**: Chromium (desktop)
- **Base URL**: http://localhost:1420
- **Screenshots**: On failure only
- **Traces**: On first retry

## Test Categories

### 1. Component Tests
- Rendering tests
- User interaction tests
- Props validation
- Error boundary testing
- Theme switching

### 2. Chemistry Tests
- SMILES validation
- MOL file parsing
- Structure conversion
- PubChem API integration
- RDKit functionality

### 3. File Operations
- SDF import/export
- MOL file handling
- Batch processing
- Error handling

### 4. User Workflows
- Structure drawing workflow
- NMR analysis workflow
- Search and discovery
- Export functionality

## Mocking Strategy

### External APIs
- PubChem API responses
- File system operations
- RDKit library calls

### Tauri APIs
- Dialog operations
- File system access
- System notifications

### React Components
- Complex child components
- External libraries
- Async operations

## Coverage Requirements

- **Lines**: 70% minimum
- **Functions**: 70% minimum
- **Branches**: 70% minimum
- **Statements**: 70% minimum

## CI/CD Integration

### GitHub Actions
- Runs on every push and PR
- Tests on Windows, macOS, Linux
- Coverage reporting
- E2E test execution

### Pre-commit Hooks
- Unit test execution
- Linting checks
- Type checking

## Debugging Tests

### Unit Tests
```bash
npm run test -- --reporter=verbose
```

### E2E Tests
```bash
npm run test:e2e -- --debug
```

### Coverage Analysis
```bash
npm run test:coverage
open coverage/index.html
```

## Best Practices

1. **Test Naming**: Use descriptive test names
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock External Dependencies**: Isolate units under test
4. **Test Edge Cases**: Include error conditions
5. **Maintain Test Data**: Keep test data realistic
6. **Avoid Test Interdependence**: Tests should be independent
7. **Use Appropriate Assertions**: Match assertion to intent

## Troubleshooting

### Common Issues
- **Async Operations**: Use `waitFor` for async updates
- **Component Rendering**: Wrap in ThemeProvider
- **Mock Setup**: Ensure mocks are properly configured
- **Environment Variables**: Check test environment setup

### Debug Commands
```bash
# Debug specific test
npm run test -- --run --reporter=verbose src/test/unit/specific.test.ts

# Debug E2E test
npm run test:e2e -- --debug --headed

# Check test coverage
npm run test:coverage -- --reporter=text-summary
```
