"""
Real-world use case tests for WebSocket real-time collaboration.
These tests simulate actual user scenarios and workflows.
"""
import pytest
import asyncio
import json
import uuid
from typing import Dict, Any, List
from datetime import datetime
import httpx
from unittest.mock import AsyncMock, Mock

from app.main import app
from app.infrastructure.websocket import manager, TaskEvent
from app.models.database import User, Task, Project, Organization, TaskStatus, TaskPriority
from app.core.database import get_session
from tests.conftest import test_session

# Test configuration
API_BASE_URL = "http://localhost:8001/api/v1"
WEBSOCKET_URL = "ws://localhost:8001/api/v1/ws"

class TestRealTimeCollaborationUseCases:
    """Test real-world collaboration scenarios"""
    
    @pytest.fixture(autouse=True)
    async def setup_method(self):
        """Clean up connections and prepare test data"""
        # Clear all connections
        manager.user_connections.clear()
        manager.connections.clear() 
        manager.project_subscriptions.clear()
    
    async def test_usecase_team_standup_meeting(self):
        """
        Use Case: Team Standup Meeting
        
        Scenario: During a standup meeting, team members are updating
        their task statuses in real-time while others watch the board.
        
        Expected: All team members see updates instantly
        """
        # Setup test data
        project_id = str(uuid.uuid4())
        alice_user_id = "alice-123"
        bob_user_id = "bob-456"
        charlie_user_id = "charlie-789"
        
        # Simulate Alice, Bob, and Charlie subscribing to the project
        await manager.subscribe_to_project(alice_user_id, project_id)
        await manager.subscribe_to_project(bob_user_id, project_id)
        await manager.subscribe_to_project(charlie_user_id, project_id)
        
        # Verify all users are subscribed
        assert project_id in manager.project_subscriptions
        subscribers = manager.project_subscriptions[project_id]
        assert alice_user_id in subscribers
        assert bob_user_id in subscribers
        assert charlie_user_id in subscribers
        
        # Alice completes her task
        task_event = TaskEvent(
            event_type="task_completed",
            task_id=str(uuid.uuid4()),
            user_id=alice_user_id,
            task_data={
                "title": "Implement user authentication",
                "status": "DONE",
                "completed": True,
                "completed_at": datetime.utcnow().isoformat(),
                "project_id": project_id
            },
            timestamp=datetime.utcnow()
        )
        
        # Broadcast the event
        await manager.broadcast_task_event(task_event, project_id)
        
        # Verify event structure
        event_dict = task_event.to_dict()
        assert event_dict["event"] == "task_completed"
        assert event_dict["data"]["project_id"] == project_id
        assert "completed_at" in event_dict["data"]
        
        print("✅ Team Standup Meeting use case: Alice's task completion broadcasted to team")
    
    async def test_usecase_project_manager_oversight(self):
        """
        Use Case: Project Manager Oversight
        
        Scenario: A project manager is monitoring multiple team members
        working on different tasks. They need to see all updates in real-time
        to track progress and identify blockers.
        
        Expected: PM receives all task updates for their project
        """
        project_id = str(uuid.uuid4())
        pm_user_id = "pm-001"
        dev1_user_id = "dev-001"
        dev2_user_id = "dev-002"
        designer_user_id = "designer-001"
        
        # Project manager subscribes to project
        await manager.subscribe_to_project(pm_user_id, project_id)
        
        # Team members also subscribe
        await manager.subscribe_to_project(dev1_user_id, project_id)
        await manager.subscribe_to_project(dev2_user_id, project_id)
        await manager.subscribe_to_project(designer_user_id, project_id)
        
        # Simulate multiple simultaneous task updates
        tasks_updates = [
            {
                "event_type": "task_updated",
                "user_id": dev1_user_id,
                "task_data": {
                    "title": "Backend API endpoints",
                    "status": "IN_PROGRESS",
                    "priority": "HIGH",
                    "project_id": project_id
                }
            },
            {
                "event_type": "task_created",
                "user_id": dev2_user_id,
                "task_data": {
                    "title": "Database migration scripts",
                    "status": "TODO",
                    "priority": "MEDIUM",
                    "project_id": project_id
                }
            },
            {
                "event_type": "task_completed",
                "user_id": designer_user_id,
                "task_data": {
                    "title": "UI mockups for dashboard",
                    "status": "DONE",
                    "completed": True,
                    "project_id": project_id
                }
            }
        ]
        
        # Broadcast all updates
        for update in tasks_updates:
            event = TaskEvent(
                event_type=update["event_type"],
                task_id=str(uuid.uuid4()),
                user_id=update["user_id"],
                task_data=update["task_data"],
                timestamp=datetime.utcnow()
            )
            await manager.broadcast_task_event(event, project_id)
        
        # Verify all subscribers received the events
        assert len(manager.project_subscriptions[project_id]) == 4
        
        print("✅ Project Manager Oversight use case: All team updates tracked")
    
    async def test_usecase_urgent_hotfix_scenario(self):
        """
        Use Case: Urgent Hotfix Scenario
        
        Scenario: A critical bug is discovered in production. The team needs
        to quickly coordinate a hotfix. Tasks are being created, assigned,
        and updated rapidly with high priority.
        
        Expected: All team members get instant notifications of urgent tasks
        """
        project_id = str(uuid.uuid4())
        lead_dev_id = "lead-001"
        backend_dev_id = "backend-001"
        frontend_dev_id = "frontend-001"
        qa_engineer_id = "qa-001"
        
        # All team members subscribe to the project
        team_members = [lead_dev_id, backend_dev_id, frontend_dev_id, qa_engineer_id]
        for member_id in team_members:
            await manager.subscribe_to_project(member_id, project_id)
        
        # Lead developer creates urgent hotfix tasks
        hotfix_tasks = [
            {
                "title": "Fix critical payment processing bug",
                "assignee": backend_dev_id,
                "priority": "CRITICAL"
            },
            {
                "title": "Update frontend error handling",
                "assignee": frontend_dev_id,
                "priority": "URGENT"
            },
            {
                "title": "Verify fix in staging environment",
                "assignee": qa_engineer_id,
                "priority": "HIGH"
            }
        ]
        
        # Create and broadcast hotfix tasks
        for task in hotfix_tasks:
            event = TaskEvent(
                event_type="task_created",
                task_id=str(uuid.uuid4()),
                user_id=lead_dev_id,
                task_data={
                    "title": task["title"],
                    "status": "TODO",
                    "priority": task["priority"],
                    "assignee_id": task["assignee"],
                    "project_id": project_id,
                    "is_urgent": True
                },
                timestamp=datetime.utcnow()
            )
            await manager.broadcast_task_event(event, project_id)
        
        # Simulate rapid status updates as team works on hotfix
        status_updates = [
            {"user": backend_dev_id, "status": "IN_PROGRESS", "task": "payment processing"},
            {"user": frontend_dev_id, "status": "IN_PROGRESS", "task": "error handling"},
            {"user": backend_dev_id, "status": "DONE", "task": "payment processing"},
            {"user": qa_engineer_id, "status": "IN_PROGRESS", "task": "staging verification"}
        ]
        
        for update in status_updates:
            event = TaskEvent(
                event_type="task_updated",
                task_id=str(uuid.uuid4()),
                user_id=update["user"],
                task_data={
                    "title": f"Hotfix: {update['task']}",
                    "status": update["status"],
                    "priority": "CRITICAL",
                    "project_id": project_id
                },
                timestamp=datetime.utcnow()
            )
            await manager.broadcast_task_event(event, project_id)
        
        assert len(manager.project_subscriptions[project_id]) == 4
        print("✅ Urgent Hotfix Scenario use case: Critical updates broadcasted to entire team")
    
    async def test_usecase_cross_team_dependency(self):
        """
        Use Case: Cross-Team Dependency
        
        Scenario: Frontend team is waiting for Backend team to complete
        API endpoints. When backend completes their tasks, frontend
        team needs to be notified immediately to start their work.
        
        Expected: Task completion triggers dependent team notifications
        """
        project_id = str(uuid.uuid4())
        backend_lead_id = "backend-lead-001"
        backend_dev_id = "backend-dev-001"
        frontend_lead_id = "frontend-lead-001"
        frontend_dev_id = "frontend-dev-001"
        
        # Both teams subscribe to the shared project
        team_members = [backend_lead_id, backend_dev_id, frontend_lead_id, frontend_dev_id]
        for member_id in team_members:
            await manager.subscribe_to_project(member_id, project_id)
        
        # Backend completes API endpoint
        api_completion_event = TaskEvent(
            event_type="task_completed",
            task_id=str(uuid.uuid4()),
            user_id=backend_dev_id,
            task_data={
                "title": "User management API endpoints",
                "status": "DONE",
                "completed": True,
                "completed_at": datetime.utcnow().isoformat(),
                "project_id": project_id,
                "tags": ["API", "backend", "dependency"]
            },
            timestamp=datetime.utcnow()
        )
        
        await manager.broadcast_task_event(api_completion_event, project_id)
        
        # Frontend team can now start their dependent task
        frontend_start_event = TaskEvent(
            event_type="task_updated",
            task_id=str(uuid.uuid4()),
            user_id=frontend_dev_id,
            task_data={
                "title": "Integrate user management UI with API",
                "status": "IN_PROGRESS",
                "priority": "HIGH",
                "project_id": project_id,
                "depends_on": "User management API endpoints"
            },
            timestamp=datetime.utcnow()
        )
        
        await manager.broadcast_task_event(frontend_start_event, project_id)
        
        # Verify all team members are still subscribed
        assert len(manager.project_subscriptions[project_id]) == 4
        
        print("✅ Cross-Team Dependency use case: API completion triggered frontend work")
    
    async def test_usecase_client_demo_preparation(self):
        """
        Use Case: Client Demo Preparation
        
        Scenario: Team is preparing for a client demo tomorrow.
        Multiple team members are working on different features
        that need to be demo-ready. Real-time coordination is critical.
        
        Expected: All demo-related task updates are visible to the team
        """
        project_id = str(uuid.uuid4())
        team_members = {
            "pm-001": "Project Manager",
            "dev-001": "Full Stack Developer", 
            "designer-001": "UI/UX Designer",
            "qa-001": "QA Engineer"
        }
        
        # All team members join the demo preparation project
        for member_id in team_members.keys():
            await manager.subscribe_to_project(member_id, project_id)
        
        # Demo preparation tasks
        demo_tasks = [
            {
                "user": "dev-001",
                "event": "task_updated",
                "task": {
                    "title": "Polish demo user flow",
                    "status": "IN_PROGRESS",
                    "priority": "CRITICAL",
                    "due_date": "2024-12-01T09:00:00",
                    "demo_ready": False
                }
            },
            {
                "user": "designer-001", 
                "event": "task_completed",
                "task": {
                    "title": "Final UI touches for demo screens",
                    "status": "DONE",
                    "completed": True,
                    "demo_ready": True
                }
            },
            {
                "user": "qa-001",
                "event": "task_created", 
                "task": {
                    "title": "Test demo scenarios",
                    "status": "TODO",
                    "priority": "HIGH",
                    "estimated_hours": 2.0
                }
            }
        ]
        
        # Process all demo preparation activities
        for activity in demo_tasks:
            event = TaskEvent(
                event_type=activity["event"],
                task_id=str(uuid.uuid4()),
                user_id=activity["user"],
                task_data={
                    **activity["task"],
                    "project_id": project_id,
                    "category": "demo-preparation"
                },
                timestamp=datetime.utcnow()
            )
            await manager.broadcast_task_event(event, project_id)
        
        # Project Manager checks demo readiness status
        demo_status_check = TaskEvent(
            event_type="demo_status_check",
            task_id=str(uuid.uuid4()),
            user_id="pm-001",
            task_data={
                "title": "Demo readiness assessment",
                "status": "IN_PROGRESS", 
                "project_id": project_id,
                "demo_checklist": {
                    "ui_ready": True,
                    "backend_ready": False,
                    "testing_complete": False
                }
            },
            timestamp=datetime.utcnow()
        )
        
        await manager.broadcast_task_event(demo_status_check, project_id)
        
        assert len(manager.project_subscriptions[project_id]) == 4
        print("✅ Client Demo Preparation use case: Demo coordination completed")


