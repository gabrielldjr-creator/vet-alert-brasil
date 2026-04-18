from fastapi import FastAPI

from backend.terminal_routes import terminal_router

app = FastAPI()


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(terminal_router)
