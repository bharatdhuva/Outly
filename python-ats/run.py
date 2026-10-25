import os
import uvicorn

if __name__ == "__main__":
    # Render sets RENDER=true and provides a dynamic $PORT (usually 10000)
    is_render = bool(os.environ.get("RENDER"))
    port = int(os.environ.get("PORT", 10000 if is_render else 8000))
    print(f"==> Starting Outly Python ATS on 0.0.0.0:{port} (is_render={is_render})")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, log_level="info")
