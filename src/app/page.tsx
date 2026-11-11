'use client';

import { useChat } from 'ai/react';

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/games',
  });

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Ask Pixel about games</h1>

      <div className="space-y-3 mb-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === 'user' ? 'text-right' : 'text-left'}
          >
            <span
              className={
                'inline-block rounded-lg px-3 py-2 ' +
                (m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black')
              }
            >
              {m.content}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2 text-black"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about game..."
        />
        <button className="bg-blue-600 text-white rounded px-4 py-2" type="submit">
          Send
        </button>
      </form>
    </main>
  );
}
