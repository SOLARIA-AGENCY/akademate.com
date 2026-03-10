import React, { useState } from 'react'

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div data-testid="chatbot-widget" data-oid="q2b-7g1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open chatbot"
        data-testid="chatbot-button"
        data-oid="l20274x"
      >
        Chat
      </button>
      {isOpen && (
        <div data-testid="chatbot-dialog" data-oid="8vz2x_4">
          <div data-testid="chatbot-messages" data-oid="korvc40"></div>
          <input
            type="text"
            placeholder="Type a message"
            data-testid="chatbot-input"
            data-oid="0r3.._8"
          />
          <button data-testid="chatbot-send" data-oid="u.:mh6.">
            Send
          </button>
        </div>
      )}
    </div>
  )
}

export default ChatbotWidget
