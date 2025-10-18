# Vocademy Deployment (Raspberry Pi + Cloudflared)

Single-domain setup: vocademy.onicssolutions.cc -> backend:8000 (serves API under /api and frontend build).

1) Prepare
- sudo apt update && sudo apt install -y python3-venv python3-pip nodejs npm
- Install cloudflared per Cloudflare docs (ARM).

2) Backend deps + Frontend build (once per deploy)
- cd ~/Vocademy/backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
- cd ~/Vocademy/frontend && npm ci && npm run build

3) systemd (backend)
- Copy deploy/systemd/vocademy-backend.service.example to /etc/systemd/system/vocademy-backend.service
- Adjust WorkingDirectory, ExecStart, User
- sudo systemctl daemon-reload && sudo systemctl enable --now vocademy-backend

4) Cloudflared
- Use your main tunnel config (example: deploy/cloudflared/config.main-tunnel.example.yml)
- Add:
  - hostname: vocademy.onicssolutions.cc
    service: http://localhost:8000
- Restart cloudflared service (sudo systemctl restart cloudflared) or your custom unit.

5) Verify
- systemctl status vocademy-backend
- systemctl status cloudflared
- Open https://vocademy.onicssolutions.cc

Dev (local)
- Backend: cd backend && uvicorn app.main:app --reload --port 8000
- Frontend: cd frontend && npm run dev (Vite proxies /api -> backend)
