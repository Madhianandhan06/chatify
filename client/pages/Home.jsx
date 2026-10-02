import { useEffect, useRef, useState } from 'react'

const API_URL = 'http://localhost:3000'
const SOCKET_URL = 'ws://localhost:3000'

function getId(value) {
  return value == null ? '' : String(value)
}

function Home({ user }) {
  const currentUserId = getId(user?._id)
  // console.log(currentUserId);
  
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  console.log(selectedUser);
  
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [usersLoading, setUsersLoading] = useState(true)
  const [conversationLoading, setConversationLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [conversationError, setConversationError] = useState('')
  const [socketConnected, setSocketConnected] = useState(false)
  const [socketError, setSocketError] = useState('')

  const socketRef = useRef(null)
  const selectedUserRef = useRef(null)
  // console.log(selectedUserRef);
  
  const conversationRequestRef = useRef(0)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    let active = true

    async function loadUsers() {
      setUsersLoading(true)
      setUsersError('')

      try {
        const response = await fetch(`${API_URL}/auth/users`, {
          credentials: 'include',
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Could not load users.')
        }
        if (!Array.isArray(data)) {
          throw new Error('Unexpected response while loading users.')
        }

        if (active) setUsers(data)
      } catch (error) {
        if (active) {
          setUsersError(error.message || 'Could not load users.')
        }
      } finally {
        if (active) setUsersLoading(false)
      }
    }

    loadUsers()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    const socket = new WebSocket(SOCKET_URL)
    socketRef.current = socket

    socket.onopen = () => {
      if (!active) return
      setSocketConnected(true)
      setSocketError('')
    }

    socket.onmessage = (event) => {
      if (!active) return

      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'error') {
          setSocketError(payload.message || 'Message could not be sent.')
          return
        }

        const message = payload.message
        const selectedId = getId(selectedUserRef.current?._id)
        const senderId = getId(message?.sender)
        const receiverId = getId(message?.receiver)
        const belongsToOpenChat = selectedId
          && currentUserId
          && ((senderId === currentUserId && receiverId === selectedId)
            || (senderId === selectedId && receiverId === currentUserId))

        if (payload.type !== 'chat' || !message || !belongsToOpenChat) return

        setMessages((current) => (
          current.some((existing) => getId(existing._id) === getId(message._id))
            ? current
            : [...current, message]
        ))
      } catch (error) {
        console.error('Invalid WebSocket payload:', error)
      }
    }

    socket.onerror = () => {
      if (active) {
        setSocketError('Chat connection failed. Try refreshing the page.')
      }
    }

    socket.onclose = () => {
      if (!active) return
      setSocketConnected(false)
      if (socketRef.current === socket) {
        socketRef.current = null
      }
      setSocketError('Chat connection closed. Refresh the page to reconnect.')
    }

    return () => {
      active = false
      if (socketRef.current === socket) {
        socketRef.current = null
      }
      socket.close()
    }
  }, [currentUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function openConversation(otherUser) {
    const requestId = conversationRequestRef.current + 1
    conversationRequestRef.current = requestId
    selectedUserRef.current = otherUser
    setSelectedUser(otherUser)
    setMessages([])
    setDraft('')
    setConversationError('')
    setConversationLoading(true)

    try {
      const response = await fetch(`${API_URL}/messages/${otherUser._id}`, {
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not load this conversation.')
      }
      if (!Array.isArray(data)) {
        throw new Error('Unexpected response while loading conversation.')
      }

      if (conversationRequestRef.current === requestId) {
        setMessages(data)
      }
    } catch (error) {
      if (conversationRequestRef.current === requestId) {
        setConversationError(error.message || 'Could not load this conversation.')
      }
    } finally {
      if (conversationRequestRef.current === requestId) {
        setConversationLoading(false)
      }
    }
  }

  function closeConversation() {
    conversationRequestRef.current += 1
    selectedUserRef.current = null
    setSelectedUser(null)
    setMessages([])
    setDraft('')
    setConversationError('')
  }

  function sendMessage(event) {
    event.preventDefault()
    const text = draft.trim()
    const socket = socketRef.current

    if (!text || !selectedUser) {
      return
    }

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setSocketError('Chat is not connected yet. Please try again in a moment.')
      return
    }

    try {
      socket.send(JSON.stringify({
        type: 'chat',
        receiverId: selectedUser._id,
        text,
      }))
      setDraft('')
      setSocketError('')
    } catch (error) {
      console.error('Failed to send message:', error)
      setSocketError('Message could not be sent. Please try again.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-2xl bg-white shadow-lg">
        <aside className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-slate-200 md:w-80`}>
          <header className="border-b border-slate-200 p-5">
            <h1 className="text-2xl font-semibold">Chatify</h1>
            <p className="mt-1 truncate text-sm text-slate-500">
              Signed in as {user?.name || user?.email || 'User'}
            </p>
          </header>

          <section className="flex-1 overflow-y-auto p-3">
            <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              People
            </h2>

            {usersLoading && (
              <p className="px-2 py-4 text-sm text-slate-500">Loading people…</p>
            )}
            {usersError && (
              <p role="alert" className="px-2 py-4 text-sm text-red-600">{usersError}</p>
            )}
            {!usersLoading && !usersError && users.length === 0 && (
              <p className="px-2 py-4 text-sm text-slate-500">No other users yet.</p>
            )}

            <ul className="space-y-1">
              {users.map((person) => {
                const isSelected = getId(selectedUser?._id) === getId(person._id)

                return (
                  <li key={person._id}>
                    <button
                      type="button"
                      onClick={() => openConversation(person)}
                      aria-current={isSelected ? 'true' : undefined}
                      className={`w-full rounded-lg px-3 py-3 text-left transition ${
                        isSelected
                          ? 'bg-blue-50 text-blue-900'
                          : 'hover:bg-slate-100'
                      }`}
                    >
                      <span className="block truncate font-medium">{person.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Open conversation
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <footer className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            <span className={`mr-2 inline-block h-2 w-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-slate-400'}`} />
            {socketConnected ? 'Connected' : 'Connecting…'}
          </footer>
        </aside>

        <section className={`${selectedUser ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
          {selectedUser ? (
            <>
              <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closeConversation}
                  className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 md:hidden"
                >
                  Back
                </button>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{selectedUser.name}</h2>
                  <p className="text-xs text-slate-500">
                    {socketConnected ? 'Connected' : 'Reconnecting…'}
                  </p>
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 sm:p-6">
                {conversationLoading && (
                  <p className="text-sm text-slate-500">Loading conversation…</p>
                )}
                {conversationError && (
                  <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {conversationError}
                  </p>
                )}
                {!conversationLoading && !conversationError && messages.length === 0 && (
                  <p className="text-center text-sm text-slate-500">
                    No messages yet. Say hello!
                  </p>
                )}
                {messages.map((message) => {
                  const isOwnMessage = getId(message.sender) === currentUserId

                  return (
                    <div
                      key={message._id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <p className={`max-w-[85%] whitespace-pre-wrap wrap-break-word rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-900 shadow-sm'
                      }`}
                      >
                        {message.text}
                      </p>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {socketError && (
                <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {socketError}
                </p>
              )}

              <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-200 p-3 sm:p-4">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={500}
                  aria-label="Message"
                  placeholder="Write a message…"
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="hidden flex-1 flex-col items-center justify-center p-8 text-center md:flex">
              <h2 className="text-xl font-semibold">Your conversations</h2>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Choose someone from the list to view your messages and start chatting.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Home
