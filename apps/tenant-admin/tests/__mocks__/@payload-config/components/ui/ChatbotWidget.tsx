import React, { useState } from 'react'

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div data-testid="chatbot-widget">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open chatbot"
        data-testid="chatbot-button"
      >
        Chat
      </button>
      {isOpen && (
        <div data-testid="chatbot-dialog">
          <div data-testid="chatbot-messages"></div>
          <input type="text" placeholder="Type a message" data-testid="chatbot-input" />
          <button data-testid="chatbot-send">Send</button>
        </div>
      )}
    </div>
  )
}

export default ChatbotWidget
