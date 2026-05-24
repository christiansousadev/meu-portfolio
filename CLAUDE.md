# Portfolio System - Context

## Tech Stack
- **Backend:** Python (FastAPI)
- **Frontend:** React + Vite (Javascript)
- **Database:** JSON based (portfolio_data.json)

## Comandos Úteis
- **Backend:** `cd backend && source venv/bin/activate && uvicorn main:app --reload`
- **Frontend:** `cd frontend && npm install && npm run dev`

## Estrutura de Governança
- O backend centraliza a lógica de dados em `backend/data/`.
- O frontend consome essa API e possui um `AdminDashboard` para edição.
- Logs devem ser limpos e erros tratados com try/catch.