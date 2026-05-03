import { ConsoleLogger, LogLevel } from '@nestjs/common';

interface FilteredLoggerOptions {
  logLevels?: LogLevel[];
  ignorePatterns?: string[];
}

export class FilteredLogger extends ConsoleLogger {
  private ignorePatterns: string[];

  constructor(context?: string, options?: FilteredLoggerOptions) {
    // Pass only logLevels to super
    super(context, { logLevels: options?.logLevels });
    this.ignorePatterns = options?.ignorePatterns || [];
  }

  log(message: any, context?: string) {
    if (this.shouldIgnore(context)) return;
    super.log(message, context);
  }

  warn(message: any, context?: string) {
    if (this.shouldIgnore(context)) return;
    super.warn(message, context);
  }

  error(message: any, trace?: string, context?: string) {
    if (this.shouldIgnore(context)) return;
    super.error(message, trace, context);
  }

  debug(message: any, context?: string) {
    if (this.shouldIgnore(context)) return;
    super.debug(message, context);
  }

  verbose(message: any, context?: string) {
    if (this.shouldIgnore(context)) return;
    super.verbose(message, context);
  }

  private shouldIgnore(context: any): boolean {
    // console.log(this.ignorePatterns);
    return this.ignorePatterns.some(
      (pattern) => typeof context === 'string' && context === pattern,
    );
  }
}
