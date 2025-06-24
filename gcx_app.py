import webview
import threading
import requests

HTML_FOOTER = '''
<style>
  .footer {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    background: rgba(255,255,255,0.8);
    color: #333;
    text-align: center;
    font-size: 16px;
    padding: 8px 0;
    z-index: 9999;
  }
  body { margin-bottom: 40px; }
</style>
<div class="footer">Made in PYTHON</div>
'''

OFFLINE_HTML = f'''
<html>
<head><title>ADMIN Portal - Offline</title></head>
<body style="font-family:sans-serif;text-align:center;padding-top:80px;background:#fafafa;">
  <h1>ADMIN Portal</h1>
  <p style="font-size:20px;">You are offline or the website is not reachable.</p>
  <p>Please check your internet connection.</p>
  {HTML_FOOTER}
</body>
</html>
'''

URL = 'https://gcx-admin.vercel.app/'

def check_online():
    try:
        requests.get(URL, timeout=5)
        return True
    except Exception:
        return False

def start_app():
    if check_online():
        window = webview.create_window('GCX Portal', URL)
        webview.start(inject_footer, window)
    else:
        window = webview.create_window('GCX Portal - Offline', html=OFFLINE_HTML)
        webview.start()

def inject_footer(window):
    try:
        window.evaluate_js(f"""
            var div = document.createElement('div');
            div.innerHTML = `{HTML_FOOTER}`;
            document.body.appendChild(div);
        """)
    except Exception:
        pass

if __name__ == '__main__':
    start_app() 