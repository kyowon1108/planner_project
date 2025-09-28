"""add_ai_recommendation_models_feat004

Revision ID: feat004_ai_models
Revises: 052f27b5cc26
Create Date: 2025-09-08 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = 'feat004_ai_models'
down_revision: Union[str, None] = '052f27b5cc26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # AI 프로필 필드를 users 테이블에 추가
    op.add_column('users', sa.Column('ai_productivity_score', sa.Float(), nullable=True, default=50.0))
    op.add_column('users', sa.Column('ai_peak_hours', sa.JSON(), nullable=True))
    op.add_column('users', sa.Column('ai_preferred_task_types', sa.JSON(), nullable=True))
    op.add_column('users', sa.Column('ai_work_patterns', sa.JSON(), nullable=True))
    op.add_column('users', sa.Column('ai_collaboration_style', sa.String(50), nullable=True, default='independent'))
    op.add_column('users', sa.Column('ai_last_analysis', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('ai_recommendations_enabled', sa.Boolean(), nullable=True, default=True))
    
    # recommendation_feedbacks 테이블 생성
    op.create_table('recommendation_feedbacks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('recommendation_id', sa.String(100), nullable=False),
        sa.Column('recommendation_type', sa.String(50), nullable=False),
        sa.Column('recommendation_title', sa.String(200), nullable=False),
        sa.Column('recommendation_category', sa.String(100), nullable=True),
        sa.Column('feedback_type', sa.String(20), nullable=False),
        sa.Column('usefulness_score', sa.Integer(), nullable=True),
        sa.Column('accuracy_score', sa.Integer(), nullable=True),
        sa.Column('feedback_notes', sa.Text(), nullable=True),
        sa.Column('recommendation_confidence', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_recommendation_feedbacks_id'), 'recommendation_feedbacks', ['id'], unique=False)
    op.create_index(op.f('ix_recommendation_feedbacks_user_id'), 'recommendation_feedbacks', ['user_id'], unique=False)
    op.create_index(op.f('ix_recommendation_feedbacks_recommendation_id'), 'recommendation_feedbacks', ['recommendation_id'], unique=False)
    
    # recommendation_histories 테이블 생성
    op.create_table('recommendation_histories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('recommendation_id', sa.String(100), nullable=False),
        sa.Column('recommendation_type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('priority', sa.String(20), nullable=True),
        sa.Column('estimated_time', sa.Integer(), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=False, default=0.0),
        sa.Column('reasoning', sa.Text(), nullable=True),
        sa.Column('optimal_time', sa.String(20), nullable=True),
        sa.Column('context_data', sa.JSON(), nullable=True),
        sa.Column('was_viewed', sa.Boolean(), nullable=True, default=False),
        sa.Column('was_accepted', sa.Boolean(), nullable=True, default=False),
        sa.Column('was_completed', sa.Boolean(), nullable=True, default=False),
        sa.Column('view_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('accept_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('complete_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('algorithm_version', sa.String(20), nullable=True, default='1.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_recommendation_histories_id'), 'recommendation_histories', ['id'], unique=False)
    op.create_index(op.f('ix_recommendation_histories_user_id'), 'recommendation_histories', ['user_id'], unique=False)
    op.create_index(op.f('ix_recommendation_histories_recommendation_id'), 'recommendation_histories', ['recommendation_id'], unique=True)
    
    # ai_insights 테이블 생성
    op.create_table('ai_insights',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('insight_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('daily_productivity_score', sa.Float(), nullable=True),
        sa.Column('completed_tasks', sa.Integer(), nullable=True, default=0),
        sa.Column('total_work_time', sa.Integer(), nullable=True, default=0),
        sa.Column('peak_productivity_hour', sa.Integer(), nullable=True),
        sa.Column('most_productive_categories', sa.JSON(), nullable=True),
        sa.Column('collaboration_frequency', sa.Float(), nullable=True),
        sa.Column('task_switching_frequency', sa.Float(), nullable=True),
        sa.Column('average_task_duration', sa.Float(), nullable=True),
        sa.Column('recommendations_shown', sa.Integer(), nullable=True, default=0),
        sa.Column('recommendations_accepted', sa.Integer(), nullable=True, default=0),
        sa.Column('recommendation_accuracy', sa.Float(), nullable=True),
        sa.Column('key_insights', sa.JSON(), nullable=True),
        sa.Column('improvement_suggestions', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_insights_id'), 'ai_insights', ['id'], unique=False)
    op.create_index(op.f('ix_ai_insights_user_id'), 'ai_insights', ['user_id'], unique=False)
    op.create_index(op.f('ix_ai_insights_insight_date'), 'ai_insights', ['insight_date'], unique=False)


def downgrade() -> None:
    # ai_insights 테이블 삭제
    op.drop_index(op.f('ix_ai_insights_insight_date'), table_name='ai_insights')
    op.drop_index(op.f('ix_ai_insights_user_id'), table_name='ai_insights')
    op.drop_index(op.f('ix_ai_insights_id'), table_name='ai_insights')
    op.drop_table('ai_insights')
    
    # recommendation_histories 테이블 삭제
    op.drop_index(op.f('ix_recommendation_histories_recommendation_id'), table_name='recommendation_histories')
    op.drop_index(op.f('ix_recommendation_histories_user_id'), table_name='recommendation_histories')
    op.drop_index(op.f('ix_recommendation_histories_id'), table_name='recommendation_histories')
    op.drop_table('recommendation_histories')
    
    # recommendation_feedbacks 테이블 삭제
    op.drop_index(op.f('ix_recommendation_feedbacks_recommendation_id'), table_name='recommendation_feedbacks')
    op.drop_index(op.f('ix_recommendation_feedbacks_user_id'), table_name='recommendation_feedbacks')
    op.drop_index(op.f('ix_recommendation_feedbacks_id'), table_name='recommendation_feedbacks')
    op.drop_table('recommendation_feedbacks')
    
    # users 테이블에서 AI 프로필 필드 삭제
    op.drop_column('users', 'ai_recommendations_enabled')
    op.drop_column('users', 'ai_last_analysis')
    op.drop_column('users', 'ai_collaboration_style')
    op.drop_column('users', 'ai_work_patterns')
    op.drop_column('users', 'ai_preferred_task_types')
    op.drop_column('users', 'ai_peak_hours')
    op.drop_column('users', 'ai_productivity_score')