import re
from typing import List, Dict, Any, Optional
from collections import Counter

class AIService:
    def __init__(self):
        self.common_tags = [
            "회의", "개발", "디자인", "마케팅", "기획", "테스트", "배포", "문서화",
            "리뷰", "버그수정", "기능추가", "최적화", "보안", "백업", "모니터링",
            "데이터분석", "사용자테스트", "프로토타입", "최종검토", "발표",
            "교육", "훈련", "온보딩", "문서작성", "코드리뷰", "QA", "테스트케이스",
            "API", "데이터베이스", "프론트엔드", "백엔드", "모바일", "웹", "앱",
            "UI/UX", "사용자경험", "접근성", "성능", "확장성", "유지보수"
        ]
        
        # 할일 추천을 위한 키워드 매핑
        self.todo_keywords = {
            "회의": ["회의록 작성", "참석자 명단 확인", "회의실 예약", "안건 준비"],
            "개발": ["코드 작성", "단위 테스트", "코드 리뷰", "문서화"],
            "디자인": ["디자인 가이드 작성", "프로토타입 제작", "사용자 피드백 수집"],
            "마케팅": ["마케팅 전략 수립", "콘텐츠 제작", "성과 분석"],
            "기획": ["요구사항 분석", "기능 명세서 작성", "와이어프레임 제작"],
            "테스트": ["테스트 케이스 작성", "테스트 실행", "버그 리포트 작성"],
            "배포": ["배포 계획 수립", "롤백 계획 준비", "모니터링 설정"],
            "문서화": ["API 문서 작성", "사용자 매뉴얼 작성", "개발 가이드 작성"],
            "리뷰": ["코드 리뷰", "디자인 리뷰", "문서 리뷰"],
            "버그수정": ["버그 재현", "원인 분석", "수정 테스트"],
            "기능추가": ["요구사항 분석", "설계", "구현", "테스트"],
            "최적화": ["성능 분석", "병목 지점 파악", "개선 방안 수립"],
            "보안": ["보안 검토", "취약점 분석", "보안 패치 적용"],
            "백업": ["백업 계획 수립", "백업 실행", "복구 테스트"],
            "모니터링": ["모니터링 도구 설정", "알림 설정", "대시보드 구성"],
            "데이터분석": ["데이터 수집", "데이터 정제", "분석 리포트 작성"],
            "사용자테스트": ["테스트 계획 수립", "참가자 모집", "테스트 실행"],
            "프로토타입": ["와이어프레임 제작", "프로토타입 제작", "사용자 피드백 수집"],
            "최종검토": ["전체 기능 검토", "품질 검사", "최종 승인"],
            "발표": ["발표 자료 준비", "리허설", "발표 실행"],
            "교육": ["교육 자료 준비", "교육 일정 수립", "교육 실행"],
            "훈련": ["훈련 계획 수립", "훈련 실행", "훈련 결과 평가"],
            "온보딩": ["온보딩 가이드 작성", "멘토 배정", "진행 상황 체크"],
            "문서작성": ["문서 구조 설계", "내용 작성", "검토 및 수정"],
            "코드리뷰": ["코드 분석", "개선 사항 제안", "리뷰 결과 정리"],
            "QA": ["테스트 계획 수립", "테스트 실행", "결과 분석"],
            "테스트케이스": ["테스트 시나리오 작성", "테스트 데이터 준비", "테스트 실행"],
            "API": ["API 설계", "API 문서 작성", "API 테스트"],
            "데이터베이스": ["DB 설계", "스키마 작성", "데이터 마이그레이션"],
            "프론트엔드": ["UI 컴포넌트 개발", "사용자 인터페이스 구현", "반응형 디자인"],
            "백엔드": ["서버 로직 구현", "API 개발", "데이터베이스 연동"],
            "모바일": ["모바일 앱 개발", "앱 스토어 등록", "사용자 피드백 수집"],
            "웹": ["웹사이트 개발", "SEO 최적화", "웹 접근성 개선"],
            "앱": ["앱 기획", "앱 개발", "앱 스토어 등록"],
            "UI/UX": ["사용자 인터페이스 설계", "사용자 경험 개선", "프로토타입 제작"],
            "사용자경험": ["사용자 조사", "사용자 여정 맵 작성", "개선 방안 수립"],
            "접근성": ["접근성 가이드라인 검토", "접근성 테스트", "개선 사항 적용"],
            "성능": ["성능 분석", "병목 지점 파악", "성능 최적화"],
            "확장성": ["확장성 분석", "아키텍처 개선", "부하 테스트"],
            "유지보수": ["코드 리팩토링", "문서 업데이트", "버전 관리"]
        }

    def extract_keywords(self, text: str) -> List[str]:
        """텍스트에서 키워드를 추출합니다."""
        if not text:
            return []
        
        # 간단한 키워드 추출 (한글 단어 + 영문 단어)
        korean_keywords = re.findall(r'[가-힣]{2,}', text)
        english_keywords = re.findall(r'\b[a-zA-Z]{2,}\b', text.lower())
        
        # 불용어 제거
        stop_words = {'이', '가', '을', '를', '의', '에', '로', '으로', '와', '과', '도', '만', '은', '는', '이', '그', '저', '우리', '그것', '이것', '저것', '무엇', '어떤', '어떻게', '언제', '어디서', '왜', '어떻게', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        
        keywords = []
        for keyword in korean_keywords + english_keywords:
            if len(keyword) > 1 and keyword not in stop_words:
                keywords.append(keyword)
        
        return keywords

    def recommend_tags(self, content: str, existing_tags: Optional[List[str]] = None) -> List[str]:
        """게시글 내용을 기반으로 태그를 추천합니다."""
        if not content:
            return []
        
        # 키워드 추출
        keywords = self.extract_keywords(content)
        
        # 간단한 키워드 매칭 기반 추천
        recommended_tags = []
        existing_tags_list = existing_tags or []
        
        # 1. 키워드 기반 추천
        for keyword in keywords:
            for tag in self.common_tags:
                if keyword in tag or tag in keyword:
                    if tag not in recommended_tags and tag not in existing_tags_list:
                        recommended_tags.append(tag)
                        if len(recommended_tags) >= 5:
                            break
            if len(recommended_tags) >= 5:
                break
        
        # 2. 내용 기반 추천
        content_lower = content.lower()
        for tag in self.common_tags:
            if tag not in recommended_tags and tag not in existing_tags_list:
                if any(word in content_lower for word in tag.split()):
                    recommended_tags.append(tag)
                    if len(recommended_tags) >= 8:
                        break
        
        return recommended_tags[:8]  # 최대 8개 태그 추천

    def recommend_todos_from_planner(self, planner_description: str, existing_todos: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """플래너 설명을 기반으로 할일을 추천합니다."""
        if not planner_description:
            return []
        
        # 키워드 추출
        keywords = self.extract_keywords(planner_description)
        
        recommended_todos = []
        existing_todos_list = existing_todos or []
        existing_todo_titles = [todo.lower() for todo in existing_todos_list]
        added_todo_titles = set()  # 중복 방지를 위한 set
        
        # 키워드 기반 할일 추천
        for keyword in keywords:
            for category, todos in self.todo_keywords.items():
                if keyword in category or category in keyword:
                    for todo in todos:
                        if todo.lower() not in existing_todo_titles and todo.lower() not in added_todo_titles:
                            recommended_todos.append({
                                "title": todo,
                                "description": f"플래너 '{category}' 관련 작업",
                                "priority": self._get_priority_for_todo(todo),
                                "category": category
                            })
                            added_todo_titles.add(todo.lower())
                            if len(recommended_todos) >= 10:
                                break
                    if len(recommended_todos) >= 10:
                        break
            if len(recommended_todos) >= 10:
                break
        
        # 내용 분석 기반 추가 추천 (중복되지 않는 것만)
        description_lower = planner_description.lower()
        for category, todos in self.todo_keywords.items():
            if category in description_lower:
                for todo in todos:
                    if todo.lower() not in existing_todo_titles and todo.lower() not in added_todo_titles:
                        recommended_todos.append({
                            "title": todo,
                            "description": f"플래너 '{category}' 관련 작업",
                            "priority": self._get_priority_for_todo(todo),
                            "category": category
                        })
                        added_todo_titles.add(todo.lower())
                        if len(recommended_todos) >= 15:
                            break
                if len(recommended_todos) >= 15:
                    break
        
        return recommended_todos[:15]  # 최대 15개 할일 추천

    def _get_priority_for_todo(self, todo_title: str) -> str:
        """할일 제목을 기반으로 우선순위를 추정합니다."""
        high_priority_keywords = ["긴급", "중요", "핵심", "필수", "마감", "데드라인", "배포", "보안", "버그"]
        medium_priority_keywords = ["개발", "구현", "테스트", "리뷰", "문서화", "분석"]
        
        todo_lower = todo_title.lower()
        
        for keyword in high_priority_keywords:
            if keyword in todo_lower:
                return "high"
        
        for keyword in medium_priority_keywords:
            if keyword in todo_lower:
                return "medium"
        
        return "low"

    def analyze_content_sentiment(self, content: str) -> Dict[str, Any]:
        """내용의 감정과 주제를 분석합니다."""
        if not content:
            return {"sentiment": "neutral", "topics": [], "confidence": 0.0}
        
        # 간단한 감정 분석 (긍정/부정/중립 키워드 기반)
        positive_words = ["성공", "완료", "완벽", "훌륭", "좋", "개선", "향상", "진전", "달성"]
        negative_words = ["실패", "오류", "문제", "실패", "지연", "취소", "중단", "버그", "오류"]
        
        content_lower = content.lower()
        positive_count = sum(1 for word in positive_words if word in content_lower)
        negative_count = sum(1 for word in negative_words if word in content_lower)
        
        if positive_count > negative_count:
            sentiment = "positive"
        elif negative_count > positive_count:
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        # 주제 추출
        topics = self.extract_keywords(content)[:5]
        
        return {
            "sentiment": sentiment,
            "topics": topics,
            "confidence": min(1.0, (positive_count + negative_count) / 10.0)
        }

# 전역 AI 서비스 인스턴스
ai_service = AIService() 