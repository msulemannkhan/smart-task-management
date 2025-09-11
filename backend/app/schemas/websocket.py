"""
WebSocket-related request and response schemas.
Handles validation and serialization for WebSocket operations.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid

from app.exceptions.base import ValidationError


class WebSocketMessage(BaseModel):
    """Schema for incoming WebSocket messages"""
    type: str = Field(..., description="Message type")
    data: Dict[str, Any] = Field(default_factory=dict, description="Message data")
    timestamp: Optional[datetime] = Field(None, description="Message timestamp")

    @field_validator('type')
    @classmethod
    def validate_type(cls, v: str) -> str:
        allowed_types = ['ping', 'pong', 'task_update', 'subscribe', 'unsubscribe', 'heartbeat']
        if v not in allowed_types:
            raise ValidationError(f"Invalid message type: {v}. Allowed types: {allowed_types}")
        return v


class WebSocketResponse(BaseModel):
    """Schema for outgoing WebSocket responses"""
    type: str = Field(..., description="Response type")
    data: Dict[str, Any] = Field(default_factory=dict, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    success: bool = Field(default=True, description="Response success status")
    error: Optional[str] = Field(None, description="Error message if any")


class TaskEventData(BaseModel):
    """Schema for task event data in WebSocket messages"""
    task_id: str = Field(..., description="Task ID")
    event_type: str = Field(..., description="Type of task event")
    user_id: str = Field(..., description="User who triggered the event")
    data: Dict[str, Any] = Field(default_factory=dict, description="Event-specific data")
    project_id: Optional[str] = Field(None, description="Project ID if applicable")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Event timestamp")

    @field_validator('event_type')
    @classmethod
    def validate_event_type(cls, v: str) -> str:
        allowed_events = [
            'task_created', 'task_updated', 'task_deleted', 'task_completed',
            'task_assigned', 'task_status_changed', 'task_priority_changed'
        ]
        if v not in allowed_events:
            raise ValidationError(f"Invalid event type: {v}. Allowed events: {allowed_events}")
        return v


class ConnectionStatsResponse(BaseModel):
    """Schema for WebSocket connection statistics"""
    total_connections: int = Field(..., description="Total active connections")
    unique_users: int = Field(..., description="Number of unique connected users")
    active_projects: int = Field(..., description="Number of projects with active connections")
    connections_per_user: Dict[str, int] = Field(default_factory=dict, description="Connections per user")
    uptime_seconds: Optional[float] = Field(None, description="Manager uptime in seconds")


class BroadcastTaskEventRequest(BaseModel):
    """Schema for broadcasting task events"""
    project_id: uuid.UUID = Field(..., description="Project ID to broadcast to")
    event_type: str = Field(..., description="Type of task event")
    task_id: uuid.UUID = Field(..., description="Task ID")
    task_data: Dict[str, Any] = Field(..., description="Task data to broadcast")

    @field_validator('event_type')
    @classmethod
    def validate_event_type(cls, v: str) -> str:
        allowed_events = [
            'task_created', 'task_updated', 'task_deleted', 'task_completed',
            'task_assigned', 'task_status_changed', 'task_priority_changed'
        ]
        if v not in allowed_events:
            raise ValidationError(f"Invalid event type: {v}")
        return v


class CleanupConnectionsRequest(BaseModel):
    """Schema for cleaning up stale connections"""
    max_ping_age_minutes: int = Field(
        default=5, 
        ge=1, 
        le=60, 
        description="Maximum age of last ping before considering connection stale"
    )


class CleanupConnectionsResponse(BaseModel):
    """Schema for cleanup operation response"""
    message: str = Field(..., description="Cleanup result message")
    cleaned_count: int = Field(..., description="Number of connections cleaned up")
    remaining_connections: int = Field(default=0, description="Number of connections remaining")


class WebSocketConnectionInfo(BaseModel):
    """Schema for WebSocket connection information"""
    connection_id: str = Field(..., description="Unique connection identifier")
    user_id: str = Field(..., description="Connected user ID")
    connected_at: datetime = Field(..., description="Connection timestamp")
    last_ping: Optional[datetime] = Field(None, description="Last ping timestamp")
    projects: List[str] = Field(default_factory=list, description="Subscribed project IDs")
    messages_sent: int = Field(default=0, description="Number of messages sent")
    messages_received: int = Field(default=0, description="Number of messages received")


class WebSocketMetricsResponse(BaseModel):
    """Schema for WebSocket metrics and monitoring"""
    total_connections: int
    active_connections: int
    total_messages_sent: int
    total_messages_received: int
    average_connection_duration_minutes: float
    peak_connections: int
    error_count: int
    last_error: Optional[str] = None
    uptime_hours: float


class SubscriptionRequest(BaseModel):
    """Schema for project subscription requests"""
    project_id: uuid.UUID = Field(..., description="Project ID to subscribe to")
    event_types: Optional[List[str]] = Field(
        None, 
        description="Specific event types to subscribe to (all if not specified)"
    )

    @field_validator('event_types')
    @classmethod
    def validate_event_types(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            allowed_events = [
                'task_created', 'task_updated', 'task_deleted', 'task_completed',
                'task_assigned', 'task_status_changed', 'task_priority_changed'
            ]
            for event_type in v:
                if event_type not in allowed_events:
                    raise ValidationError(f"Invalid event type: {event_type}")
        return v


class UnsubscriptionRequest(BaseModel):
    """Schema for project unsubscription requests"""
    project_id: uuid.UUID = Field(..., description="Project ID to unsubscribe from")