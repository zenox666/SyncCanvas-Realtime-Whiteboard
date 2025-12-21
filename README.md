# 🎨 SyncCanvas - Real-Time Collaborative Whiteboard

![Project Demo](demo.png)
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

## 📦 Dependencies

Before running the project, ensure you have **Node.js** installed.

### Backend Dependencies (`/server`)
* **express**: Web framework for Node.js.
* **socket.io**: Enables real-time, bidirectional communication.
* **cors**: Middleware to enable Cross-Origin Resource Sharing (allows frontend to talk to backend).
* **nodemon**: (Dev) Automatically restarts the server when code changes.

### Frontend Dependencies (`/client`)
* **socket.io-client**: Connects the React frontend to the Socket.io server.
* **react** & **react-dom**: Core React libraries.

---

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

## Future Improvements
There are a few things I plan to add to make this project even better:

* **Database Integration:** Currently, tasks are stored in memory. I plan to add **MongoDB** to save data permanently.
* **User Accounts:** Implement **Firebase Auth** so users can have private boards.
* **Mobile Touch Support:** Improve the drawing experience on smaller touchscreens.
* **Color Picker:** Allow users to choose different brush colors and sizes.
