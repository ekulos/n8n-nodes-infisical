# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2025-10-13

### Major Performance Improvements
- **BREAKING CHANGE**: Switched from `listSecrets()` with filtering to direct `getSecret()` retrieval
- **Performance**: Dramatically reduced API calls and improved response times
- **Efficiency**: Single API call per secret instead of downloading all secrets

### Authentication Updates
- **BREAKING CHANGE**: Updated to use Access Token (Bearer) authentication instead of Service Token
- **BREAKING CHANGE**: Now requires Project ID (UUID) instead of Project Slug
- **SDK Upgrade**: Updated to Infisical SDK v4.0.6+ for better compatibility
- **Security**: Enhanced authentication method with Bearer token support

### Smart JSON Handling
- **Auto-parsing**: Automatically detects and parses JSON secret values
- **Error Correction**: Intelligently fixes common JSON formatting errors (e.g., `{username"` → `{"username"`)
- **Structured Output**: JSON objects are flattened into direct output fields
- **Fallback**: Non-JSON values are returned as raw strings

### Intelligent Fallback System
- **Smart Matching**: If exact service name isn't found, automatically tries variations:
  - Lowercase version (`servicename`)
  - Uppercase version (`SERVICENAME`)
  - With common suffixes (`servicename_account`, `SERVICENAME_CONFIG`, etc.)
- **Auto-discovery**: Reduces configuration needed for standard naming patterns
- **Error Reduction**: Fewer "secret not found" errors due to naming mismatches

### Developer Experience
- **Better Error Messages**: More descriptive error messages with specific secret names
- **Environment Variables**: Enhanced test suite with configurable secret names
- **Type Safety**: Improved TypeScript definitions and error handling
- **Documentation**: Comprehensive examples and migration guide

### Migration Guide from v1.0.2
1. **Update Credentials**:
   - Replace Service Token with Access Token
   - Replace Project Slug with Project ID (UUID format)
2. **Simplify Configuration**:
   - Set Service Name to exact secret name or close variation
   - Remove complex credential mappings for simple JSON secrets
3. **Test Integration**:
   - Verify secret retrieval with new direct approach
   - Check JSON parsing for structured secrets

## [1.0.2] - 2025-10-08

### Authentication & Compatibility Fixes
- **Fixed**: Authentication issues with Infisical SDK v4
- **Improved**: Bearer token authentication implementation
- **Enhanced**: Project ID support for better workspace identification
- **Updated**: Environment variable configuration for testing
- **Resolved**: Plugin visibility issues in n8n interface

### Bug Fixes
- Fixed "blob is not defined" errors with polyfill additions
- Resolved authentication token validation issues
- Corrected project identification problems
- Fixed compilation errors with TypeScript configuration

### Documentation
- Updated installation instructions for Docker environments
- Added troubleshooting section for common issues
- Improved credential configuration examples
- Enhanced API compatibility documentation

## [1.0.1] - 2025-09-15

### Initial Stable Release
- **Complete**: First fully functional public release
- **Docker**: Complete Docker integration with caronte-workflow
- **Publishing**: Successfully published to npm registry
- **Testing**: Comprehensive test suite with real Infisical instance
- **Documentation**: Complete setup and usage documentation

### Infrastructure
- Docker Compose integration for development
- npm package publishing workflow
- Environment-based configuration
- Test automation setup

## [1.0.0] - 2025-09-10

### Added
- Initial release of n8n-nodes-infisical
- Integration with Infisical API using official TypeScript SDK
- Support for service token authentication
- Automatic credential pattern discovery
- Custom credential mapping functionality
- Built-in caching mechanism with configurable TTL
- Comprehensive error handling and logging
- Support for multiple environments and projects
- TypeScript type safety throughout

### Features
- **Service Token Authentication**: Secure authentication using Infisical service tokens
- **Automatic Pattern Discovery**: Automatically discovers common credential patterns like `{SERVICE}_USERNAME`, `{SERVICE}_PASSWORD`, etc.
- **Custom Mappings**: Allows custom field mappings for non-standard secret naming conventions
- **Caching**: Intelligent caching system to reduce API calls and improve performance
- **Multiple Environments**: Support for dev, staging, production environments
- **Secret Path Support**: Organize secrets in hierarchical paths
- **Error Resilience**: Robust error handling with meaningful error messages

### Technical Details
- Built on official `@infisical/sdk` v1.5.0
- Compatible with n8n v1.0.0+
- TypeScript implementation with full type safety
- Follows n8n community node standards
- Comprehensive test coverage
- ESLint and Prettier configuration

### Configuration
- Host URL configuration for self-hosted Infisical instances
- Project and environment slug configuration
- Configurable cache TTL (default: 300 seconds)
- Service token management
- Custom credential field mappings

### Documentation
- Complete installation guide
- Configuration examples
- Usage patterns and best practices
- Troubleshooting guide
- API compatibility information