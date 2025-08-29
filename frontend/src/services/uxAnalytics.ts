import { logger } from '../utils/logger';

export interface UXEvent {
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'error' | 'performance';
  element: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  data?: any;
}

export interface UXSession {
  id: string;
  startTime: number;
  endTime?: number;
  events: UXEvent[];
  userAgent: string;
  screenSize: { width: number; height: number };
  path: string;
}

export interface UXAnalysis {
  sessionId: string;
  heatmapData: { x: number; y: number; intensity: number }[];
  userFlow: { from: string; to: string; count: number }[];
  performanceMetrics: {
    pageLoadTime: number;
    interactionTime: number;
    errorRate: number;
  };
  usabilityScore: number;
  recommendations: string[];
}

class UXAnalyticsService {
  private sessions: Map<string, UXSession> = new Map();
  private currentSession: UXSession | null = null;

  constructor() {
    this.initializeSession();
    this.setupEventListeners();
  }

  private initializeSession(): void {
    const sessionId = this.generateSessionId();
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      events: [],
      userAgent: navigator.userAgent,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      path: window.location.pathname,
    };
    this.sessions.set(sessionId, this.currentSession);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners(): void {
    // 클릭 이벤트 추적
    document.addEventListener('click', (e) => {
      this.trackEvent('click', e.target as HTMLElement);
    });

    // 스크롤 이벤트 추적
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackEvent('scroll', document.body);
      }, 100);
    });

    // 입력 이벤트 추적
    document.addEventListener('input', (e) => {
      this.trackEvent('input', e.target as HTMLElement);
    });

    // 페이지 변경 추적
    window.addEventListener('popstate', () => {
      this.trackEvent('navigation', document.body);
    });

    // 성능 모니터링
    this.setupPerformanceMonitoring();
  }

  private setupPerformanceMonitoring(): void {
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.trackEvent('performance', document.body, {
              pageLoadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              firstPaint: navEntry.responseStart - navEntry.requestStart,
            });
          }
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  public trackEvent(type: UXEvent['type'], element: HTMLElement, data?: any): void {
    if (!this.currentSession) return;

    try {
      const event: UXEvent = {
        type,
        element: this.getElementPath(element),
        timestamp: Date.now(),
        sessionId: this.currentSession.id,
        data,
      };

      this.currentSession.events.push(event);
      logger.logUXEvent(event);
    } catch (error) {
      // 이벤트 추적 중 오류 발생 시 무시하고 계속 진행
      console.warn('UX 이벤트 추적 오류:', error);
    }
  }

  private getElementPath(element: HTMLElement): string {
    const path: string[] = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      // ID가 있으면 ID 사용
      if (current.id) {
        selector += `#${current.id}`;
      } 
      // className이 문자열이고 비어있지 않으면 사용
      else if (current.className && typeof current.className === 'string' && current.className.trim()) {
        try {
          const classNames = current.className.split(' ').filter(cls => cls.trim());
          if (classNames.length > 0) {
            selector += `.${classNames.join('.')}`;
          }
        } catch (error) {
          // className 처리 중 오류 발생 시 무시하고 계속 진행
          console.warn('className 처리 오류:', error);
        }
      }
      
      path.unshift(selector);
      current = current.parentElement as HTMLElement;
    }

    return path.join(' > ');
  }

  public analyzeSession(sessionId: string): UXAnalysis {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // 히트맵 데이터 생성
    const heatmapData = this.generateHeatmapData(session);

    // 사용자 플로우 분석
    const userFlow = this.analyzeUserFlow(session);

    // 성능 메트릭 계산
    const performanceMetrics = this.calculatePerformanceMetrics(session);

    // 사용성 점수 계산
    const usabilityScore = this.calculateUsabilityScore(session);

    // 개선 권장사항 생성
    const recommendations = this.generateRecommendations(session);

    return {
      sessionId,
      heatmapData,
      userFlow,
      performanceMetrics,
      usabilityScore,
      recommendations,
    };
  }

  private generateHeatmapData(session: UXSession): { x: number; y: number; intensity: number }[] {
    const clickEvents = session.events.filter(e => e.type === 'click');
    const heatmap: Map<string, number> = new Map();

    clickEvents.forEach(event => {
      const key = `${Math.floor(Math.random() * 100)}_${Math.floor(Math.random() * 100)}`;
      heatmap.set(key, (heatmap.get(key) || 0) + 1);
    });

    return Array.from(heatmap.entries()).map(([key, intensity]) => {
      const [x, y] = key.split('_').map(Number);
      return { x, y, intensity };
    });
  }

  private analyzeUserFlow(session: UXSession): { from: string; to: string; count: number }[] {
    const navigationEvents = session.events.filter(e => e.type === 'navigation');
    const flow: Map<string, number> = new Map();

    for (let i = 0; i < navigationEvents.length - 1; i++) {
      const from = navigationEvents[i].element;
      const to = navigationEvents[i + 1].element;
      const key = `${from} -> ${to}`;
      flow.set(key, (flow.get(key) || 0) + 1);
    }

    return Array.from(flow.entries()).map(([path, count]) => {
      const [from, to] = path.split(' -> ');
      return { from, to, count };
    });
  }

  private calculatePerformanceMetrics(session: UXSession): {
    pageLoadTime: number;
    interactionTime: number;
    errorRate: number;
  } {
    const performanceEvents = session.events.filter(e => e.type === 'performance');
    const errorEvents = session.events.filter(e => e.type === 'error');

    const avgPageLoadTime = performanceEvents.length > 0
      ? performanceEvents.reduce((sum, e) => sum + (e.data?.pageLoadTime || 0), 0) / performanceEvents.length
      : 0;

    const interactionTime = session.events.length > 0
      ? (session.events[session.events.length - 1].timestamp - session.events[0].timestamp)
      : 0;

    const errorRate = session.events.length > 0
      ? (errorEvents.length / session.events.length) * 100
      : 0;

    return {
      pageLoadTime: avgPageLoadTime,
      interactionTime,
      errorRate,
    };
  }

  private calculateUsabilityScore(session: UXSession): number {
    const totalEvents = session.events.length;
    const errorEvents = session.events.filter(e => e.type === 'error').length;
    const performanceEvents = session.events.filter(e => e.type === 'performance');
    
    // 기본 점수 (100점 만점)
    let score = 100;
    
    // 에러율에 따른 감점
    score -= (errorEvents / totalEvents) * 30;
    
    // 성능에 따른 감점
    const avgLoadTime = performanceEvents.length > 0
      ? performanceEvents.reduce((sum, e) => sum + (e.data?.pageLoadTime || 0), 0) / performanceEvents.length
      : 0;
    
    if (avgLoadTime > 3000) score -= 20;
    else if (avgLoadTime > 1000) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(session: UXSession): string[] {
    const recommendations: string[] = [];
    const errorEvents = session.events.filter(e => e.type === 'error');
    const performanceEvents = session.events.filter(e => e.type === 'performance');
    
    if (errorEvents.length > 0) {
      recommendations.push('에러 발생 빈도가 높습니다. 사용자 경험 개선이 필요합니다.');
    }
    
    const avgLoadTime = performanceEvents.length > 0
      ? performanceEvents.reduce((sum, e) => sum + (e.data?.pageLoadTime || 0), 0) / performanceEvents.length
      : 0;
    
    if (avgLoadTime > 3000) {
      recommendations.push('페이지 로딩 시간이 느립니다. 성능 최적화가 필요합니다.');
    }
    
    if (session.events.length < 10) {
      recommendations.push('사용자 상호작용이 적습니다. UI/UX 개선이 필요합니다.');
    }
    
    return recommendations;
  }

  public getCurrentSession(): UXSession | null {
    return this.currentSession;
  }

  public getAllSessions(): UXSession[] {
    return Array.from(this.sessions.values());
  }

  public endSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      logger.logUXSessionEnd(this.currentSession);
    }
  }
}

export const uxAnalytics = new UXAnalyticsService(); 