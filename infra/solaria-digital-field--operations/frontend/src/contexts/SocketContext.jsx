import React, { createContext, useContext, useEffect, useState } from 'react'
import io from 'socket.io-client'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const newSocket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001')
    
    newSocket.on('connect', () => {
      setConnected(true)
      console.log('Connected to SOLARIA DFO server')
    })
    
    newSocket.on('disconnect', () => {
      setConnected(false)
      console.log('Disconnected from SOLARIA DFO server')
    })
    
    newSocket.on('task-created', (task) => {
      toast.success(`New task created: ${task.title}`)
    })
    
    newSocket.on('task-updated', (task) => {
      toast(`Task updated: ${task.title}`, {
        icon: task.status === 'completed' ? '✅' : '🔄',
      })
    })
    
    newSocket.on('agent-status-updated', (agent) => {
      console.log(`Agent ${agent.name} status: ${agent.status}`)
    })
    
    newSocket.on('metric-updated', (metric) => {
      console.log(`New metric: ${metric.metric_type} = ${metric.value}`)
    })
    
    setSocket(newSocket)
    
    return () => {
      newSocket.close()
    }
  }, [])

  const joinProject = (projectId) => {
    if (socket) {
      socket.emit('join-project', projectId)
    }
  }

  const leaveProject = (projectId) => {
    if (socket) {
      socket.emit('leave-project', projectId)
    }
  }

  const value = {
    socket,
    connected,
    joinProject,
    leaveProject
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}