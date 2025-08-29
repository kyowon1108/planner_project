from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # 사용자별 WebSocket 연결 저장
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        try:
            await websocket.accept()
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
        except Exception as e:
            print(f"WebSocket 연결 오류: {e}")
            # 이미 연결된 경우 무시
            pass

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    # 연결이 끊어진 경우 제거
                    self.active_connections[user_id].remove(connection)

    async def broadcast(self, message: dict, user_ids: List[int]):
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)

manager = ConnectionManager() 