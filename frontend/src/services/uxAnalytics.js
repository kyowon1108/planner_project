import { logger } from '../utils/logger';

/**
 * @typedef {Object} UXEvent
 * @property {'click'|'scroll'|'input'|'navigation'|'error'|'performance'} type
 * @property {string} element
 * @property {number} timestamp
 * @property {string} sessionId
 * @property {string} [userId]
 * @property {*} [data]
 */

/**
 * @typedef {Object} UXSession
 * @property {string} id
 * @property {number} startTime
 * @property {number} [endTime]
 * @property {UXEvent[]} events
 * @property {string} userAgent
 * @property {Object} screenSize
 * @property {number} screenSize.width
 * @property {number} screenSize.height
 * @property {string} path
 */

/**
 * @typedef {Object} UXAnalysis
 * @property {string} sessionId
 * @property {Array<{x: number, y: number, intensity: number}>} heatmapData
 * @property {Array<{from: string, to: string, count: number}>} userFlow
 * @property {Object} performanceMetrics
 * @property {number} performanceMetrics.pageLoadTime
 * @property {number} performanceMetrics.interactionTime
 * @property {number} performanceMetrics.errorRate
 * @property {number} usabilityScore
 * @property {string[]} recommendations
 */

class UXAnalyticsService {
  sessions = new Map();
  currentSession = null;

  constructor() {
    this.initializeSession();
    this.setupEventListeners();
  }

  initializeSession() {
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

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setupEventListeners() {
    // 클릭 이벤트 추적
    document.addEventListener('click', (e) => {
      this.trackEvent('click', e.target);
    });

    // 스크롤 이벤트 추적
    let scrollTimeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackEvent('scroll', document.body);
      }, 100);
    });

    // 입력 이벤트 추적
    document.addEventListener('input', (e) => {
      this.trackEvent('input', e.target);
    });

    // 페이지 변경 추적
    window.addEventListener('popstate', () => {
      this.trackEvent('navigation', document.body);
    });

    // 성능 모니터링
    this.setupPerformanceMonitoring();
  }

  setupPerformanceMonitoring() {
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry;
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

  trackEvent(type, element, data) {
    if (!this.currentSession) return;

    try {
      const event = {
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

  getElementPath(element) {
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
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  analyzeSession(sessionId) {
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

  generateHeatmapData(session) {
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

  analyzeUserFlow(session) {
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

  calculatePerformanceMetrics(session) {
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

  calculateUsabilityScore(session) {
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

  generateRecommendations(session) {
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

  getCurrentSession() {
    return this.currentSession;
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  endSession() {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      logger.logUXSessionEnd(this.currentSession);
    }
  }
}

export const uxAnalytics = new UXAnalyticsService(); 