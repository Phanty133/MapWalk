# Build configuration

## Assets

- `"assets": []` - An array of all directories to include in the build

# .env configuration

## Logging

- `LOG_DIR` - Path to log output directory
- `LOG_VERBOSITY`
  - 0: Only errors
  - 1: Warnings, errors
  - 2: Info, warnings, errors
- `LOG_TRACE` - true/false - Log error stack trace
- `LOG_ERRCONTEXT` - true/false - If the error occured in a request callback, log request route, body, and cookies

## Other

- `NODE_ENV` - development/production - Enable/disable development-specific features
- `VERSION` - Current server version
- `DATA_DIR` - Path to file upload directory