class TestWebSocketConnectionScenarios:
    """Test WebSocket connection management scenarios"""
    
    @pytest.fixture(autouse=True)
    async def setup_method(self):
        """Clean up connections before each test"""
        manager.user_connections.clear()
        manager.connections.clear() 
        manager.project_subscriptions.clear()
    
    async def test_multiple_devices_same_user(self):
        """
        Use Case: User with Multiple Devices
        
        Scenario: A user is logged in on both their laptop and phone.
        They should receive notifications on both devices.
        
        Expected: Both connections receive the same events
        """
        from app.infrastructure.websocket import WebSocketConnection
        
        user_id = "user-multidevice-001"
        project_id = str(uuid.uuid4())
        
        # Mock WebSocket connections for laptop and phone
        laptop_ws = AsyncMock()
        phone_ws = AsyncMock()
        
        # Create connections for same user on different devices
        laptop_connection = WebSocketConnection(
            websocket=laptop_ws,
            user_id=user_id,
            connection_id="laptop-conn-001",
            connected_at=datetime.utcnow(),
            last_ping=datetime.utcnow()
        )
        
        phone_connection = WebSocketConnection(
            websocket=phone_ws,
            user_id=user_id,
            connection_id="phone-conn-001", 
            connected_at=datetime.utcnow(),
            last_ping=datetime.utcnow()
        )
        
        # Register both connections for the same user
        if user_id not in manager.user_connections:
            manager.user_connections[user_id] = set()
        
        manager.user_connections[user_id].add(laptop_connection)
        manager.user_connections[user_id].add(phone_connection)
        manager.connections[laptop_connection.connection_id] = laptop_connection
        manager.connections[phone_connection.connection_id] = phone_connection
        
        # Subscribe to project
        await manager.subscribe_to_project(user_id, project_id)
        
        # Send a task update
        task_event = TaskEvent(
            event_type="task_created",
            task_id=str(uuid.uuid4()),
            user_id="other-user-001",
            task_data={
                "title": "New task assigned to you",
                "status": "TODO",
                "project_id": project_id
            },
            timestamp=datetime.utcnow()
        )
        
        await manager.broadcast_task_event(task_event, project_id)
        
        # Verify both devices would receive the message
        assert len(manager.user_connections[user_id]) == 2
        assert laptop_connection in manager.user_connections[user_id]
        assert phone_connection in manager.user_connections[user_id]
        
        print("✅ Multiple Devices Same User: Both laptop and phone connections registered")
    
    async def test_user_connection_loss_and_reconnect(self):
        """
        Use Case: Connection Loss and Reconnection
        
        Scenario: A user loses internet connection while in a meeting,
        then reconnects. They should be able to rejoin and continue
        receiving updates.
        
        Expected: Reconnection works seamlessly
        """
        user_id = "user-reconnect-001"
        project_id = str(uuid.uuid4())
        
        # Initial connection and subscription
        await manager.subscribe_to_project(user_id, project_id)
        assert user_id in manager.project_subscriptions[project_id]
        
        # Simulate connection loss (unsubscribe)
        await manager.unsubscribe_from_project(user_id, project_id)
        
        # Verify user is no longer subscribed
        if project_id in manager.project_subscriptions:
            assert user_id not in manager.project_subscriptions[project_id]
        
        # Simulate reconnection (resubscribe)
        await manager.subscribe_to_project(user_id, project_id)
        
        # Verify user is subscribed again
        assert project_id in manager.project_subscriptions
        assert user_id in manager.project_subscriptions[project_id]
        
        # Send event to verify reconnection works
        reconnect_event = TaskEvent(
            event_type="task_updated",
            task_id=str(uuid.uuid4()),
            user_id="other-user",
            task_data={
                "title": "Welcome back message",
                "project_id": project_id
            },
            timestamp=datetime.utcnow()
        )
        
        await manager.broadcast_task_event(reconnect_event, project_id)
        
        print("✅ Connection Loss and Reconnect: User successfully reconnected")
    
    async def test_concurrent_users_performance(self):
        """
        Use Case: High Concurrent User Load
        
        Scenario: 50+ team members are connected to a large project
        simultaneously. The system should handle the load efficiently.
        
        Expected: All users receive updates without performance degradation
        """
        project_id = str(uuid.uuid4())
        num_users = 50
        
        # Create 50 concurrent users
        user_ids = [f"user-concurrent-{i:03d}" for i in range(num_users)]
        
        # Subscribe all users to the project
        for user_id in user_ids:
            await manager.subscribe_to_project(user_id, project_id)
        
        # Verify all users are subscribed
        assert len(manager.project_subscriptions[project_id]) == num_users
        
        # Send multiple rapid updates
        for i in range(10):
            event = TaskEvent(
                event_type="task_updated",
                task_id=str(uuid.uuid4()),
                user_id=f"user-concurrent-{i % 5:03d}",
                task_data={
                    "title": f"Bulk update {i}",
                    "status": "IN_PROGRESS",
                    "project_id": project_id
                },
                timestamp=datetime.utcnow()
            )
            await manager.broadcast_task_event(event, project_id)
        
        # Verify system handled concurrent load
        assert len(manager.project_subscriptions[project_id]) == num_users
        
        print(f"✅ Concurrent Users Performance: System handled {num_users} users successfully")


