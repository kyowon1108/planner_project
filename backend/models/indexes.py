"""
데이터베이스 인덱스 정의
성능 최적화를 위한 인덱스들을 여기에 정의합니다.
"""

from sqlalchemy import Index
from app.models.user import User
from app.models.team import Team, TeamMember
from app.models.planner import Planner
from app.models.todo import Todo
from app.models.post import Post
from app.models.notification import Notification
from app.models.activity import Activity

# 사용자 테이블 인덱스
user_email_index = Index('idx_users_email', User.email)
user_created_at_index = Index('idx_users_created_at', User.created_at)

# 팀 테이블 인덱스
team_created_at_index = Index('idx_teams_created_at', Team.created_at)
team_creator_id_index = Index('idx_teams_creator_id', Team.creator_id)

# 팀 멤버 테이블 인덱스
team_member_user_id_index = Index('idx_team_members_user_id', TeamMember.user_id)
team_member_team_id_index = Index('idx_team_members_team_id', TeamMember.team_id)
team_member_user_team_index = Index('idx_team_members_user_team', TeamMember.user_id, TeamMember.team_id)

# 플래너 테이블 인덱스
planner_team_id_index = Index('idx_planners_team_id', Planner.team_id)
planner_creator_id_index = Index('idx_planners_creator_id', Planner.creator_id)
planner_created_at_index = Index('idx_planners_created_at', Planner.created_at)
planner_team_created_index = Index('idx_planners_team_created', Planner.team_id, Planner.created_at)

# 할일 테이블 인덱스
todo_planner_id_index = Index('idx_todos_planner_id', Todo.planner_id)
todo_created_by_index = Index('idx_todos_created_by', Todo.created_by)
todo_status_index = Index('idx_todos_status', Todo.status)
todo_due_date_index = Index('idx_todos_due_date', Todo.due_date)
todo_priority_index = Index('idx_todos_priority', Todo.priority)
todo_planner_status_index = Index('idx_todos_planner_status', Todo.planner_id, Todo.status)
todo_created_by_status_index = Index('idx_todos_created_by_status', Todo.created_by, Todo.status)

# 게시글 테이블 인덱스
post_author_id_index = Index('idx_posts_author_id', Post.author_id)
post_team_id_index = Index('idx_posts_team_id', Post.team_id)
post_created_at_index = Index('idx_posts_created_at', Post.created_at)
post_team_created_index = Index('idx_posts_team_created', Post.team_id, Post.created_at)

# 알림 테이블 인덱스
notification_user_id_index = Index('idx_notifications_user_id', Notification.user_id)
notification_created_at_index = Index('idx_notifications_created_at', Notification.created_at)
notification_user_created_index = Index('idx_notifications_user_created', Notification.user_id, Notification.created_at)
notification_is_read_index = Index('idx_notifications_is_read', Notification.is_read)

# 활동 테이블 인덱스
activity_user_id_index = Index('idx_activities_user_id', Activity.user_id)
activity_created_at_index = Index('idx_activities_created_at', Activity.created_at)
activity_user_created_index = Index('idx_activities_user_created', Activity.user_id, Activity.created_at) 