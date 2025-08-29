from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from websocket.manager import manager

router = APIRouter(tags=["websocket"])

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # 클라이언트로부터 메시지 수신 (필요시)
            data = await websocket.receive_text()
            # 여기서 메시지 처리 로직 추가 가능
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id) 