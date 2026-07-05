from fastapi import FastAPI, HTTPException
import yaml
import os

app = FastAPI(title="Config Server - Red de Hospitales")

BASE = os.path.join(os.path.dirname(__file__), "configs")


@app.get("/")
def root():
    services = [f.replace(".yml", "") for f in os.listdir(BASE) if f.endswith(".yml")]
    return {
        "service": "Config Server",
        "services_available": sorted(services),
        "usage": "GET /{service_name}/default",
    }


@app.get("/{service}/{profile:str}")
def get_config(service: str, profile: str = "default"):
    path = os.path.join(BASE, f"{service}.yml")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"No configuration for '{service}'")
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)
