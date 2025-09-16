"""
User settings and preferences schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class NotificationSettings(BaseModel):
    """Notification preferences"""
    email_notifications: bool = True
    push_notifications: bool = False
    weekly_reports: bool = True
    task_reminders: bool = True
    mention_notifications: bool = True
    project_updates: bool = True
    notification_sound: bool = True

class UISettings(BaseModel):
    """UI preferences"""
    theme: str = "light"  # light, dark, auto
    sidebar_collapsed: bool = False
    language: str = "en"
    timezone: str = "UTC"
    date_format: str = "MM/DD/YYYY"
    time_format: str = "12h"  # 12h or 24h
    first_day_of_week: int = 0  # 0=Sunday, 1=Monday

class PrivacySettings(BaseModel):
    """Privacy preferences"""
    profile_visibility: str = "public"  # public, team, private
    show_email: bool = False
    show_activity: bool = True
    allow_invites: bool = True

class UpdateUserSettingsRequest(BaseModel):
    """Request to update user settings"""
    notification_settings: Optional[NotificationSettings] = None
    ui_settings: Optional[UISettings] = None
    privacy_settings: Optional[PrivacySettings] = None

class UserSettingsResponse(BaseModel):
    """User settings response"""
    notification_settings: NotificationSettings
    ui_settings: UISettings
    privacy_settings: PrivacySettings
    updated_at: datetime