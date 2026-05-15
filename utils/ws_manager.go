package utils

import (
	"sync"

	"github.com/gorilla/websocket"
)

// WsManager mengelola semua koneksi WebSocket yang aktif
type WsManager struct {
	Clients map[uint]*websocket.Conn
	Mu      sync.Mutex
}

var Manager = WsManager{
	Clients: make(map[uint]*websocket.Conn),
}

// Register menambahkan koneksi baru ke dalam manager
func (m *WsManager) Register(userID uint, conn *websocket.Conn) {
	m.Mu.Lock()
	defer m.Mu.Unlock()
	m.Clients[userID] = conn
}

// Unregister menghapus koneksi yang sudah terputus
func (m *WsManager) Unregister(userID uint) {
	m.Mu.Lock()
	defer m.Mu.Unlock()
	println("Unregistering user:", userID)
	delete(m.Clients, userID)
}

// BroadcastToUser mengirim pesan JSON ke user tertentu jika dia sedang online
func (m *WsManager) BroadcastToUser(userID uint, message interface{}) {
	m.Mu.Lock()
	conn, ok := m.Clients[userID]
	m.Mu.Unlock()

	if ok {
		err := conn.WriteJSON(message)
		if err != nil {
			// Jika gagal kirim (koneksi mati), hapus dari registry dan tutup koneksinya
			println("Failed to send WS message to user", userID, ":", err.Error())
			m.Unregister(userID)
			conn.Close()
		} else {
			println("Successfully broadcasted WS message to user", userID)
		}
	} else {
		println("User", userID, "is offline, skipping WS broadcast")
	}
}
