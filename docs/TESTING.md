# Testing Documentation

This document guides you through setting up the testing environment and running automated tests for the **Smooth Search** plugin.

## 1. Prerequisites

Ensure you have the following installed:
-   **PHP** (7.4 or higher)
-   **Composer** (Dependency Manager for PHP)
-   **Rust** (optional, for Wasm tests)

## 2. Setting Up the Environment

1.  Navigate to the plugin directory:
    ```bash
    cd wp-content/plugins/smooth-search
    ```

2.  Install dependencies (including development tools):
    ```bash
    composer install
    ```
    *This will install PHPUnit and Mockery.*

## 3. Running PHP Unit Tests

Use PHPUnit to run the test suite. We use **Mockery** to mock WordPress core functions and class dependencies, so these tests run quickly without needing a full WordPress database.

### Run All Tests
```bash
./vendor/bin/phpunit
```

### Run Specific Test File
```bash
./vendor/bin/phpunit tests/unit/test-api.php
```

### Writing New Tests
-   Create a new test file in `tests/unit/`.
-   Extend `PHPUnit\Framework\TestCase`.
-   Use `Mockery` to mock dependencies (like `Settings`, `Indexer`).
-   See `tests/unit/test-api.php` for examples.

## 4. Running Wasm (Rust) Tests

The Rust code includes its own unit tests for the fuzzy search logic.

1.  Navigate to the wasm directory:
    ```bash
    cd wasm
    ```

2.  Run the tests:
    ```bash
    cargo test
    ```

## 5. React / Admin Tests

The admin interface (React app) uses **Vitest** and **React Testing Library**.

1.  Navigate to the admin directory:
    ```bash
    cd admin
    ```

2.  Run the tests:
    ```bash
    npm run test
    ```
    *This runs in watch mode by default.*

3.  **Writing New Tests**:
    -   Tests are located in `admin/src/__tests__/`.
    -   Files should end in `.test.jsx`.
    -   We use `vitest` for the runner and `@testing-library/react` for component rendering/assertions.

    **Example:**
    ```jsx
    import { render, screen } from '@testing-library/react';
    import MyComponent from '../MyComponent';
    
    it('renders correctly', () => {
        render(<MyComponent />);
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });
    ```
