# 🧠 Real-Time Collaborative Editor with Yjs, WebSockets & Quill

A minimal, from-scratch example showing how to build a **real-time collaborative text editor** with custom websocket implementation instead of y-websocket.

- [Yjs](https://github.com/yjs/yjs) for CRDT-based shared state  
- [Quill](https://quilljs.com) as a rich text editor  
- [y-protocols/awareness](https://github.com/yjs/y-protocols) for presence and cursors  
- [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) for peer sync  
- [Express](https://expressjs.com) as a static server and message relay  

This setup works without `y-websocket` or third-party providers — the sync protocol and awareness handling are implemented manually for learning and flexibility.

---

## 🚀 Features

✅ Real-time collaborative editing  
✅ Shared cursors with user names and colors   
✅ Express + WS backend (no external dependencies)  
✅ Quill WYSIWYG front-end with Yjs sync  
✅ Simple, extensible server logic (ideal for learning or custom providers)

---

## 📦 Installation

Clone and install:

```bash
git clone https://github.com/thorleifjacobsen/yjs-quill-ws-collab.git
cd yjs-quill-ws-collab
npm install
```

---

## ▶️ Usage

Run the server:

```bash
node server.js
```

Then open:

```bash
http://localhost:3030
```

Open the same page in multiple browser tabs — you’ll see real-time updates and cursor awareness.

---

## 🧩 Architecture

### Server (`server.js`)
- Uses **Express** to serve `/public`
- Creates a **Y.Doc** to store shared content
- Uses **y-protocols/awareness** to track active users (names, colors, cursors)
- Uses **WebSocketServer** from `ws` to broadcast Yjs document and awareness updates
- Optionally persists Yjs document state

### Client (`/public/index.html`)
- Initializes a local `Y.Doc`
- Binds it to a Quill editor via `y-quill`
- Sets up an awareness object for user presence
- Sends and receives encoded binary Yjs updates over WebSocket
- Displays user cursors via `quill-cursors`
- Keeps cursor name labels always visible using CSS overrides

---

## 🧠 How It Works

1. Each browser creates its own local Yjs document (`Y.Doc`).
2. When a user types, Yjs generates updates and sends them to the server via WebSocket.
3. The server rebroadcasts updates to all clients.
4. Yjs merges concurrent edits seamlessly (CRDT magic).
5. Awareness updates (user name, color, cursor position) are synced the same way.
6. Quill displays those as live cursors with names and colors.

---

## 🧩 Awareness Notes

- No implementation of user leaving yet.
- Somewhat buggy, not quite done with this.
- The server has its own internal awareness entry (empty `{}`) this is removed using:

```js
awarenessProtocol.removeAwarenessStates(awareness, [awareness.clientID], null)
```

- Client awareness entries include:

```json
{
  user: { name: "User-1234", color: "#aabbcc" },
  selection: { index: 5, length: 2 }
}
```
---

## 🎨 Always Show Cursor Labels

Add this CSS to your page to keep user name tags visible:

```css
.ql-cursor-flag {
  opacity: 1 !important;
  visibility: visible !important;
  display: flex !important;
}
.ql-cursor-name {
  display: inline !important;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 11px;
}
```

---

## 🧱 Folder Structure

```bash
yjs-quill-ws-collab/
│
├── public/
│   ├── index.html     # Client with Quill + Yjs + Awareness
│
├── server.js          # Express + WebSocket relay server
├── package.json
└── README.md
```

---

## 📚 Resources

- [Yjs Docs](https://docs.yjs.dev/)
- [Quill Docs](https://quilljs.com/docs/)
- [y-protocols](https://github.com/yjs/y-protocols)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [CRDT Explained](https://josephg.com/blog/crdts-go-brrr/)
- [Source of inspiration: 
szilu](https://github.com/cloudillo/cloudillo/blob/main/server/src/ws-doc.ts#L49)

---

## 🧑‍💻 Author

Built for learning and exploration by Thorleif Jacobsen.  
Feel free to fork, modify, and extend! The point is to make it easy for others to learn how to use Yjs more raw.

