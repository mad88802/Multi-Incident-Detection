import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AiAgentPanel({ triggerToast }) {
  const [isOpen, setIsOpen] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('visionai_groq_api_key') || '')
  const [showSettings, setShowSettings] = useState(false)
  const [tempKey, setTempKey] = useState(apiKey)
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: "Hello! I am your VisionAI Copilot. 🤖\n\nAsk me anything about the system, safety protocols, or computer vision. \n\n*Tip: Click the gear icon (⚙️) above to add your Groq API Key to start chatting.*",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingStep, setTypingStep] = useState('')
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping, typingStep])

  // Save/Clear API key
  const handleSaveApiKey = (e) => {
    e.preventDefault()
    localStorage.setItem('visionai_groq_api_key', tempKey.trim())
    setApiKey(tempKey.trim())
    setShowSettings(false)
    triggerToast('accident', tempKey.trim() ? 'Groq API Key saved.' : 'Groq API Key removed.')
    
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'agent',
        text: tempKey.trim() 
          ? "🎉 **Groq API Key saved successfully!** I am now connected to Groq. Ask me anything you'd like!" 
          : "⚠️ **Groq API Key cleared.** Please add a valid key to keep chatting.",
        timestamp: new Date()
      }
    ])
  }

  // Send a message to Groq and display the reply
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue
    if (!text.trim()) return

    if (!textToSend) {
      setInputValue('')
    }

    // Add user message
    const userMsgId = Date.now()
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text,
        timestamp: new Date(),
      },
    ])

    setIsTyping(true)
    setTypingStep('Connecting to Groq API...')

    let responseText = ''

    try {
      if (!apiKey) {
        throw new Error("No Groq API Key configured. Click the ⚙️ gear icon and paste your Groq API key first.")
      }

      const systemPrompt = `You are the "VisionAI Copilot", a helpful conversational assistant for a hazard detection dashboard (fire & smoke, garbage/waste, and traffic accident detection powered by custom YOLOv8 models). Answer the user's questions clearly and helpfully, using Markdown formatting when useful. You can discuss computer vision, YOLO, safety protocols, and general topics.`

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ]
        })
      })

      if (!response.ok) {
        const errBody = await response.text().catch(() => '')
        throw new Error(`Groq API returned status code ${response.status}${errBody ? ` – ${errBody}` : ''}`)
      }

      const data = await response.json()
      responseText = data.choices?.[0]?.message?.content || "(No response received.)"
    } catch (err) {
      console.error(err)
      responseText = `⚠️ **Failed to complete request:**\n\n${err.message}\n\n*If you recently entered a Groq API Key, please check that it is valid.*`
    } finally {
      setIsTyping(false)
      setTypingStep('')
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'agent',
          text: responseText,
          timestamp: new Date(),
        },
      ])
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        className="ai-fab"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Copilot"
      >
        <div className="ai-fab-waves">
          <div className="ai-wave wave-1" />
          <div className="ai-wave wave-2" />
        </div>
        <span className="ai-fab-icon">🤖</span>
        <span className="ai-fab-text">Copilot</span>
      </button>

      {/* Sidebar Panel Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="ai-sidebar-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop overlay clicks to close */}
            <div className="ai-sidebar-overlay" onClick={() => setIsOpen(false)} />

            {/* Sidebar drawer content */}
            <motion.div
              className="ai-sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              {/* Header */}
              <div className="ai-sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="ai-agent-avatar">
                    🤖
                    <span className="ai-agent-pulse-dot" />
                  </div>
                  <div>
                    <h3 className="ai-sidebar-title">VisionAI Copilot</h3>
                    <div className="ai-sidebar-status">
                      {apiKey ? '🟢 Groq Chatbot Mode' : '⚪ No API Key Set'}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button 
                    className="ai-settings-toggle-btn"
                    onClick={() => setShowSettings(!showSettings)}
                    title="AI Configuration Settings"
                  >
                    ⚙️
                  </button>
                  <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
                    ✕
                  </button>
                </div>
              </div>

              {/* Settings Drawer Overlay */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div 
                    className="ai-settings-drawer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <form onSubmit={handleSaveApiKey} className="ai-settings-form">
                      <label>Groq API Key</label>
                      <p className="settings-desc">Required to enable the conversational chatbot.</p>
                      <div className="ai-settings-input-group">
                        <input
                          type="password"
                          placeholder="Paste AI key here..."
                          value={tempKey}
                          onChange={(e) => setTempKey(e.target.value)}
                        />
                        <button type="submit">Save</button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat messages */}
              <div className="ai-sidebar-chat">
                {messages.map((m) => (
                  <div key={m.id} className={`chat-bubble-row ${m.sender}`}>
                    {m.sender === 'agent' && (
                      <div className="chat-avatar-mini">🤖</div>
                    )}
                    <div className="chat-bubble-container">
                      <div className="chat-bubble">
                        {/* Text formatting (markdown support) */}
                        {m.text.split('\n').map((line, idx) => {
                          let formattedLine = line
                          
                          // Code tags `code`
                          const codeRegex = /`(.*?)`/g
                          formattedLine = formattedLine.replace(codeRegex, '<code class="ai-inline-code">$1</code>')

                          // Bold **text**
                          const boldRegex = /\*\*(.*?)\*\*/g
                          let matches = [...formattedLine.matchAll(boldRegex)]
                          matches.forEach((match) => {
                            formattedLine = formattedLine.replace(
                              match[0],
                              `<strong style="color:var(--accent-2)">${match[1]}</strong>`
                            )
                          })

                          // Headers ### text
                          if (formattedLine.trim().startsWith('### ')) {
                            return <h4 key={idx} style={{ margin: '14px 0 8px 0', color: 'var(--text-primary)' }}>{formattedLine.trim().substring(4)}</h4>
                          }
                          if (formattedLine.trim().startsWith('#### ')) {
                            return <h5 key={idx} style={{ margin: '12px 0 6px 0', color: 'var(--text-primary)' }}>{formattedLine.trim().substring(5)}</h5>
                          }

                          // List items
                          if (formattedLine.trim().startsWith('* ') || formattedLine.trim().startsWith('- ')) {
                            formattedLine = `• ${formattedLine.trim().substring(2)}`
                            return (
                              <p
                                key={idx}
                                style={{ margin: '0 0 4px 12px', color: 'var(--text-secondary)' }}
                                dangerouslySetInnerHTML={{ __html: formattedLine }}
                              />
                            )
                          }

                          return (
                            <p
                              key={idx}
                              style={{ margin: line ? '0 0 6px 0' : '10px 0 0 0' }}
                              dangerouslySetInnerHTML={{ __html: formattedLine }}
                            />
                          )
                        })}

                      </div>
                      <span className="chat-time">
                        {m.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Thinking Indicators */}
                {isTyping && (
                  <div className="chat-bubble-row agent">
                    <div className="chat-avatar-mini">🤖</div>
                    <div className="chat-bubble-container">
                      <div className="chat-bubble thinking">
                        <div className="thinking-dots">
                          <span />
                          <span />
                          <span />
                        </div>
                        {typingStep && (
                          <div className="thinking-step-text">{typingStep}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Form */}
              <form
                className="ai-sidebar-input"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
              >
                <input
                  type="text"
                  placeholder="Ask a question or enter a command..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isTyping}
                />
                <button type="submit" disabled={isTyping || !inputValue.trim()}>
                  Send
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
