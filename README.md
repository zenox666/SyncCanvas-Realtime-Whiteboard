# 🎨 SyncCanvas - Real-Time Collaborative Whiteboard

SyncCanvas is a web application that allows multiple users to draw on a shared whiteboard simultaneously. I built this project to solve the problem of explaining diagrams and concepts to friends while studying remotely.

It uses **WebSockets** to synchronize drawing data in real-time with sub-100ms latency.

## 🚀 Tech Stack
* **Frontend:** React.js, HTML5 Canvas API
* **Backend:** Node.js, Express.js
* **Real-Time Engine:** Socket.io
* **Styling:** CSS3

## ✨ Features
* **Real-Time Synchronization:** Drawings appear instantly on all connected devices.
* **Multi-User Support:** Handles multiple connections seamlessly.
* **Cross-Device:** Works on Laptops, Tablets, and Mobile phones (with touch support).
* **Clean Interface:** Distraction-free drawing area.

## 🛠️ How to Run Locally

This project is divided into two parts: `client` (Frontend) and `server` (Backend). You need to run both terminals simultaneously.

### 1. Clone the Repository
```bash
git clone https://github.com/zenox666/SyncCanvas-Realtime-Whiteboard.git
cd SyncCanvas
```
### 2. Setup the Backend (Server)
Open a terminal and run:
```bash
cd server
npm install        
node index.js
```
### 3. Setup the Frontend (Client)
Open a new terminal and run:
```bash
cd client
npm install       
npm start
```
The application will automatically open at http://localhost:3000

---

## 📂 Project Structure
```
SyncCanvas/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── App.js          # Main Canvas Logic & Socket Listeners
│   │   └── App.css         # Styling
│   └── package.json
└── server/                 # Node.js Backend
    ├── index.js            # Express Server & Socket.io Configuration
    └── package.json
```

---

## Future Improvements:

- Add color selection.
- Implement "Undo" functionality.
- Add a "Save as Image" button.
