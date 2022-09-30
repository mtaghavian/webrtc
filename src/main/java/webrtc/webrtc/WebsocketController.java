package webrtc.webrtc;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class WebsocketController implements WebSocketHandler {

    List<List<WebSocketSession>> list = new ArrayList<>();

    public synchronized WebSocketSession process(WebSocketSession s, ProcessType opCode) {
        if (opCode.equals(ProcessType.ADD)) {
            if (list.isEmpty()) {
                list.add(new ArrayList<>());
            }
            List<WebSocketSession> lastList = list.get(list.size() - 1);
            if (lastList.isEmpty()) {
                lastList.add(s);
            } else if (lastList.size() == 1) {
                lastList.add(s);
            } else {
                List<WebSocketSession> newList = new ArrayList<>();
                newList.add(s);
                list.add(newList);
            }
            return null;
        } else if (opCode.equals(ProcessType.REMOVE)) {
            boolean found = false;
            int i = 0, j = 0;
            for (i = 0; i < list.size(); i++) {
                for (j = 0; j < list.get(i).size(); j++) {
                    if (s.getId().equals(list.get(i).get(j).getId())) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    break;
                }
            }
            list.get(i).remove(j);
            if (list.get(i).isEmpty()) {
                list.remove(i);
            }
            return null;
        } else if (opCode.equals(ProcessType.GET)) {
            boolean found = false;
            int i = 0, j = 0;
            for (i = 0; i < list.size(); i++) {
                for (j = 0; j < list.get(i).size(); j++) {
                    if (s.getId().equals(list.get(i).get(j).getId())) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    break;
                }
            }
            if (found) {
                if (j == 0) {
                    return (list.get(i).size() == 2) ? list.get(i).get(1) : null;
                } else {
                    return list.get(i).get(0);
                }
            } else {
                return null;
            }
        } else if (opCode.equals(ProcessType.CALL)) {
            boolean found = false;
            int i = 0, j = 0;
            for (i = 0; i < list.size(); i++) {
                for (j = 0; j < list.get(i).size(); j++) {
                    if (s.getId().equals(list.get(i).get(j).getId())) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    break;
                }
            }
            if (found) {
                if (j == 0) {
                    return null;
                } else {
                    sendCall(s);
                    return null;
                }
            } else {
                return null;
            }
        } else if (opCode.equals(ProcessType.PRINT)) {
            System.out.println("Printing list:");
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i).isEmpty()) {
                    System.out.println("EMPTY");
                } else {
                    for (int j = 0; j < list.get(i).size(); j++) {
                        System.out.print(list.get(i).get(j).getId() + " ");
                    }
                    System.out.println();
                }
            }
            return null;
        } else {
            return null;
        }
    }

    private void sendCall(WebSocketSession s) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, String> map = new HashMap<>();
            map.put("event", "call");
            s.sendMessage(new TextMessage(objectMapper.writeValueAsString(map)));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void handleMessage(WebSocketSession s, WebSocketMessage<?> msg) throws IOException {
        if (msg instanceof TextMessage) {
            TextMessage textMsg = (TextMessage) msg;
            String payload = textMsg.getPayload();
            if ("hello".equals(payload)) {
                process(s, ProcessType.CALL);
                return;
            }
        }
        WebSocketSession other = process(s, ProcessType.GET);
        if (other != null) {
            other.sendMessage(msg);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession webSocketSession, Throwable throwable) throws Exception {
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        process(session, ProcessType.ADD);
        //listUpdate(session, OpCode.PRINT);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        process(session, ProcessType.REMOVE);
        //listUpdate(session, OpCode.PRINT);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    public static enum ProcessType {
        ADD, REMOVE, GET, CALL, PRINT
    }
}