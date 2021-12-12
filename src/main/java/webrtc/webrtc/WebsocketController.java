package webrtc.webrtc;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Component
public class WebsocketController implements WebSocketHandler {

    Map<String, WebSocketSession> sessions = Collections.synchronizedMap(new HashMap<>());

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> webSocketMessage) throws IOException {
        for (String sessionId : sessions.keySet()) {
            WebSocketSession s = sessions.get(sessionId);
            if (s.isOpen() && !session.getId().equals(s.getId())) {
                s.sendMessage(webSocketMessage);
            }
        }
    }

    @Override
    public void handleTransportError(WebSocketSession webSocketSession, Throwable throwable) throws Exception {
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.put(session.getId(), session);
        System.out.println("Session added! " + session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session.getId());
        System.out.println("Session removed! " + session.getId());
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }
}