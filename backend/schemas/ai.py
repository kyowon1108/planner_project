from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class TagRecommendationRequest(BaseModel):
    content: str
    existing_tags: Optional[List[str]] = None

class TagRecommendationResponse(BaseModel):
    recommended_tags: List[str]

class TodoRecommendationRequest(BaseModel):
    planner_description: str
    existing_todos: Optional[List[str]] = None

class TodoRecommendationItem(BaseModel):
    title: str
    description: str
    priority: str
    category: str

class TodoRecommendationResponse(BaseModel):
    recommended_todos: List[TodoRecommendationItem]

class ContentAnalysisRequest(BaseModel):
    content: str

class ContentAnalysisResponse(BaseModel):
    sentiment: str
    topics: List[str]
    confidence: float 