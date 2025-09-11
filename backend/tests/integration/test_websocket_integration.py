"""
Integration tests for WebSocket real-time collaboration features.
Tests WebSocket connection, authentication, and real-time event broadcasting.
"""
import pytest
import asyncio
import json
import uuid
from typing import Dict, Any
from datetime import datetime
from websockets import connect, WebSocketException
from fastapi.testclient import TestClient
import httpx

from app.main import app
from app.infrastructure.websocket import manager, TaskEvent, WebSocketConnection
from app.models.database import User, Task, Project, Organization
from tests.conftest import test_session

# Test configuration
WEBSOCKET_URL = "ws://localhost:8001/api/v1/ws"
API_BASE_URL = "http://localhost:8001/api/v1"

class TestWebSocketConnectionManager:
    """Test the WebSocket connection manager"""
    
    @pytest.fixture(autouse=True)
    async def setup_method(self):
        """Clean up connections before each test"""
        # Clear all connections
        manager.user_connections.clear()
        manager.connections.clear() 
        manager.project_subscriptions.clear()
    
    def test_connection_manager_initialization(self):
        """Test that connection manager initializes properly"""
        assert isinstance(manager.user_connections, dict)
        assert isinstance(manager.connections, dict)
        assert isinstance(manager.project_subscriptions, dict)
    
    async def test_websocket_connection_data_structures(self):
        """Test WebSocket connection data structures"""
        from app.infrastructure.websocket import WebSocketConnection
        from unittest.mock import Mock
        
        # Create mock websocket
        mock_websocket = Mock()
        
        # Test WebSocketConnection dataclass
        connection = WebSocketConnection(
            websocket=mock_websocket,
            user_id="test-user-123",
            connection_id="conn-123",
            connected_at=datetime.utcnow(),
            last_ping=datetime.utcnow()
        )
        
        # Test to_dict method
        connection_dict = connection.to_dict()
        assert "connection_id" in connection_dict
        assert "user_id" in connection_dict
        assert "connected_at" in connection_dict
        assert "last_ping" in connection_dict
    
    async def test_task_event_data_structure(self):
        """Test TaskEvent data structure"""
        event = TaskEvent(
            event_type="task_created",
            task_id="task-123",
            user_id="user-456",
            task_data={"title": "Test Task", "status": "TODO"},
            timestamp=datetime.utcnow()
        )
        
        # Test to_dict method
        event_dict = event.to_dict()
        assert event_dict["event"] == "task_created"
        assert "data" in event_dict
        assert event_dict["data"]["task_id"] == "task-123"
        assert event_dict["data"]["user_id"] == "user-456"
        assert "timestamp" in event_dict["data"]
    
    async def test_connection_statistics(self):
        """Test connection statistics functionality"""
        stats = await manager.get_connection_stats()
        
        assert "total_connections" in stats
        assert "unique_users" in stats
        assert "active_projects" in stats
        assert "connections_per_user" in stats
        assert isinstance(stats["total_connections"], int)
        assert isinstance(stats["unique_users"], int)


class TestWebSocketAuthentication:
    """Test WebSocket authentication and security"""
    
    async def test_websocket_auth_functions(self):
        """Test WebSocket authentication helper functions"""
        from app.core.auth import verify_token_string, get_current_user_websocket
        
        # Test with invalid token
        result = await verify_token_string("invalid-token")
        assert result is None
        
        # Note: Real token testing would require Supabase setup
        # In production, we'd test with valid Supabase JWT tokens
    
    def test_websocket_endpoint_structure(self):
        """Test that WebSocket endpoint is properly structured"""
        # Test that the endpoint exists in the router
        from app.api.v1.endpoints.websocket import router
        
        # Check that router has WebSocket route
        websocket_routes = [route for route in router.routes if hasattr(route, 'path') and '/ws/' in route.path]
        assert len(websocket_routes) > 0
    
    async def test_websocket_message_handling(self):
        """Test WebSocket message handling functionality"""
        from unittest.mock import Mock, AsyncMock
        from app.infrastructure.websocket import WebSocketConnection
        
        # Create mock connection
        mock_websocket = AsyncMock()
        connection = WebSocketConnection(
            websocket=mock_websocket,
            user_id="test-user",
            connection_id="test-conn",
            connected_at=datetime.utcnow(),
            last_ping=datetime.utcnow()
        )
        
        # Test ping message
        ping_message = {"type": "ping", "timestamp": datetime.utcnow().isoformat()}
        await manager.handle_message(connection, ping_message)
        
        # Verify response was sent
        mock_websocket.send_text.assert_called()
        
        # Test project subscription message
        sub_message = {"type": "subscribe_project", "project_id": str(uuid.uuid4())}
        await manager.handle_message(connection, sub_message)
        
        # Verify subscription response
        assert mock_websocket.send_text.call_count >= 2


