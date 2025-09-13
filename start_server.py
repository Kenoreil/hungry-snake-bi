import http.server
import socketserver
import webbrowser
import os
import threading
import time

# 设置服务器端口
PORT = 8080

# 获取当前目录
Handler = http.server.SimpleHTTPRequestHandler

# 创建服务器
httpd = socketserver.TCPServer(('', PORT), Handler)

print(f"\n游戏服务器启动在 http://localhost:{PORT}")
print("按Ctrl+C停止服务器\n")

# 在新线程中打开浏览器
def open_browser():
    time.sleep(1)  # 等待服务器启动
    webbrowser.open(f'http://localhost:{PORT}')

# 启动浏览器线程
browser_thread = threading.Thread(target=open_browser)
browser_thread.daemon = True
browser_thread.start()

# 启动服务器
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\n服务器已停止")
    httpd.server_close()