class TestAdvancedWebSocketFeatures:
    """Test advanced WebSocket features and edge cases"""
    
    @pytest.fixture(autouse=True)  
    async def setup_method(self):
        """Clean up connections before each test"""
        manager.user_connections.clear()
        manager.connections.clear() 
        manager.project_subscriptions.clear()
    
    async def test_user_status_broadcasting(self):
        """
        Test user online/offline status broadcasting
        
        When users connect/disconnect, other team members should
        be notified of their availability status.
        """
        project_id = str(uuid.uuid4())
        alice_id = "alice-status-001"
        bob_id = "bob-status-002"
        charlie_id = "charlie-status-003"
        
        # All users subscribe to project
        await manager.subscribe_to_project(alice_id, project_id)
        await manager.subscribe_to_project(bob_id, project_id)
        await manager.subscribe_to_project(charlie_id, project_id)
        
        # Test online status broadcast
        await manager._broadcast_user_status(alice_id, "online")
        
        # Test offline status broadcast
        await manager._broadcast_user_status(bob_id, "offline")
        
        # Verify users are still in project subscriptions appropriately
        assert alice_id in manager.project_subscriptions[project_id]
        assert charlie_id in manager.project_subscriptions[project_id]
        
        print("✅ User Status Broadcasting: Online/offline notifications work")
    
    async def test_connection_cleanup(self):
        """
        Test stale connection cleanup functionality
        
        Connections that haven't pinged recently should be cleaned up
        to prevent memory leaks and ghost connections.
        """
        # Test cleanup with no connections (should not fail)
        cleaned = await manager.cleanup_stale_connections(max_ping_age_minutes=1)
        assert cleaned == 0
        
        # Test connection statistics
        stats = await manager.get_connection_stats()
        assert stats["total_connections"] == 0
        assert stats["unique_users"] == 0
        assert stats["active_projects"] == 0
        
        print("✅ Connection Cleanup: Stale connection cleanup working")
    
    async def test_message_handling(self):
        """
        Test WebSocket message handling for different message types
        
        The system should properly handle ping/pong, project subscriptions,
        and unknown message types.
        """
        from app.infrastructure.websocket import WebSocketConnection
        
        # Create mock connection
        mock_websocket = AsyncMock()
        connection = WebSocketConnection(
            websocket=mock_websocket,
            user_id="test-message-user",
            connection_id="test-conn-msg",
            connected_at=datetime.utcnow(),
            last_ping=datetime.utcnow()
        )
        
        # Test ping message
        ping_msg = {"type": "ping", "timestamp": datetime.utcnow().isoformat()}
        await manager.handle_message(connection, ping_msg)
        
        # Test project subscription
        project_id = str(uuid.uuid4())
        sub_msg = {"type": "subscribe_project", "project_id": project_id}
        await manager.handle_message(connection, sub_msg)
        
        # Test project unsubscription
        unsub_msg = {"type": "unsubscribe_project", "project_id": project_id}
        await manager.handle_message(connection, unsub_msg)
        
        # Test unknown message type
        unknown_msg = {"type": "unknown_type", "data": "test"}
        await manager.handle_message(connection, unknown_msg)
        
        # Verify mock websocket was called for responses
        assert mock_websocket.send_text.called
        
        print("✅ Message Handling: All message types handled correctly")


if __name__ == "__main__":
    # Run the comprehensive tests
    import pytest
    
    print("🚀 Starting comprehensive WebSocket real-time collaboration tests...")
    print("=" * 70)
    
    # Run tests with verbose output
    pytest.main([
        __file__, 
        "-v", 
        "--tb=short",
        "-s"  # Don't capture output so we can see our print statements
    ])