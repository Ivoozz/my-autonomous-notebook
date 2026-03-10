# Notebook Pro

Notebook Pro is an autonomous, fully-featured productivity workspace combining Markdown notes, task management, calendar planning, and email integration into a single, cohesive, and visually stunning interface.

## 🚀 Features

- **📝 Advanced Markdown Editor:** Full markdown support, syntax highlighting, task lists, and reading time estimation.
- **📅 Daily Planner & Calendar:** Visually track notes and tasks against a calendar view.
- **📊 Kanban Board & Task List:** Manage tasks with a flexible List view or a Kanban Board (To Do, In Progress, Done).
- **📧 Email Integration:** Connect via IMAP/SMTP to read, reply, and convert emails directly into notes or tasks.
- **🎨 Highly Customizable:** Beautiful glassmorphism UI with light/dark modes, custom accent colors, and an animated background.
- **📱 Responsive Design:** Perfect for both desktop and mobile use, featuring a bottom navigation bar on mobile devices.
- **⌨️ Keyboard Shortcuts:** Navigate and edit efficiently without leaving your keyboard.

## 🛠 Tech Stack

### Frontend
- React 19 + Vite
- Framer Motion (Animations)
- FontAwesome (Icons)
- React Markdown + Remark GFM
- Date-fns (Date parsing)

### Backend
- Node.js & Express
- ImapFlow & Mailparser (IMAP Email handling)
- Nodemailer (SMTP Email sending)
- CORS & dotenv

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ivoozz/my-autonomous-notebook.git
   cd my-autonomous-notebook
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Variables:**
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   AUTH_PASSWORD=your_secure_password
   VALID_TOKEN=your_secure_token
   ```

### Running the App

You can run the frontend and backend concurrently.

**Start the Backend:**
```bash
cd backend
npm start
```

**Start the Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` to access Notebook Pro!

## 🔐 Authentication & Security
The app uses a simple token-based authentication system. Enter the `AUTH_PASSWORD` defined in your `.env` on the login screen to access your vault.

## 🤝 Contributing
Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License
This project is licensed under the MIT License.
