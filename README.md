# GCX Portal Desktop App

This app displays [http://gcx.co.in/](http://gcx.co.in/) in a native window using Python and pywebview.

## Requirements
- Python 3.x
- pip
- pywebview (see requirements.txt)
- pyinstaller (for building Windows executable)

## Install dependencies
```sh
pip3 install -r requirements.txt
```

## Run the app
```sh
python3 gcx_app.py
```

## Build Windows Executable
1. Install PyInstaller:
   ```sh
   pip3 install pyinstaller
   ```
2. Build the executable:
   ```sh
   pyinstaller --onefile --windowed gcx_app.py
   ```
3. The Windows executable will be in the `dist/` folder as `gcx_app.exe`.

---

You can copy the `dist/gcx_app.exe` to any Windows machine with no Python required. 