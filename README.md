# AI-Powered Personal Finance Assistant

![AI Finance Banner](https://via.placeholder.com/1200x400.png?text=AI+Powered+Personal+Finance+Assistant)

## 📌 Overview
The AI-Powered Personal Finance Assistant helps users track expenses, analyze spending patterns, and manage finances efficiently using AI-driven insights. This full-stack project consists of a FastAPI backend and a React frontend with Tailwind CSS.

## ✨ Features
- **OCR for Receipts & Bills** – Upload bills and extract transaction details automatic
- **AI-Powered Spending Insights** – Get NLP-based financial insights.
- **Auto-Categorization & Smart Labels** – Tag and categorize expenses automatically.
- **Real-Time Financial Alerts** – Get notifications on budget breaches.
- **Personalized Financial Tips** – AI-generated money-saving suggestions.
- **Financial Chatbot** – GPT-powered chatbot for financial queries.

## 🏗 Tech Stack
- **Frontend**: React, Tailwind CSS
- **Backend**: FastAPI (Python), MongoDB
- **AI Models**: Google Gemini API for chatbot & AI insights
- **Cloud & Deployment**: Docker, Docker Compose

## 🚀 Installation & Setup
### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Murugavel/AI-powered-personal-finance.git
cd AI-powered-personal-finance
```

### 2️⃣ Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
npm run  dev # Start frontend server
```


## 📡 API Endpoints
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/upload-receipt` | Upload and process a bill image |
| `GET`  | `/transactions` | Fetch transaction history |
| `POST` | `/categorize` | AI-based expense categorization |
| `GET`  | `/insights` | Get AI-driven financial insights |

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing
We welcome contributions! Fork the repo, create a new branch, and submit a pull request.

## 📞 Contact
For queries or collaborations, reach out via [email@example.com](mailto:email@example.com) or visit our [GitHub Issues](https://github.com/yourusername/AI-powered-personal-finance/issues).

---
Developed with ❤️ by [Your Name](https://github.com/yourusername) 🚀
