"""
Unit tests for database connection functionality
"""
import pytest
from app.core.database import build_async_database_url


class TestDatabaseURLParsing:
    """Test suite for database URL parsing"""
    
    def test_password_with_special_characters(self):
        """Test password handling with various special characters (assumes pre-encoded)"""
        test_cases = [
            ('postgresql://user:pass%24word@host:5432/db', 'pass%24word'),
            ('postgresql://user:pa%40ss@host:5432/db', 'pa%40ss'),
            ('postgresql://user:pass%23word@host:5432/db', 'pass%23word'),
            ('postgresql://user:pass%25word@host:5432/db', 'pass%25word'),
            ('postgresql://user:pass%26word@host:5432/db', 'pass%26word'),
        ]
        
        for input_url, expected_encoded in test_cases:
            result_url = build_async_database_url(input_url)
            assert expected_encoded in result_url
            assert 'postgresql+asyncpg://' in result_url
    
    def test_driver_conversion(self):
        """Test postgresql to postgresql+asyncpg conversion"""
        input_url = 'postgresql://user:pass@host:5432/db'
        result_url = build_async_database_url(input_url)
        
        assert result_url.startswith('postgresql+asyncpg://')
        assert 'user:pass@host:5432/db' in result_url
    
    def test_pgbouncer_parameter_removal(self):
        """Test pgbouncer parameter filtering"""
        test_urls = [
            'postgresql://user:pass@host:5432/db?pgbouncer=true',
            'postgresql://user:pass@host:5432/db?pgbouncer=true&other=value',
            'postgresql://user:pass@host:5432/db?other=value&pgbouncer=true',
        ]
        
        for test_url in test_urls:
            result_url = build_async_database_url(test_url)
            assert 'pgbouncer' not in result_url
    
    def test_query_parameter_preservation(self):
        """Test that non-pgbouncer parameters are preserved"""
        input_url = 'postgresql://user:pass@host:5432/db?sslmode=require&application_name=myapp&pgbouncer=true'
        result_url = build_async_database_url(input_url)
        
        assert 'sslmode=require' in result_url
        assert 'application_name=myapp' in result_url
        assert 'pgbouncer' not in result_url
    
    def test_complex_supabase_url(self):
        """Test parsing of complex Supabase-style URLs with pre-encoded password"""
        # Simulate a Supabase URL with pre-encoded password (as from .env)
        input_url = 'postgresql://postgres.abcd1234:Dc5F9y-6%24NW%24kg%40@aws-1-eu-central-2.pooler.supabase.com:6543/postgres?pgbouncer=true'
        result_url = build_async_database_url(input_url)
        
        assert 'postgresql+asyncpg://' in result_url
        assert 'postgres.abcd1234:Dc5F9y-6%24NW%24kg%40' in result_url
        assert 'aws-1-eu-central-2.pooler.supabase.com:6543' in result_url
        assert '/postgres' in result_url
        assert 'pgbouncer' not in result_url
    
    def test_url_without_password(self):
        """Test URL parsing without password"""
        input_url = 'postgresql://user@host:5432/db'
        result_url = build_async_database_url(input_url)
        
        assert 'postgresql+asyncpg://user@host:5432/db' == result_url
    
    def test_url_without_port(self):
        """Test URL parsing without explicit port"""
        input_url = 'postgresql://user:pass@host/db'
        result_url = build_async_database_url(input_url)
        
        assert 'postgresql+asyncpg://user:pass@host/db' == result_url
    
    def test_invalid_url_format(self):
        """Test error handling for invalid URLs"""
        with pytest.raises(ValueError, match="Invalid database URL format"):
            build_async_database_url('not-a-valid-url')
        
        with pytest.raises(ValueError, match="No credentials found"):
            build_async_database_url('postgresql://host:5432/db')


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
