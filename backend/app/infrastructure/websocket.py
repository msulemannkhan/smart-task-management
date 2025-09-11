"""
WebSocket connection management and real-time event broadcasting.
Handles WebSocket connections, authentication, and real-time task updates.
"""
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import asyncio
import json
import logging
import uuid
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

@dataclass
class WebSocketConnection:
    """Represents an active WebSocket connection"""
    websocket: WebSocket
    user_id: str
    connection_id: str
    connected_at: datetime
    last_ping: datetime

    def __hash__(self):
        """Make the connection hashable using connection_id"""
        return hash(self.connection_id)
    
    def __eq__(self, other):
        """Define equality based on connection_id"""
        if not isinstance(other, WebSocketConnection):
            return False
        return self.connection_id == other.connection_id
    
    def __ne__(self, other):
        """Define inequality based on connection_id"""
        return not self.__eq__(other)

    def to_dict(self) -> Dict[str, Any]:
        """Convert connection to dictionary for serialization"""
        return {
            "connection_id": self.connection_id,
            "user_id": self.user_id,
            "connected_at": self.connected_at.isoformat(),
            "last_ping": self.last_ping.isoformat()
        }

@dataclass
class TaskEvent:
    """Represents a task-related event for real-time broadcasting"""
    event_type: str  # 'task_created', 'task_updated', 'task_completed', etc.
    task_id: str
    user_id: str  # User who triggered the event
    task_data: Dict[str, Any]
    timestamp: datetime

    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary for broadcasting"""
        return {
            "event": self.event_type,
            "data": {
                "task_id": self.task_id,
                "user_id": self.user_id,
                "task_data": self.task_data,
                "timestamp": self.timestamp.isoformat()
            }
        }

class ConnectionManager:
    """Manages WebSocket connections and real-time broadcasting"""
    
    def __init__(self):
        # Dictionary: user_id -> List of connections
        self.user_connections: Dict[str, List[WebSocketConnection]] = {}
        # Dictionary: connection_id -> connection
        self.connections: Dict[str, WebSocketConnection] = {}
        # Dictionary: project_id -> Set of user_ids (for project-based broadcasting)
        self.project_subscriptions: Dict[str, Set[str]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str) -> WebSocketConnection:
        """Accept and register a new WebSocket connection"""
        try:
            await websocket.accept()
        except Exception as e:
            logger.error(f"Failed to accept WebSocket connection for user {user_id}: {e}")
            raise
        
        connection_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        connection = WebSocketConnection(
            websocket=websocket,
            user_id=user_id,
            connection_id=connection_id,
            connected_at=now,
            last_ping=now
        )
        
        # Register connection
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        
        self.user_connections[user_id].append(connection)
        self.connections[connection_id] = connection
        
        # Send connection confirmation
        await self._send_to_connection(connection, {
            "event": "connected",
            "data": {
                "connection_id": connection_id,
                "user_id": user_id,
                "timestamp": now.isoformat()
            }
        })
        
        logger.info(f"WebSocket connected: user_id={user_id}, connection_id={connection_id}")
        
        # Broadcast user online status
        await self._broadcast_user_status(user_id, "online")
        
        return connection
    
    async def disconnect(self, connection: WebSocketConnection):
        """Remove a WebSocket connection"""
        user_id = connection.user_id
        connection_id = connection.connection_id
        
        # Remove from tracking
        if user_id in self.user_connections:
            if connection in self.user_connections[user_id]:
                self.user_connections[user_id].remove(connection)
            
            # Clean up empty user entry
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
                # User is now offline
                await self._broadcast_user_status(user_id, "offline")
        
        if connection_id in self.connections:
            del self.connections[connection_id]
        
        logger.info(f"WebSocket disconnected: user_id={user_id}, connection_id={connection_id}")
    
    async def _send_to_connection(self, connection: WebSocketConnection, message: Dict[str, Any]) -> bool:
        """Send message to a specific connection"""
        try:
            # Check if connection is still open
            if connection.websocket.client_state.name != 'CONNECTED':
                logger.warning(f"Connection {connection.connection_id} is not connected, removing it")
                await self.disconnect(connection)
                return False
                
            await connection.websocket.send_text(json.dumps(message))
            return True
        except Exception as e:
            logger.error(f"Failed to send message to connection {connection.connection_id}: {e}")
            # Mark connection as dead and clean it up
            await self.disconnect(connection)
            return False
    
    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send message to all connections of a specific user"""
        if user_id not in self.user_connections:
            return
        
        dead_connections = []
        
        for connection in self.user_connections[user_id]:
            success = await self._send_to_connection(connection, message)
            if not success:
                dead_connections.append(connection)
        
        # Clean up dead connections
        for connection in dead_connections:
            await self.disconnect(connection)
    
    async def broadcast_to_project(self, project_id: str, message: Dict[str, Any], exclude_user_id: Optional[str] = None):
        """Broadcast message to all users subscribed to a project"""
        if project_id not in self.project_subscriptions:
            return
        
        for user_id in self.project_subscriptions[project_id]:
            if exclude_user_id and user_id == exclude_user_id:
                continue
            await self.send_to_user(user_id, message)
    
    async def subscribe_to_project(self, user_id: str, project_id: str):
        """Subscribe user to project-based notifications"""
        if project_id not in self.project_subscriptions:
            self.project_subscriptions[project_id] = set()
        
        self.project_subscriptions[project_id].add(user_id)
        logger.info(f"User {user_id} subscribed to project {project_id}")
    
    async def unsubscribe_from_project(self, user_id: str, project_id: str):
        """Unsubscribe user from project notifications"""
        if project_id in self.project_subscriptions:
            self.project_subscriptions[project_id].discard(user_id)
            
            # Clean up empty project subscriptions
            if not self.project_subscriptions[project_id]:
                del self.project_subscriptions[project_id]
        
        logger.info(f"User {user_id} unsubscribed from project {project_id}")
    
    async def broadcast_task_event(self, event: TaskEvent, project_id: str):
        """Broadcast a task event to all users in the project"""
        message = event.to_dict()
        
        # Add project context
        message["data"]["project_id"] = project_id
        
        await self.broadcast_to_project(
            project_id, 
            message, 
            exclude_user_id=event.user_id  # Don't send back to the user who triggered it
        )
        
        logger.info(f"Broadcasted {event.event_type} for task {event.task_id} to project {project_id}")
    
    async def _broadcast_user_status(self, user_id: str, status: str):
        """Broadcast user online/offline status to relevant users"""
        message = {
            "event": "user_status",
            "data": {
                "user_id": user_id,
                "status": status,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        # Find all projects this user is part of and broadcast to those users
        for project_id, users in self.project_subscriptions.items():
            if user_id in users:
                await self.broadcast_to_project(project_id, message, exclude_user_id=user_id)
    
    async def handle_message(self, connection: WebSocketConnection, data: Dict[str, Any]):
        """Handle incoming WebSocket messages"""
        message_type = data.get("type", "")
        
        if message_type == "ping":
            # Update last ping time
            connection.last_ping = datetime.utcnow()
            await self._send_to_connection(connection, {
                "type": "pong",
                "timestamp": datetime.utcnow().isoformat()
            })
            
        elif message_type == "subscribe_project":
            project_id = data.get("project_id")
            if project_id:
                await self.subscribe_to_project(connection.user_id, project_id)
                await self._send_to_connection(connection, {
                    "type": "subscribed",
                    "data": {"project_id": project_id}
                })
        
        elif message_type == "unsubscribe_project":
            project_id = data.get("project_id")
            if project_id:
                await self.unsubscribe_from_project(connection.user_id, project_id)
                await self._send_to_connection(connection, {
                    "type": "unsubscribed", 
                    "data": {"project_id": project_id}
                })
        
        else:
            logger.warning(f"Unknown message type: {message_type}")
    
    async def get_connection_stats(self) -> Dict[str, Any]:
        """Get statistics about current connections"""
        total_connections = len(self.connections)
        unique_users = len(self.user_connections)
        active_projects = len(self.project_subscriptions)
        
        return {
            "total_connections": total_connections,
            "unique_users": unique_users,
            "active_projects": active_projects,
            "connections_per_user": {
                user_id: len(connections) 
                for user_id, connections in self.user_connections.items()
            }
        }
    
    async def cleanup_stale_connections(self, max_ping_age_minutes: int = 5):
        """Clean up connections that haven't pinged recently"""
        cutoff_time = datetime.utcnow().timestamp() - (max_ping_age_minutes * 60)
        stale_connections = []
        
        for connection in self.connections.values():
            if connection.last_ping.timestamp() < cutoff_time:
                stale_connections.append(connection)
        
        for connection in stale_connections:
            logger.info(f"Cleaning up stale connection: {connection.connection_id}")
            await self.disconnect(connection)
        
        return len(stale_connections)

# Global connection manager instance
manager = ConnectionManager()