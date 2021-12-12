package webrtc.webrtc;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;

@Component
public class HttpInterceptor implements HandlerInterceptor {

    public static final String resourcePath = "./res";

    @Autowired
    private ServletContext servletContext;

    public HttpInterceptor() {
        File res = new File(resourcePath);
        res.mkdir();
    }

    public static String getString(byte b[]) {
        String str = "";
        for (int i = 0; i < b.length; i++) {
            str += String.format("%h ", b[i] & 0xff);
        }
        return str;
    }

    public static byte[] readBytes(File file) throws IOException {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        copy(new FileInputStream(file), os, true, true);
        byte b[] = os.toByteArray();
        return b;
    }

    public static void copy(InputStream is, OutputStream os, boolean closeInput, boolean closeOutput) throws IOException {
        byte b[] = new byte[10000];
        while (true) {
            int r = is.read(b);
            if (r < 0) {
                break;
            }
            os.write(b, 0, r);
        }
        if (closeInput) {
            is.close();
        }
        if (closeOutput) {
            os.flush();
            os.close();
        }
    }

    public MediaType getMediaType(String fileName) {
        try {
            String mimeType = servletContext.getMimeType(fileName);
            MediaType mediaType = MediaType.parseMediaType(mimeType);
            return mediaType;
        } catch (Exception e) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String uri = request.getRequestURI();
        if ("".equals(uri) || "/".equals(uri)) {
            uri = "/index.html";
        }

        if (!uri.startsWith("/api/")) {
            returnFile(request, response, uri);
            return false;
        }
        return true;
    }

    private void returnFile(HttpServletRequest request, HttpServletResponse response, String uri) throws IOException {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "*");
        response.setHeader("Access-Control-Allow-Credentials", "" + true);
        //response.setHeader("Access-Control-Max-Age", "" + 600);
        //response.setHeader("Cache-Control", "max-age=3600");

        File file = new File(HttpInterceptor.resourcePath + uri);
        if (!uri.contains("/../") && file.exists()) {
            response.setContentType("" + getMediaType(uri.substring(1)));
            byte[] bytes = readBytes(file);
            response.getOutputStream().write(bytes);
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }
        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception exception) throws Exception {
    }

}
