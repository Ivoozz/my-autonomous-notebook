# Notebook Pro 🚀

Notebook Pro is an autonomous, fully-featured productivity workspace designed for the modern professional. It combines Markdown notes, advanced task management, calendar planning, a secure password vault, and deep email integration into a single, visually stunning glassmorphic interface.

## ✨ Features

- **📝 Advanced Markdown Editor:** Full-featured editor with real-time preview, syntax highlighting, task list support, and reading time estimation.
- **📅 Daily Planner & Calendar:** Integrated calendar view to schedule and track notes and tasks chronologically using `react-calendar`.
- **📊 Dynamic Task Management:** Flexible task organization with both List and Kanban board (To Do, In Progress, Done) views.
- **🔐 Secure Password Vault:** A dedicated, encrypted space to store and manage your credentials safely within the workspace.
- **📧 Native Email Client:** Direct IMAP/SMTP integration allows you to read, reply, and manage emails without leaving the app.
- **🎨 Glassmorphic UI:** A beautiful, modern interface powered by Framer Motion animations, Lucide icons, and FontAwesome.
- **📱 Fully Responsive:** Seamless experience across desktop and mobile devices, including a dedicated mobile navigation system.
- **⚡ Performance & Security:** Optimized with React 19, Vite 7, and a hardened Express 5 backend featuring rate limiting and Helmet protection.

## 🛠 Tech Stack

### Frontend
- **React 19 + Vite 7** (Core Framework & Build Tool)
- **Framer Motion** (Smooth UI Transitions & Animations)
- **Lucide React & FontAwesome** (Iconography)
- **React Markdown + Remark GFM** (Note Rendering)
- **React Calendar** (Scheduling Interface)
- **Crypto-JS** (Client-side Security)
- **Date-fns** (Date Utility)

### Backend
- **Node.js & Express 5** (Server-side Logic)
- **ImapFlow & Mailparser** (IMAP Email handling)
- **Nodemailer** (SMTP Email sending)
- **Bcryptjs** (Password hashing)
- **Helmet & Express Rate Limit** (Security Middleware)

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ivoozz/my-autonomous-app.git
   cd my-autonomous-app
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

4. **Environment Configuration:**
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   AUTH_PASSWORD=your_secure_password
   VALID_TOKEN=your_secure_token
   # Add your IMAP/SMTP credentials here for email integration
   ```

### Running the Application

**Production (Nginx Proxy):**
The application is typically served via Nginx on **Port 80**.
- **Frontend:** Accessible at `http://your-server-ip/`
- **Backend API:** Proxied to `http://localhost:5000/api/`

**Development:**
If running manually for development:
1. **Start the Backend:**
   ```bash
   cd backend
   npm start # Runs on port 5000
   ```
2. **Start the Frontend:**
   ```bash
   cd frontend
   npm run dev # Typically runs on port 5173
   ```

Visit `http://localhost:80` (or your server's IP) to access your workspace!

## ⚙️ Maintenance Scripts
The project includes several automation scripts for UI and functionality updates:
- `fix_sidebar.py`: Resolves common sidebar layout issues.
- `update_app.py`: Main orchestration script for application-wide updates.
- `update_css.py`: Automated styling and theme adjustments.
- `update_sidebar.py`: Updates sidebar items and navigation structure.

## 🤝 Contributing
Contributions are welcome! If you have suggestions or find bugs, please open an issue or submit a pull request.

## 📄 License
This project is licensed under the MIT License.
