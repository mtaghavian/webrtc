package webrtc.webrtc;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class WebRTCController implements WebSocketHandler {

    private List<Session> list = new ArrayList<>();
    private ObjectMapper objectMapper = new ObjectMapper();

    private synchronized List<Session> perform(WebSocketSession wss, int op, String searchRoom, String searchId) {
        if (op == 0) { // add
            Session s = new Session();
            s.setWss(wss);
            list.add(s);
        } else if (op == 1) { // remove
            int index = 0;
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i).getWss() == wss) {
                    index = i;
                    break;
                }
            }
            list.remove(index);
        } else if (op == 2) { // get
            int index = 0;
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i).getWss() == wss) {
                    index = i;
                    break;
                }
            }
            return Collections.singletonList(list.get(index));
        } else if (op == 3) { // search
            List<Session> slist = new ArrayList<>();
            for (int i = 0; i < list.size(); i++) {
                if (wss.equals(list.get(i).getWss())) {
                    continue;
                }
                if (searchId != null && searchId.equals(list.get(i).getId())) {
                    return Collections.singletonList(list.get(i));
                }
                if (searchRoom != null && searchRoom.equals(list.get(i).getRoom())) {
                    slist.add(list.get(i));
                }
            }
            if (searchId != null) {
                return new ArrayList<>();
            } else {
                return slist;
            }
        }
        return null;
    }

    @Override
    public void handleMessage(WebSocketSession wss, WebSocketMessage<?> msg) throws IOException {
        if (msg instanceof BinaryMessage) {
            return;
        }
        TextMessage textMsg = (TextMessage) msg;
        String payload = textMsg.getPayload();
        WebRTCMessage webrtcMsg = null;
        try{
            webrtcMsg = objectMapper.readValue(payload, WebRTCMessage.class);
        }catch (Exception ex){
            System.out.println();
        }

        if ("hi".equals(webrtcMsg.getOp())) {
            Session s = perform(wss, 2, null, null).get(0);
            s.setId(webrtcMsg.getFrom());
            s.setRoom(webrtcMsg.getRoom());
        }
        List<Session> dstList = perform(wss, 3, webrtcMsg.getRoom(), webrtcMsg.getTo());
        for (int i = 0; i < dstList.size(); i++) {
            try {
                dstList.get(i).getWss().sendMessage(msg);
            } catch (Exception ioex) {
            }
        }
    }

    @Override
    public void handleTransportError(WebSocketSession webSocketSession, Throwable throwable) throws Exception {
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession wss) throws Exception {
        perform(wss, 0, null, null);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession wss, CloseStatus status) throws Exception {
        Session s = perform(wss, 2, null, null).get(0);
        List<Session> slist = perform(wss, 3, s.getRoom(), null);
        WebRTCMessage msg = new WebRTCMessage();
        msg.setOp("bye");
        msg.setFrom(s.getId());
        msg.setRoom(s.getRoom());
        for (int i = 0; i < slist.size(); i++) {
            try {
                slist.get(i).getWss().sendMessage(new TextMessage(objectMapper.writeValueAsString(msg)));
            } catch (IOException ioex) {
            }
        }
        perform(wss, 1, null, null);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    @Getter
    @Setter
    private static class Session {
        private WebSocketSession wss;
        private String room, id;
    }

    @Getter
    @Setter
    private static class WebRTCMessage {
        private String op, from, to, room, payload;
    }

}