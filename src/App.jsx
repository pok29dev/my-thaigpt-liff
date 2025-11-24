import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, User, Bot, AlertCircle, MessageSquarePlus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- CONFIGURATION ---
// ใช้ environment variables จาก .env
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://cnx.thaigpt.com',
  endpoints: {
    send: '/api/send-prompt', // เรียกผ่าน Vercel serverless function
    history: '/api/get-history' // เรียกผ่าน Vercel serverless function
  },
  nodeId: import.meta.env.VITE_API_NODE_ID || '',
};

const LIFF_ID = import.meta.env.VITE_LIFF_ID || ''; 

export default function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [error, setError] = useState(null);
  
  const [runId, setRunId] = useState('');
  const [userId, setUserId] = useState('');

  const messagesEndRef = useRef(null);

  // --- UTILITIES ---

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const generateLiffRunId = (liffUserId) => {
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    if (liffUserId) {
      return `${liffUserId}_liff_${randomSuffix}`;
    }
    return `liff_${randomSuffix}`;
  };

  // --- API FUNCTIONS ---

  const fetchHistory = async (currentRunId) => {
    if (!currentRunId) return;
    
    try {
      // เรียกผ่าน Vercel serverless function (ไม่ต้องส่ง token เพราะจัดการที่ server-side)
      // ส่ง user_id เป็น '__share__' ตามที่กำหนด
      const response = await fetch(API_CONFIG.endpoints.history, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: '__share__',
          node_id: API_CONFIG.nodeId,
          run_id: currentRunId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success' && Array.isArray(data.memory)) {
        const historyMessages = [];
        data.memory.forEach((item, index) => {
          if (item.input) {
            historyMessages.push({
              id: `hist-${index}-user`,
              sender: 'user',
              text: item.input
            });
          }
          if (item.output) {
            historyMessages.push({
              id: `hist-${index}-bot`,
              sender: 'bot',
              text: item.output
            });
          }
        });

        if (historyMessages.length > 0) {
          setMessages(historyMessages);
        } else {
          setMessages([{ id: 'welcome', sender: 'bot', text: 'สวัสดีครับ เริ่มต้นการสนทนาใหม่ได้เลยครับ' }]);
        }
      } 
    } catch (err) {
      console.error('Error fetching history:', err);
      setMessages([{ id: 'welcome', sender: 'bot', text: 'สวัสดีครับ (ไม่สามารถดึงประวัติเก่าได้)' }]);
    }
  };

  // --- INITIALIZATION ---

  useEffect(() => {
    const initApp = async () => {
      setIsRestoring(true);
      
      let currentUserId = null;

      // LIFF Logic Placeholder
      
      try {
        const liff = (await import('@line/liff')).default;
        await liff.init({ liffId: LIFF_ID });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          currentUserId = profile.userId;
        }
      } catch {
        // LIFF initialization failed, will use fallback user ID
      }
      

      // ถ้าไม่มี userId จาก LIFF ให้ใช้จาก localStorage หรือสร้างใหม่
      if (!currentUserId) {
        const storedUserId = localStorage.getItem('thaigpt_user_id');
        if (storedUserId) {
          currentUserId = storedUserId;
        } else {
          // สร้าง temporary user ID สำหรับการทดสอบ (ควรใช้ LIFF ใน production)
          currentUserId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
      }
      
      localStorage.setItem('thaigpt_user_id', currentUserId);
      setUserId(currentUserId);

      let currentRunId = localStorage.getItem('thaigpt_run_id');

      if (currentRunId) {
        setRunId(currentRunId);
        await fetchHistory(currentRunId);
      } else {
        const newRunId = generateLiffRunId(currentUserId);
        setRunId(newRunId);
        localStorage.setItem('thaigpt_run_id', newRunId);
        setMessages([{ id: 'welcome', sender: 'bot', text: 'สวัสดีครับ มีอะไรให้ผมช่วยไหมครับ?' }]);
      }

      setIsRestoring(false);
    };

    initApp();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isRestoring]);


  // --- SEND MESSAGE LOGIC ---

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setError(null);

    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: userMessage }]);

    const botMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: botMsgId, sender: 'bot', text: '' }]);
    setIsLoading(true);

    try {
      // เรียกผ่าน Vercel serverless function (ไม่ต้องส่ง token เพราะจัดการที่ server-side)
      const response = await fetch(API_CONFIG.endpoints.send, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: userMessage,
          user_id: '__share__', // ใช้ fix value '__share__' สำหรับ API
          node_id: API_CONFIG.nodeId,
          run_id: runId,
          stream: 1
        })
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      if (!response.body) throw new Error('ReadableStream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          let cleanChunk = chunk;

          if (cleanChunk.includes('[RUN_ID]:')) {
            const match = cleanChunk.match(/\[RUN_ID\]:(.*?)(?:\s|$|\n)/);
            if (match && match[1]) {
              const serverRunId = match[1].trim();
              if (serverRunId !== runId) {
                setRunId(serverRunId);
                localStorage.setItem('thaigpt_run_id', serverRunId);
              }
              cleanChunk = cleanChunk.replace(/\[RUN_ID\]:.*?(?:\s|$|\n)/, ''); 
            }
          }

          if (cleanChunk.includes('[USAGE]:')) {
             cleanChunk = cleanChunk.replace(/\s*\[USAGE\]:.*?\}\s*/g, '');
          }

          cleanChunk = cleanChunk.replace(/\s*\[DONE\]\s*/g, '');
          
          accumulatedText += cleanChunk;

          setMessages(prev => prev.map(msg => 
            msg.id === botMsgId ? { ...msg, text: accumulatedText } : msg
          ));
        }
      }

    } catch (err) {
      console.error('Chat Error:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId ? { ...msg, text: 'ขออภัย ระบบเกิดข้อขัดข้อง' } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW CHAT LOGIC ---
  const handleNewChat = () => {
    if (window.confirm('เริ่มหัวข้อสนทนาใหม่?')) {
      const newRunId = generateLiffRunId(userId);
      setRunId(newRunId);
      localStorage.setItem('thaigpt_run_id', newRunId);
      
      setMessages([{ 
        id: Date.now(), 
        sender: 'bot', 
        text: `เริ่มหัวข้อใหม่แล้วครับ` 
      }]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 shadow-sm flex items-center justify-between fixed w-full top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-full flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm">ThaiGPT Chatbot</h1>
            <div className="flex items-center gap-1">
               <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></span>
               <p className="text-[10px] text-slate-500">
                 {isLoading ? 'Thinking...' : isRestoring ? 'Restoring History...' : 'Online'}
               </p>
            </div>
          </div>
        </div>
        
        {/* New Chat Button */}
        <button 
          onClick={handleNewChat} 
          className="group flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all bg-slate-100 rounded-full" 
          title="เริ่มหัวข้อใหม่"
        >
          <MessageSquarePlus size={20} />
          {/* ถ้าต้องการให้มีข้อความกำกับด้วย ให้ uncomment บรรทัดล่างนี้ */}
          {/* <span className="text-xs font-semibold hidden sm:inline">New Chat</span> */}
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto pt-20 pb-24 px-4 space-y-4 bg-slate-50">
        
        {isRestoring && (
          <div className="flex justify-center pt-10">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="animate-spin" size={16} />
              กำลังเรียกดูประวัติการสนทนา...
            </div>
          </div>
        )}

        {!isRestoring && messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 duration-200`}
          >
            <div className={`flex max-w-[85%] md:max-w-[70%] gap-2 min-w-0 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${
                msg.sender === 'user' ? 'bg-slate-700' : 'bg-white border border-slate-200'
              }`}>
                {msg.sender === 'user' ? <User size={14} className="text-white" /> : <Bot size={16} className="text-blue-600" />}
              </div>

              {/* Bubble */}
              <div className={`py-2.5 px-3.5 rounded-2xl text-sm leading-relaxed shadow-sm min-w-0 max-w-full overflow-hidden ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
              }`}>
                {msg.text ? (
                  <div className={`markdown-content ${msg.sender === 'user' ? 'markdown-user' : 'markdown-bot'}`}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ children, ...props }) => (
                          <div className="table-wrapper">
                            <table {...props}>{children}</table>
                          </div>
                        )
                      }}
                    >
                      {msg.text.trim()}
                    </ReactMarkdown>
                  </div>
                ) : (
                   <span className="flex gap-1 h-5 items-center px-1">
                     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                   </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {error && (
           <div className="flex justify-center my-2">
              <div className="bg-red-50 text-red-600 text-xs py-2 px-4 rounded-lg flex items-center gap-2 border border-red-100 shadow-sm">
                <AlertCircle size={14} />
                {error}
              </div>
           </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 w-full bg-white border-t p-3 z-20 safe-area-pb">
        <div className="max-w-screen-xl mx-auto relative">
          <div className="flex gap-2 items-end">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 bg-slate-100 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 resize-none max-h-32 min-h-[44px]"
              rows={1}
              disabled={isLoading || isRestoring}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading || isRestoring}
              className="mb-0.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-sm flex-shrink-0"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
            </button>
          </div>
          <div className="text-center mt-2 flex justify-center items-center gap-2">
             <p className="text-[10px] text-slate-400">Powered by ThaiGPT</p>
             <div className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-400 font-mono flex gap-1">
               <span>ID: {runId}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
