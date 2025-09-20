// Comprehensive logging system for production debugging

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error
  userId?: string
  sessionId?: string
  requestId?: string
}

class Logger {
  private logLevel: LogLevel
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO
  }

  private formatLog(entry: LogEntry): string {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
    const levelName = levelNames[entry.level]
    
    let logMessage = `[${entry.timestamp}] ${levelName}: ${entry.message}`
    
    if (entry.context) {
      logMessage += ` | Context: ${JSON.stringify(entry.context)}`
    }
    
    if (entry.userId) {
      logMessage += ` | User: ${entry.userId}`
    }
    
    if (entry.sessionId) {
      logMessage += ` | Session: ${entry.sessionId}`
    }
    
    if (entry.requestId) {
      logMessage += ` | Request: ${entry.requestId}`
    }
    
    if (entry.error) {
      logMessage += ` | Error: ${entry.error.message}`
      if (entry.error.stack) {
        logMessage += ` | Stack: ${entry.error.stack}`
      }
    }
    
    return logMessage
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error,
    metadata?: { userId?: string; sessionId?: string; requestId?: string }
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      ...metadata
    }
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    const formattedLog = this.formatLog(entry)
    
    // Console logging
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedLog)
        break
      case LogLevel.INFO:
        console.info(formattedLog)
        break
      case LogLevel.WARN:
        console.warn(formattedLog)
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedLog)
        break
    }

    // In production, send to monitoring service
    if (!this.isDevelopment && entry.level >= LogLevel.ERROR) {
      this.sendToMonitoring(entry)
    }
  }

  private async sendToMonitoring(entry: LogEntry): Promise<void> {
    try {
      // TODO: Implement monitoring service integration (Sentry, LogRocket, etc.)
      // For now, we'll just log to console in production
      console.error('Production Error:', entry)
    } catch (error) {
      console.error('Failed to send log to monitoring service:', error)
    }
  }

  debug(message: string, context?: Record<string, any>, metadata?: { userId?: string; sessionId?: string; requestId?: string }): void {
    this.log(this.createLogEntry(LogLevel.DEBUG, message, context, undefined, metadata))
  }

  info(message: string, context?: Record<string, any>, metadata?: { userId?: string; sessionId?: string; requestId?: string }): void {
    this.log(this.createLogEntry(LogLevel.INFO, message, context, undefined, metadata))
  }

  warn(message: string, context?: Record<string, any>, metadata?: { userId?: string; sessionId?: string; requestId?: string }): void {
    this.log(this.createLogEntry(LogLevel.WARN, message, context, undefined, metadata))
  }

  error(message: string, error?: Error, context?: Record<string, any>, metadata?: { userId?: string; sessionId?: string; requestId?: string }): void {
    this.log(this.createLogEntry(LogLevel.ERROR, message, context, error, metadata))
  }

  fatal(message: string, error?: Error, context?: Record<string, any>, metadata?: { userId?: string; sessionId?: string; requestId?: string }): void {
    this.log(this.createLogEntry(LogLevel.FATAL, message, context, error, metadata))
  }

  // Specialized logging methods
  apiRequest(method: string, url: string, metadata?: { userId?: string; sessionId?: string; requestId?: string }): void {
    this.info(`API Request: ${method} ${url}`, { method, url }, metadata)
  }

  apiResponse(method: string, url: string, status: number, duration: number, metadata?: { userId?: string; sessionId?: string; requestId?: string }): void {
    this.info(`API Response: ${method} ${url} - ${status} (${duration}ms)`, { method, url, status, duration }, metadata)
  }

  databaseOperation(operation: string, table: string, metadata?: { userId?: string; sessionId?: string; requestId?: string }): void {
    this.debug(`Database Operation: ${operation} on ${table}`, { operation, table }, metadata)
  }

  authEvent(event: string, userId?: string, metadata?: { sessionId?: string; requestId?: string }): void {
    this.info(`Auth Event: ${event}`, { event, userId }, { userId, ...metadata })
  }

  calendarEvent(event: string, eventId?: string, metadata?: { userId?: string; sessionId?: string; requestId?: string }): void {
    this.info(`Calendar Event: ${event}`, { event, eventId }, metadata)
  }

  chatEvent(event: string, sessionId?: string, metadata?: { userId?: string; requestId?: string }): void {
    this.info(`Chat Event: ${event}`, { event, sessionId }, { sessionId, ...metadata })
  }

  openaiRequest(model: string, tokens: number, metadata?: { userId?: string; sessionId?: string; requestId?: string }): void {
    this.info(`OpenAI Request: ${model} (${tokens} tokens)`, { model, tokens }, metadata)
  }

  openaiResponse(model: string, tokens: number, duration: number, metadata?: { userId?: string; sessionId?: string; requestId?: string }): void {
    this.info(`OpenAI Response: ${model} (${tokens} tokens, ${duration}ms)`, { model, tokens, duration }, metadata)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience functions
export const log = {
  debug: (message: string, context?: Record<string, any>, metadata?: { userId?: string; sessionId?: string; requestId?: string }) => 
    logger.debug(message, context, metadata),
  info: (message: string, context?: Record<string, any>, metadata?: { userId?: string; sessionId?: string; requestId?: string }) => 
    logger.info(message, context, metadata),
  warn: (message: string, context?: Record<string, any>, metadata?: { userId?: string; sessionId?: string; requestId?: string }) => 
    logger.warn(message, context, metadata),
  error: (message: string, error?: Error, context?: Record<string, any>, metadata?: { userId?: string; sessionId?: string; requestId?: string }) => 
    logger.error(message, error, context, metadata),
  fatal: (message: string, error?: Error, context?: Record<string, any>, metadata?: { userId?: string; sessionId?: string; requestId?: string }) => 
    logger.fatal(message, error, context, metadata),
  api: {
    request: (method: string, url: string, metadata?: { userId?: string; sessionId?: string; requestId?: string }) => 
      logger.apiRequest(method, url, metadata),
    response: (method: string, url: string, status: number, duration: number, metadata?: { userId?: string; sessionId?: string; requestId?: string }) => 
      logger.apiResponse(method, url, status, duration, metadata)
  },
  db: (operation: string, table: string, metadata?: { userId?: string; sessionId?: string; requestId?: string }) => 
    logger.databaseOperation(operation, table, metadata),
  auth: (event: string, userId?: string, metadata?: { sessionId?: string; requestId?: string }) => 
    logger.authEvent(event, userId, metadata),
  calendar: (event: string, eventId?: string, metadata?: { userId?: string; sessionId?: string; requestId?: string }) => 
    logger.calendarEvent(event, eventId, metadata),
  chat: (event: string, sessionId?: string, metadata?: { userId?: string; requestId?: string }) => 
    logger.chatEvent(event, sessionId, metadata),
  openai: {
    request: (model: string, tokens: number, metadata?: { userId?: string; sessionId?: string; requestId?: string }) => 
      logger.openaiRequest(model, tokens, metadata),
    response: (model: string, tokens: number, duration: number, metadata?: { userId?: string; sessionId?: string; requestId?: string }) => 
      logger.openaiResponse(model, tokens, duration, metadata)
  }
}
