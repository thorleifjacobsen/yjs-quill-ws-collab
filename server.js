/**
 * ---------------------------------------------------------------------
 * Yjs + WebSocket + Express collaborative server
 * ---------------------------------------------------------------------
 * This minimal server handles real-time collaboration using:
 *  - Yjs CRDTs for conflict-free shared data
 *  - y-protocols/awareness for user presence & cursors
 *  - ws for WebSocket connections
 *  - Express for serving static files (the client)
 *
 * The server can:
 *   • Broadcast document updates to all clients
 *   • Track awareness (users, cursors, colors, names)
 *   • Send the current doc state to newcomers
 * ---------------------------------------------------------------------
 */

import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness.js";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";

/* ---------------------------------------------------------------------
   1. Create Express + WebSocket server
--------------------------------------------------------------------- */
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve your client files (index.html, etc.)
app.use(express.static("public"));

/* ---------------------------------------------------------------------
   2. Create a shared Y.Doc and awareness manager
--------------------------------------------------------------------- */
const ydoc = new Y.Doc(); // the shared state
const awareness = new awarenessProtocol.Awareness(ydoc); // tracks presence
// Remove the server's local awareness entry
awarenessProtocol.removeAwarenessStates(awareness, [awareness.clientID], null);

// Example shared text types (you can have many)
const ytext1 = ydoc.getText("quill-doc");
const ytext2 = ydoc.getText("plaintext-doc");

// Optional: seed initial content
ytext1.insert(0, "Hello from Yjs Quill Document!");
ytext2.insert(0, "Hello from Yjs Plaintext Document!");

/* ---------------------------------------------------------------------
   3. Handle WebSocket connections
--------------------------------------------------------------------- */
wss.on("connection", (ws) => {
  // Set socket properties
  ws.binaryType = "arraybuffer";

  console.log(`🟢 Client connected`);

  // --- When the client disconnects ---
  ws.on("close", () => {
    console.log(`🔴 Client disconnected`);


    // Remove all awareness states that belong to this WebSocket
    const clientIds = Array.from(awareness.getStates().keys());
    for (const clientId of clientIds) {
      const state = awareness.getStates().get(clientId);
      console.log(state);
      // if (state?.ws === ws) {
      //   awarenessProtocol.removeAwarenessStates(awareness, [clientId], null);
      // }
    }
  // awarenessProtocol.removeAwarenessStates(awareness, [ws.clientId], null);

    // // --- Broadcast the updated awareness to all other clients ---
    // for (const client of wss.clients) {
    //   if (client.readyState === ws.OPEN) {
    //     const enc = encoding.createEncoder();
    //     encoding.writeVarUint(enc, 1); // message type 1 = awareness update
    //     awarenessProtocol.encodeAwarenessUpdate(enc, awareness);
    //     client.send(encoding.toUint8Array(enc), { binary: true });
    //   }
    // }
  });

  ws.on("error", (err) =>
    console.error(`⚠️  WebSocket error:`, err)
  );

  /* -------------------------------------------------------------------
     4. Send the full document state to the new client
     ------------------------------------------------------------------- */
  const fullState = Y.encodeStateAsUpdate(ydoc);
  const enc = encoding.createEncoder();
  encoding.writeVarUint(enc, 0); // message type 0 = Yjs document update
  encoding.writeVarUint8Array(enc, fullState);
  ws.send(encoding.toUint8Array(enc), { binary: true });

  /* -------------------------------------------------------------------
     5. Handle incoming messages from this client
     ------------------------------------------------------------------- */
  ws.on("message", (message, isBinary) => {
    if (!isBinary) {
      console.log(`📨 Non-Yjs message: ${message.toString()}`);
      return;
    }

    const decoder = decoding.createDecoder(new Uint8Array(message));
    const messageType = decoding.readVarUint(decoder);

    // --- 5a. Document updates (type 0) ---
    if (messageType === 0) {
      const update = decoding.readVarUint8Array(decoder);
      Y.applyUpdate(ydoc, update); // merge into server doc
    }

    // --- 5b. Awareness updates (type 1) ---
    else if (messageType === 1) {
      const update = decoding.readVarUint8Array(decoder);
      awarenessProtocol.applyAwarenessUpdate(awareness, update, ws);
    }

    /* -----------------------------------------------------------------
       6. Broadcast the same message to all other clients
          (relay the binary payload directly, no decoding needed)
       ----------------------------------------------------------------- */
    for (const client of wss.clients) {
      if (client.readyState === ws.OPEN && client !== ws) {
        client.send(message, { binary: true });
      }
    }
  });
});

awareness.on("update", () => {
  // GEt all
  const all = awareness.getStates();
  console.log(all)
});

/* ---------------------------------------------------------------------
   7. Start the HTTP/WebSocket server
--------------------------------------------------------------------- */
const PORT = 3030;
server.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);

/* ---------------------------------------------------------------------
   Notes:
   • This server is "stateful": it keeps the Y.Doc in memory.
   • Restarting will lose unsaved content unless you persist ydoc.
   • For production, periodically store:
        const encoded = Y.encodeStateAsUpdate(ydoc)
     and restore with:
        Y.applyUpdate(ydoc, encoded)
--------------------------------------------------------------------- */
