from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.terminal_routes import terminal_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(terminal_router)
