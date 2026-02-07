/** 構造化ログ */
interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  context: Record<string, unknown>;
  timestamp: number;
}

export class Logger {
  private logs: LogEntry[] = [];

  info(message: string, context: Record<string, unknown> = {}): void {
    this.log('info', message, context);
  }

  warn(message: string, context: Record<string, unknown> = {}): void {
    this.log('warn', message, context);
  }

  error(message: string, context: Record<string, unknown> = {}): void {
    this.log('error', message, context);
  }

  private log(
    level: LogEntry['level'],
    message: string,
    context: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: Date.now(),
    };
    this.logs.push(entry);
    console[level](JSON.stringify(entry));
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
