# AI-Powered Personal Finance Assistant

## 📌 Overview
The AI-Powered Personal Finance Assistant helps users track expenses, analyze spending patterns, and manage finances efficiently using AI-driven insights. This full-stack project consists of a FastAPI backend and a Vite + React + react-router-dom frontend with Tailwind CSS.

## ✨ Features
- **OCR for Receipts & Bills** – Upload bills and extract transaction details automatically.
- **AI-Powered Spending Insights & Chatbot** – Get personalized insights and interact with an AI assistant.
- **Auto-Categorization & Smart Labels** – Tag and categorize transactions automatically.
- **Budgeting & Accounts Management** – Track account balances and budget limits in real time.
- **Data Export** – Export transaction history in CSV or PDF formats.

## 🏗 Tech Stack
- **Frontend**: React 18, Vite, React Router DOM, Tailwind CSS
- **Backend**: FastAPI (Python), MongoDB (Motor Async Client)
- **AI Models**: GROQ API (LLaMA 3) for chatbot & AI receipt vision insights

## 🚀 Installation & Setup
### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Murugavl/AI-powered-personal-finance.git
cd finance
```

### 2️⃣ Backend Setup
```bash
cd backend
cp .env.example .env  # Configure your secret keys and MONGO_URL
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Start Vite development server
```

## 📡 API Endpoints
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/auth/register` | User registration |
| `POST` | `/auth/login` | User authentication & JWT token issuance |
| `GET` | `/auth/me` | Fetch current authenticated user profile |
| `GET`, `POST` | `/transactions/` | Fetch or record transactions |
| `PUT`, `DELETE` | `/transactions/{id}` | Update or delete a transaction |
| `GET`, `POST`, `PUT`, `DELETE` | `/accounts/` | Manage connected accounts |
| `GET`, `POST`, `DELETE` | `/budgets/` | Manage monthly budgets & spending |
| `POST` | `/upload-bill/` | Process receipt/bill images via OCR |
| `POST` | `/chat/` | Query the GROQ AI financial assistant |
| `GET` | `/export/transactions/pdf` | Generate and download PDF transaction statement |
| `GET` | `/export/transactions/csv` | Export transactions data as CSV |

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing
We welcome contributions! Fork the repo, create a new branch, and submit a pull request.

## 📞 Contact
For queries or collaborations, reach out via [vmv2k05@gmail.com](mailto:vmv2k05@gmail.com) or visit our [GitHub Issues](https://github.com/Murugavl/AI-powered-personal-finance/issues).

---
Developed with ❤️ by [Murugavel V] 🚀
