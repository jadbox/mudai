import React, { useEffect, useRef } from 'react';
import { Stethoscope } from 'lucide-react';
import type { GameMessage } from '../types/game';

interface TerminalProps {
  messages: GameMessage[];
}

export function Terminal({ messages }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden h-[50vh] lg:h-full min-h-[300px]">
      <div className="absolute top-0 left-0 right-0 bg-gray-800 p-2 flex items-center gap-2 border-b border-gray-700">
        <Stethoscope className="w-4 h-4 text-green-400" />
        <span className="text-green-400 text-sm font-mono">MASH 4077 Terminal</span>
      </div>
      <div
        ref={terminalRef}
        className="absolute inset-0 overflow-y-auto pt-12 pb-4 px-4 font-mono text-sm space-y-1 terminal-scroll"
      >
        {messages.map((msg) => (
          <div key={msg.id}>
            <div
              className={`
                ${msg.type === 'system' ? 'text-blue-400' : ''}
                ${msg.type === 'medical' ? 'text-red-400' : ''}
                ${msg.type === 'error' ? 'text-red-500' : ''}
                ${msg.type === 'info' ? 'text-green-400' : ''}
                ${msg.type === 'success' ? 'text-yellow-400' : ''}
              `}
            >
              <span className="opacity-50">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>{' '}
              {msg.content}
            </div>
            {msg.image && (
              <img 
                src={msg.image} 
                alt="MASH Scene" 
                className="my-2 rounded" 
                style={{ width: '240px', height: 'auto' }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 pointer-events-none scanlines"></div>
    </div>
  );
}