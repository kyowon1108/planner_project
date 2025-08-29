// 로깅 레벨
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// 로그 메시지 인터페이스
interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: any;
}

class Logger {
  private level: LogLevel;
  private logs: LogMessage[] = [];
  private maxLogs = 1000; // 최대 로그 개수

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
    this.setupConsoleLogging();
  }

  private setupConsoleLogging() {
    // 개발 환경에서만 콘솔 로깅 활성화
    if (process.env.NODE_ENV === 'development') {
      this.enableConsoleLogging();
    }
  }

  private enableConsoleLogging() {
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };

    // 콘솔 메서드 오버라이드
    console.log = (...args) => {
      this.log(LogLevel.INFO, args.join(' '));
      originalConsole.log(...args);
    };

    console.info = (...args) => {
      this.log(LogLevel.INFO, args.join(' '));
      originalConsole.info(...args);
    };

    console.warn = (...args) => {
      this.log(LogLevel.WARN, args.join(' '));
      originalConsole.warn(...args);
    };

    console.error = (...args) => {
      this.log(LogLevel.ERROR, args.join(' '));
      originalConsole.error(...args);
    };
  }

  private addLog(level: LogLevel, message: string, context?: string, data?: any) {
    const logMessage: LogMessage = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
    };

    this.logs.push(logMessage);

    // 최대 로그 개수 제한
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 로컬 스토리지에 로그 저장 (최근 100개)
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      const recentLogs = this.logs.slice(-100);
      localStorage.setItem('app_logs', JSON.stringify(recentLogs));
    } catch (error) {
      // 로컬 스토리지 에러 무시
    }
  }

  private getLevelString(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.INFO: return 'INFO';
      case LogLevel.WARN: return 'WARN';
      case LogLevel.ERROR: return 'ERROR';
      default: return 'UNKNOWN';
    }
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '#6c757d';
      case LogLevel.INFO: return '#007bff';
      case LogLevel.WARN: return '#ffc107';
      case LogLevel.ERROR: return '#dc3545';
      default: return '#000000';
    }
  }

  log(level: LogLevel, message: string, context?: string, data?: any) {
    if (level >= this.level) {
      this.addLog(level, message, context, data);
    }
  }

  debug(message: string, context?: string, data?: any) {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: any) {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: any) {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: any) {
    this.log(LogLevel.ERROR, message, context, data);
  }

  // API 요청 로깅
  logApiRequest(method: string, url: string, data?: any) {
    this.info(`API 요청: ${method} ${url}`, 'API', data);
  }

  logApiResponse(method: string, url: string, status: number, data?: any) {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API 응답: ${method} ${url} -> ${status}`, 'API', data);
  }

  logApiError(method: string, url: string, error: any) {
    this.error(`API 에러: ${method} ${url}`, 'API', error);
  }

  // 사용자 액션 로깅
  logUserAction(action: string, details?: any) {
    this.info(`사용자 액션: ${action}`, 'USER', details);
  }

  // 컴포넌트 로깅
  logComponent(component: string, action: string, details?: any) {
    this.debug(`컴포넌트: ${component} - ${action}`, 'COMPONENT', details);
  }

  // UX 분석 로깅
  logUXEvent(event: any) {
    this.info(`UX 이벤트: ${event.type}`, 'UX_ANALYTICS', event);
  }

  logUXSessionEnd(session: any) {
    this.info(`UX 세션 종료: ${session.id}`, 'UX_ANALYTICS', {
      sessionId: session.id,
      duration: session.endTime - session.startTime,
      eventCount: session.events.length,
    });
  }

  // 에러 로깅
  logError(error: Error, context?: string) {
    this.error(`에러 발생: ${error.message}`, context, {
      stack: error.stack,
      name: error.name,
    });
  }

  // 로그 조회
  getLogs(level?: LogLevel, limit?: number): LogMessage[] {
    let filteredLogs = this.logs;
    
    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }
    
    return filteredLogs;
  }

  // 로그 내보내기
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // 로그 초기화
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('app_logs');
  }

  // 로그 레벨 설정
  setLevel(level: LogLevel) {
    this.level = level;
  }
}

// 싱글톤 인스턴스
export const logger = new Logger();

// 개발 환경에서 전역 객체에 로거 추가
if (process.env.NODE_ENV === 'development') {
  (window as any).logger = logger;
} 