class TestRealTimeEventBroadcasting:
    """Test real-time event broadcasting functionality"""
    
    async def test_task_event_creation_and_broadcasting(self):
        """Test task event creation and broadcasting"""
        # Create test data
        project_id = str(uuid.uuid4())
        task_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        
        # Create TaskEvent
        event = TaskEvent(
            event_type="task_created",
            task_id=task_id,
            user_id=user_id,
            task_data={
                "title": "Test Task",
                "status": "TODO",
                "priority": "MEDIUM",
                "project_id": project_id
            },
            timestamp=datetime.utcnow()
        )
        
        # Test event structure
        event_dict = event.to_dict()
        assert event_dict["event"] == "task_created"
        assert event_dict["data"]["task_id"] == task_id
        
        # Test broadcast functionality (without actual WebSocket connections)
        try:
            await manager.broadcast_task_event(event, project_id)
            # Should not raise exception even with no connections
            assert True
        except Exception as e:
            pytest.fail(f"Broadcast should not fail with no connections: {e}")
    
    async def test_project_subscription_management(self):
        """Test project subscription management"""
        user_id = "test-user-123"
        project_id = "test-project-456"
        
        # Test subscription
        await manager.subscribe_to_project(user_id, project_id)
        assert project_id in manager.project_subscriptions
        assert user_id in manager.project_subscriptions[project_id]
        
        # Test unsubscription
        await manager.unsubscribe_from_project(user_id, project_id)
        assert project_id not in manager.project_subscriptions
    
    async def test_user_status_broadcasting(self):
        """Test user online/offline status broadcasting"""
        user_id = "test-user-789"
        
        # Test online status broadcast
        try:
            await manager._broadcast_user_status(user_id, "online")
            await manager._broadcast_user_status(user_id, "offline")
            # Should not raise exception
            assert True
        except Exception as e:
            pytest.fail(f"User status broadcast should not fail: {e}")


class TestWebSocketEndpoints:
    """Test WebSocket API endpoints"""
    
    def test_websocket_stats_endpoint(self):
        """Test WebSocket statistics endpoint"""
        # This would require authentication setup
        # For now, test endpoint structure
        from app.api.v1.endpoints.websocket import router
        
        # Check that stats endpoint exists
        stats_routes = [route for route in router.routes 
                      if hasattr(route, 'path') and route.path == '/ws/stats']
        assert len(stats_routes) > 0
    
    def test_websocket_cleanup_endpoint(self):
        """Test WebSocket cleanup endpoint"""
        from app.api.v1.endpoints.websocket import router
        
        # Check that cleanup endpoint exists
        cleanup_routes = [route for route in router.routes 
                         if hasattr(route, 'path') and '/ws/cleanup' in route.path]
        assert len(cleanup_routes) > 0
    
    def test_websocket_broadcast_endpoint(self):
        """Test WebSocket broadcast endpoint"""
        from app.api.v1.endpoints.websocket import router
        
        # Check that broadcast endpoint exists
        broadcast_routes = [route for route in router.routes 
                           if hasattr(route, 'path') and '/ws/broadcast/' in route.path]
        assert len(broadcast_routes) > 0


class TestIntegrationWithTaskAPI:
    """Test integration between WebSocket events and Task API"""
    
    async def test_task_api_event_broadcasting_structure(self):
        """Test that task API has event broadcasting structure"""
        # Import task endpoints to check for event broadcasting
        from app.api.v1.endpoints.tasks import router
        import inspect
        
        # Check that task creation function exists
        create_task_routes = [route for route in router.routes 
                             if hasattr(route, 'path') and route.path == '/']
        assert len(create_task_routes) > 0
        
        # Verify that the task endpoints import the websocket manager
        from app.api.v1.endpoints import tasks
        assert hasattr(tasks, 'manager')
        assert hasattr(tasks, 'TaskEvent')
    
    async def test_websocket_integration_imports(self):
        """Test that all necessary WebSocket components are properly imported"""
        # Test that WebSocket components can be imported without errors
        try:
            from app.infrastructure.websocket import manager, TaskEvent, WebSocketConnection
            from app.core.auth import get_current_user_websocket
            from app.api.v1.endpoints.websocket import router
            assert True
        except ImportError as e:
            pytest.fail(f"WebSocket components should be importable: {e}")


class TestWebSocketConnectionLifecycle:
    """Test WebSocket connection lifecycle management"""
    
    async def test_stale_connection_cleanup(self):
        """Test stale connection cleanup functionality"""
        # Test that cleanup doesn't fail with no connections
        cleaned_count = await manager.cleanup_stale_connections(max_ping_age_minutes=1)
        assert isinstance(cleaned_count, int)
        assert cleaned_count == 0  # No connections to clean
    
    async def test_connection_tracking(self):
        """Test connection tracking functionality"""
        # Test that user connections can be tracked
        user_id = "test-user-456"
        
        # Initially no connections
        assert user_id not in manager.user_connections
        
        # After mock subscription, project exists
        project_id = "test-project-789"
        await manager.subscribe_to_project(user_id, project_id)
        assert project_id in manager.project_subscriptions


# Integration test with real server (requires server to be running)
@pytest.mark.integration
class TestRealWebSocketConnection:
    """
    Integration tests that require a running FastAPI server.
    Run with: pytest -m integration
    """
    
    @pytest.mark.skip(reason="Requires running server and valid authentication")
    async def test_real_websocket_connection(self):
        """Test real WebSocket connection (requires running server)"""
        # This test would require:
        # 1. Running FastAPI server
        # 2. Valid Supabase JWT token
        # 3. Proper project setup
        
        # Example structure:
        # async with connect(f"{WEBSOCKET_URL}/valid-jwt-token") as websocket:
        #     # Test connection
        #     await websocket.send(json.dumps({"type": "ping"}))
        #     response = await websocket.recv()
        #     data = json.loads(response)
        #     assert data["type"] == "pong"
        pass
    
    @pytest.mark.skip(reason="Requires running server and valid authentication")
    async def test_real_task_event_broadcasting(self):
        """Test real task event broadcasting (requires running server)"""
        # This test would:
        # 1. Create WebSocket connection
        # 2. Subscribe to project
        # 3. Create task via API
        # 4. Verify WebSocket receives event
        pass


if __name__ == "__main__":
    # Run tests
    import pytest
    pytest.main([__file__, "-v"])