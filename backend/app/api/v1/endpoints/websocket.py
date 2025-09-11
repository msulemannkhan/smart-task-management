"""
WebSocket endpoint for real-time collaboration.
Handles WebSocket connections, authentication, and real-time task updates.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from typing import Optional
import json
import logging
import uuid
import asyncio
from datetime import datetime

from app.core.auth import get_current_user_websocket, CurrentUser
from app.core.database import get_session
from app.infrastructure.websocket import manager, TaskEvent
from app.models.database import User, Task
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/{token}")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
    session: AsyncSession = Depends(get_session)
):
    """
    WebSocket endpoint for real-time collaboration.
    
    Requires JWT token in URL for authentication.
    
    Usage:
    ```javascript
    const ws = new WebSocket('ws://localhost:9200/api/v1/ws/{jwt_token}');
    ```
    
    Message format:
    ```json
    {
        "type": "ping",
        "timestamp": "2024-01-01T00:00:00Z"
    }
    ```
    
    Response format:
    ```json
    {
        "type": "pong",
        "timestamp": "2024-01-01T00:00:00Z"
    }
    ```
    """
    try:
        # Authenticate user from JWT token
        logger.info(f"WebSocket connection attempt with token: {token[:50]}...")
        user = await get_current_user_websocket(token, session)
        if not user:
            logger.error(f"WebSocket authentication failed for token: {token[:50]}...")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
            return
        logger.info(f"WebSocket authentication successful for user: {user.email}")
        
        # Accept connection and register with manager
        connection = await manager.connect(websocket, str(user.id))
        
        try:
            # Main message loop
            while True:
                try:
                    # Receive message from client with timeout
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=60.0)
                    
                    try:
                        message = json.loads(data)
                        await manager.handle_message(connection, message)
                        
                    except json.JSONDecodeError:
                        logger.error(f"Invalid JSON received from {connection.connection_id}: {data}")
                        await manager._send_to_connection(connection, {
                            "event": "error",
                            "data": {"message": "Invalid JSON format"}
                        })
                        
                    except Exception as e:
                        logger.error(f"Error handling message from {connection.connection_id}: {e}")
                        await manager._send_to_connection(connection, {
                            "event": "error", 
                            "data": {"message": "Message handling error"}
                        })
                        
                except asyncio.TimeoutError:
                    # Send ping to check if connection is still alive
                    await manager._send_to_connection(connection, {
                        "type": "ping",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    continue
                    
                except WebSocketDisconnect:
                    logger.info(f"WebSocket disconnected normally: {connection.connection_id}")
                    break
                    
                except Exception as e:
                    logger.error(f"Error in message loop for {connection.connection_id}: {e}")
                    break
        
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected normally: {connection.connection_id}")
            
        except Exception as e:
            logger.error(f"WebSocket error for {connection.connection_id}: {e}")
            
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Connection error")
        
    finally:
        # Clean up connection
        if 'connection' in locals():
            await manager.disconnect(connection)

@router.get("/ws/stats")
async def get_websocket_stats(
    current_user: User = CurrentUser
):
    """
    Get WebSocket connection statistics.
    
    Returns current connection counts and user activity.
    """
    stats = await manager.get_connection_stats()
    return stats

@router.post("/ws/broadcast/{project_id}")
async def broadcast_task_event(
    project_id: uuid.UUID,
    event_type: str,
    task_id: uuid.UUID,
    task_data: dict,
    current_user: User = CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Broadcast a task event to all users in a project.
    
    Used internally by the API to notify connected clients of task changes.
    """
    # Verify user has access to the project
    from app.models.database import Project
    from sqlmodel import select, and_
    
    stmt = select(Project).where(
        and_(
            Project.id == project_id,
            Project.owner_id == current_user.id
        )
    )
    result = await session.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )
    
    # Create and broadcast event
    event = TaskEvent(
        event_type=event_type,
        task_id=str(task_id),
        user_id=str(current_user.id),
        task_data=task_data,
        timestamp=datetime.utcnow()
    )
    
    await manager.broadcast_task_event(event, str(project_id))
    
    return {"message": "Event broadcasted successfully"}

@router.post("/ws/cleanup")
async def cleanup_stale_connections(
    max_ping_age_minutes: int = 5,
    current_user: User = CurrentUser
):
    """
    Clean up stale WebSocket connections.
    
    Used for maintenance to remove connections that haven't pinged recently.
    """
    cleaned_count = await manager.cleanup_stale_connections(max_ping_age_minutes)
    
    return {
        "message": f"Cleaned up {cleaned_count} stale connections",
        "cleaned_count": cleaned_count
    }