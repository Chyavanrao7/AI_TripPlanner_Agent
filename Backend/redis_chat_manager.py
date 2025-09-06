"""
Enhanced Redis Chat Manager for session management with better context handling
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import redis

class EnhancedChatManager:
    
    def __init__(self, redis_url: Optional[str] = None):
        """Initialize enhanced chat manager"""
        self.redis_client = None
        self.in_memory_sessions: Dict[str, List[Dict]] = {}
        self.session_metadata: Dict[str, Dict] = {}
        
        if redis_url:
            try:
                self.redis_client = redis.from_url(redis_url, decode_responses=True)
                self.redis_client.ping()
                print("Connected to Redis")
            except Exception as e:
                print(f"Failed to connect to Redis: {e}. Using in-memory storage.")
                self.redis_client = None
        else:
            print("Using in-memory storage for chat sessions")
    
    def create_session(self, user_id: str) -> str:
        """Create a new chat session with enhanced metadata"""
        session_id = f"session_{uuid.uuid4().hex[:12]}"
        
        session_data = {
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat(),
            "message_count": 0,
            "context_summary": {},  # Store trip planning context
            "last_user_message": "",
            "last_assistant_message": ""
        }
        
        if self.redis_client:
            self.redis_client.hset(f"session:{session_id}", mapping={
                "user_id": user_id,
                "created_at": session_data["created_at"],
                "last_activity": session_data["last_activity"],
                "message_count": str(session_data["message_count"]),
                "context_summary": json.dumps(session_data["context_summary"]),
                "last_user_message": session_data["last_user_message"],
                "last_assistant_message": session_data["last_assistant_message"]
            })
            self.redis_client.expire(f"session:{session_id}", 86400)  # 24 hour TTL
            self.redis_client.sadd(f"user:{user_id}:sessions", session_id)
        else:
            self.in_memory_sessions[session_id] = []
            self.session_metadata[session_id] = session_data
        
        print(f"Created session {session_id} for user {user_id}")
        return session_id
    
    def add_message(self, session_id: str, role: str, content: str, tool_call_id: Optional[str] = None, metadata: Optional[Dict] = None) -> str:
        """Add a message to a session with enhanced metadata"""
        message_id = f"msg_{uuid.uuid4().hex[:12]}"
        timestamp = datetime.now().isoformat()
        
        message = {
            "id": message_id,
            "role": role,
            "content": content,
            "timestamp": timestamp,
            "tool_call_id": tool_call_id,
            "metadata": metadata or {}
        }
        
        if self.redis_client:
            self.redis_client.hset(f"message:{message_id}", mapping={
                "id": message_id,
                "role": role,
                "content": content,
                "timestamp": timestamp,
                "tool_call_id": tool_call_id or "",
                "metadata": json.dumps(metadata or {})
            })
            
            score = datetime.now().timestamp()
            self.redis_client.zadd(f"session:{session_id}:messages", {message_id: score})
            
            update_data = {
                "last_activity": timestamp,
                "message_count": str(self.redis_client.zcard(f"session:{session_id}:messages"))
            }
            
            if role == "user":
                update_data["last_user_message"] = content[:200]
            elif role == "assistant":
                update_data["last_assistant_message"] = content[:200]
            
            self.redis_client.hset(f"session:{session_id}", mapping=update_data)
        else:
            if session_id not in self.in_memory_sessions:
                self.in_memory_sessions[session_id] = []
            
            self.in_memory_sessions[session_id].append(message)
            
            if session_id in self.session_metadata:
                self.session_metadata[session_id]["last_activity"] = timestamp
                self.session_metadata[session_id]["message_count"] = len(self.in_memory_sessions[session_id])
                
                if role == "user":
                    self.session_metadata[session_id]["last_user_message"] = content[:200]
                elif role == "assistant":
                    self.session_metadata[session_id]["last_assistant_message"] = content[:200]
        
        return message_id
    
    def get_session_messages(self, session_id: str, limit: int = 100, include_metadata: bool = False) -> List[Dict]:
        """Get messages for a session with optional metadata"""
        if self.redis_client:
            message_ids = self.redis_client.zrange(
                f"session:{session_id}:messages", 
                -limit, 
                -1
            )
            
            messages = []
            for msg_id in message_ids:
                msg_data = self.redis_client.hgetall(f"message:{msg_id}")
                if msg_data:
                    if msg_data.get("metadata"):
                        try:
                            msg_data["metadata"] = json.loads(msg_data["metadata"])
                        except:
                            msg_data["metadata"] = {}
                    
                    if not msg_data.get("tool_call_id"):
                        msg_data.pop("tool_call_id", None)
                    
                    if include_metadata:
                        messages.append(msg_data)
                    else:
                        simplified_msg = {
                            "role": msg_data["role"],
                            "content": msg_data["content"],
                            "timestamp": msg_data.get("timestamp")
                        }
                        if msg_data.get("tool_call_id"):
                            simplified_msg["tool_call_id"] = msg_data["tool_call_id"]
                        messages.append(simplified_msg)
            
            return messages
        else:
            if session_id in self.in_memory_sessions:
                messages = self.in_memory_sessions[session_id][-limit:]
                if not include_metadata:
                    return [{
                        "role": msg["role"],
                        "content": msg["content"],
                        "timestamp": msg.get("timestamp"),
                        "tool_call_id": msg.get("tool_call_id")
                    } for msg in messages if msg.get("tool_call_id") or msg["role"] in ["user", "assistant"]]
                return messages
            return []
    
    def replace_session_messages(self, session_id: str, messages: List[Dict[str, Any]]):
        """Replace all messages in a session with new message list"""
        if self.redis_client:
            with self.redis_client.pipeline() as pipe:
                old_message_ids = self.redis_client.zrange(f"session:{session_id}:messages", 0, -1)
                
                pipe.delete(f"session:{session_id}:messages")
                if old_message_ids:
                    for msg_id in old_message_ids:
                        pipe.delete(f"message:{msg_id}")
                
                for i, msg_data in enumerate(messages):
                    new_message_id = f"msg_{uuid.uuid4().hex[:12]}"
                    timestamp = datetime.now().timestamp() + i
                    
                    redis_msg = {
                        "id": new_message_id,
                        "role": msg_data["role"],
                        "content": msg_data["content"],
                        "timestamp": msg_data.get("timestamp", datetime.fromtimestamp(timestamp).isoformat()),
                        "tool_call_id": msg_data.get("tool_call_id", ""),
                        "metadata": json.dumps(msg_data.get("metadata", {}))
                    }
                    
                    pipe.hset(f"message:{new_message_id}", mapping=redis_msg)
                    pipe.zadd(f"session:{session_id}:messages", {new_message_id: timestamp})
                
                pipe.hset(f"session:{session_id}", mapping={
                    "last_activity": datetime.now().isoformat(),
                    "message_count": str(len(messages))
                })
                
                pipe.execute()
        else:
            self.in_memory_sessions[session_id] = messages.copy()
            if session_id in self.session_metadata:
                self.session_metadata[session_id]["last_activity"] = datetime.now().isoformat()
                self.session_metadata[session_id]["message_count"] = len(messages)
        
        print(f"Replaced {len(messages)} messages for session {session_id}")
    
    def update_session_context(self, session_id: str, context_data: Dict[str, Any]):
        """Update session context summary for better trip planning"""
        if self.redis_client:
            current_context = self.redis_client.hget(f"session:{session_id}", "context_summary")
            try:
                context_summary = json.loads(current_context) if current_context else {}
            except:
                context_summary = {}
            
            context_summary.update(context_data)
            
            self.redis_client.hset(f"session:{session_id}", "context_summary", json.dumps(context_summary))
            print(f"Updated context for session {session_id}: {context_data}")
        else:
            if session_id in self.session_metadata:
                if "context_summary" not in self.session_metadata[session_id]:
                    self.session_metadata[session_id]["context_summary"] = {}
                self.session_metadata[session_id]["context_summary"].update(context_data)
                print(f"Updated context for session {session_id}: {context_data}")
    
    def get_session_context(self, session_id: str) -> Dict[str, Any]:
        """Get session context summary"""
        if self.redis_client:
            context_data = self.redis_client.hget(f"session:{session_id}", "context_summary")
            try:
                return json.loads(context_data) if context_data else {}
            except:
                return {}
        else:
            if session_id in self.session_metadata:
                return self.session_metadata[session_id].get("context_summary", {})
            return {}
    
    def get_user_sessions(self, user_id: str) -> List[Dict]:
        """Get all sessions for a user with enhanced metadata"""
        sessions = []
        
        if self.redis_client:
            session_ids = self.redis_client.smembers(f"user:{user_id}:sessions")
            for session_id in session_ids:
                session_data = self.redis_client.hgetall(f"session:{session_id}")
                if session_data:
                    session_data["session_id"] = session_id
                    
                    if session_data.get("context_summary"):
                        try:
                            session_data["context_summary"] = json.loads(session_data["context_summary"])
                        except:
                            session_data["context_summary"] = {}
                    
                    try:
                        session_data["message_count"] = int(session_data.get("message_count", 0))
                    except:
                        session_data["message_count"] = 0
                    
                    sessions.append(session_data)
        else:
            for session_id, messages in self.in_memory_sessions.items():
                if session_id in self.session_metadata:
                    metadata = self.session_metadata[session_id]
                    if metadata.get("user_id") == user_id:
                        session_data = metadata.copy()
                        session_data["session_id"] = session_id
                        session_data["message_count"] = len(messages)
                        sessions.append(session_data)
        
        sessions.sort(key=lambda x: x.get("last_activity", ""), reverse=True)
        return sessions
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a session and all its messages"""
        try:
            if self.redis_client:
                message_ids = self.redis_client.zrange(f"session:{session_id}:messages", 0, -1)
                
                for msg_id in message_ids:
                    self.redis_client.delete(f"message:{msg_id}")
                
                self.redis_client.delete(f"session:{session_id}:messages")
                
                user_id = self.redis_client.hget(f"session:{session_id}", "user_id")
                if user_id:
                    self.redis_client.srem(f"user:{user_id}:sessions", session_id)
                
                self.redis_client.delete(f"session:{session_id}")
                print(f"Deleted session {session_id} from Redis")
                return True
            else:
                if session_id in self.in_memory_sessions:
                    del self.in_memory_sessions[session_id]
                if session_id in self.session_metadata:
                    del self.session_metadata[session_id]
                print(f"Deleted session {session_id} from memory")
                return True
        except Exception as e:
            print(f"Error deleting session {session_id}: {e}")
            return False
    
    def get_session_info(self, session_id: str) -> Optional[Dict]:
        """Get session metadata"""
        if self.redis_client:
            session_data = self.redis_client.hgetall(f"session:{session_id}")
            if session_data and session_data.get("context_summary"):
                try:
                    session_data["context_summary"] = json.loads(session_data["context_summary"])
                except:
                    session_data["context_summary"] = {}
            
            if session_data and session_data.get("message_count"):
                try:
                    session_data["message_count"] = int(session_data["message_count"])
                except:
                    session_data["message_count"] = 0
            
            return session_data
        else:
            return self.session_metadata.get(session_id)
    
    def search_sessions_by_context(self, user_id: str, search_terms: List[str]) -> List[Dict]:
        """Search user sessions by context/content"""
        matching_sessions = []
        user_sessions = self.get_user_sessions(user_id)
        
        for session in user_sessions:
            session_id = session["session_id"]
            relevance_score = 0
            
            context = session.get("context_summary", {})
            context_str = json.dumps(context).lower()
            context_matches = sum(1 for term in search_terms if term.lower() in context_str)
            relevance_score += context_matches * 2
            
            recent_messages = self.get_session_messages(session_id, limit=10)
            message_matches = 0
            for msg in recent_messages:
                content = msg.get("content", "").lower()
                message_matches += sum(1 for term in search_terms if term.lower() in content)
            
            relevance_score += message_matches
            
            if relevance_score > 0:
                session["relevance_score"] = relevance_score
                session["search_matches"] = {
                    "context_matches": context_matches,
                    "message_matches": message_matches
                }
                matching_sessions.append(session)
        
        matching_sessions.sort(key=lambda x: (x["relevance_score"], x.get("last_activity", "")), reverse=True)
        return matching_sessions
    
    def get_session_statistics(self) -> Dict[str, Any]:
        """Get overall session statistics"""
        if self.redis_client:
            return {
                "total_sessions": "N/A (Redis)",
                "storage_type": "Redis",
                "connected": True
            }
        else:
            total_sessions = len(self.in_memory_sessions)
            total_messages = sum(len(messages) for messages in self.in_memory_sessions.values())
            
            return {
                "total_sessions": total_sessions,
                "total_messages": total_messages,
                "avg_messages_per_session": total_messages / total_sessions if total_sessions > 0 else 0,
                "storage_type": "In-Memory",
                "connected": False
            }
    
    def cleanup_old_sessions(self, days: int = 7):
        """Cleanup sessions older than specified days"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            cutoff_timestamp = cutoff_date.isoformat()
            
            if self.redis_client:
                print(f"Cleanup not implemented for Redis storage")
                return 0
            else:
                sessions_to_delete = []
                for session_id, metadata in self.session_metadata.items():
                    if metadata.get("last_activity", "") < cutoff_timestamp:
                        sessions_to_delete.append(session_id)
                
                for session_id in sessions_to_delete:
                    self.delete_session(session_id)
                
                print(f"Cleaned up {len(sessions_to_delete)} old sessions")
                return len(sessions_to_delete)
        except Exception as e:
            print(f"Error during cleanup: {e}")
            return 0

ChatManager = EnhancedChatManager

if __name__ == "__main__":
    pass