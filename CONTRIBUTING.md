# Contributing to SCHM

Thank you for your interest in contributing to SCHM (Smart Clipboard History Manager)! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

There are several ways you can contribute to SCHM:

- Report bugs and suggest features
- Improve documentation
- Fix bugs and implement features
- Add translations
- Review code

## Development Process

### Setting Up Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/schm.git
   cd schm
   ```
3. **Set up the development environment**:
   ```bash
   npm install
   ```
4. **Create a new branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Workflow

1. Make your changes in your feature branch
2. Add tests for new functionality
3. Ensure code passes all tests and linting
4. Commit your changes (see [Commit Guidelines](#commit-guidelines))
5. Push to your fork
6. Submit a Pull Request to the main repository

### Build and Test

```bash
# Run development server
npm run tauri dev

# Build for production
npm run tauri build

# Run tests
npm run test

# Lint code
npm run lint
```

## Pull Request Guidelines

When submitting a pull request:

1. **Reference any related issues** using the GitHub issue number (#123)
2. **Describe your changes** clearly and comprehensively
3. **Include screenshots** for UI changes
4. **Update documentation** if necessary
5. **Make sure tests pass** and code conforms to linting standards

## Commit Guidelines

We follow a conventional commit format to make the commit history more readable:

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `style: formatting, no code change`
- `refactor: refactoring code`
- `test: add tests`
- `chore: update build tasks, package manager configs, etc`

## Code Style

- **Rust**: Follow the [Rust Style Guide](https://doc.rust-lang.org/1.0.0/style/README.html)
- **TypeScript/React**: Follow the project's ESLint configuration
- **Comments**: Write clear comments for complex logic
- **Documentation**: Update relevant documentation for new features

## Reporting Bugs

When reporting bugs, please include:

1. Clear steps to reproduce the issue
2. Expected vs. actual behavior
3. Screenshots if applicable
4. System information (OS, SCHM version)
5. Any relevant logs

## Feature Requests

Feature requests should:

1. Clearly describe the problem the feature would solve
2. Explain how the feature would work
3. Consider edge cases and user experience implications

## Questions?

If you have any questions about contributing, feel free to open an issue with your question.

Thank you for contributing to SCHM!
