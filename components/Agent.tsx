import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Image as ImageIcon, Paperclip, MoreVertical, Search, Check, CheckCheck, Loader2, StopCircle, Music } from 'lucide-react';
import { Mode } from '../types';
import { db } from '../services/db';
import { processMessage } from '../services/geminiService';

interface AgentProps {
    mode?: Mode;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'agent';
    timestamp: string;
    status?: 'sent' | 'delivered' | 'read';
    attachment?: {
        type: 'image' | 'audio';
        url: string; // Base64 for preview
    };
}

const Agent: React.FC<AgentProps> = ({ mode }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Olá! Sou seu assistente financeiro. Mande uma foto de recibo, um áudio ou texto para eu registrar suas transações.',
            sender: 'agent',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'read'
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addMessage = (text: string, sender: 'user' | 'agent', attachment?: Message['attachment']) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            text,
            sender,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
            attachment
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;
        const text = inputText;
        setInputText('');
        
        addMessage(text, 'user');
        await processInput(text);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            
            addMessage("", 'user', { type: 'image', url: base64String });
            
            const base64Data = base64String.split(',')[1];
            await processInput("", { data: base64Data, mimeType: file.type });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Prioritize standard audio formats
            let mimeType = '';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
            } else {
                console.warn("No preferred mime type supported, letting browser decide.");
            }

            const mediaRecorder = mimeType 
                ? new MediaRecorder(stream, { mimeType }) 
                : new MediaRecorder(stream);
            
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Determine final blob type
                const finalMimeType = mediaRecorder.mimeType || 'audio/webm'; 
                const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
                
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64String = reader.result as string;
                    addMessage("Mensagem de Voz", 'user', { type: 'audio', url: base64String });
                    
                    const base64Data = base64String.split(',')[1];
                    await processInput("", { data: base64Data, mimeType: finalMimeType });
                };
                reader.readAsDataURL(audioBlob);
                
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const processInput = async (text: string, media?: { data: string, mimeType: string }) => {
        setIsProcessing(true);
        
        try {
            const result = await processMessage(text, media, mode);
            
            if (result) {
                // Construct DB attachment format
                let attachmentData = undefined;
                let attachmentType: 'image' | 'audio' | undefined = undefined;

                if (media) {
                    attachmentData = `data:${media.mimeType};base64,${media.data}`;
                    attachmentType = media.mimeType.startsWith('image') ? 'image' : 'audio';
                }

                await db.transactions.add({
                    description: result.description,
                    amount: result.amount,
                    type: result.type,
                    category: result.category,
                    date: result.date,
                    status: 'paid',
                    mode: mode,
                    attachment: attachmentData,
                    attachmentType: attachmentType
                });

                const formattedMoney = result.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const responseText = `✅ Transação Registrada!\n\n📄 ${result.description}\n💰 ${formattedMoney}\n📂 ${result.category}\n🗓️ ${result.date}`;
                addMessage(responseText, 'agent');
            } else {
                addMessage("Não consegui entender a transação. Tente dizer 'Gastei 50 com Uber' ou envie uma foto do recibo.", 'agent');
            }
        } catch (error) {
            console.error(error);
            addMessage("Ocorreu um erro ao processar sua solicitação. Tente novamente.", 'agent');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-[#0b141a] rounded-2xl overflow-hidden shadow-2xl relative border border-gray-800">
            {/* Left Side - Sidebar */}
            <div className="w-[350px] bg-[#111b21] border-r border-[#202c33] hidden md:flex flex-col">
                <div className="h-16 bg-[#202c33] px-4 flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-gray-500 overflow-hidden">
                        <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User" />
                    </div>
                    <div className="flex gap-4 text-[#aebac1]">
                        <BotIcon />
                        <MoreVertical size={20} />
                    </div>
                </div>
                {/* Search */}
                <div className="p-2">
                    <div className="bg-[#202c33] rounded-lg flex items-center px-4 py-2">
                        <Search size={18} className="text-[#aebac1]" />
                        <input type="text" placeholder="Pesquisar" className="bg-transparent border-none outline-none text-[#d1d7db] text-sm ml-4 w-full placeholder-[#aebac1]" />
                    </div>
                </div>
                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex items-center gap-3 p-3 bg-[#2a3942] cursor-pointer hover:bg-[#202c33]">
                         <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white">
                             <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Gerencie" alt="Bot" className="w-10 h-10" />
                         </div>
                         <div className="flex-1 border-b border-[#222d34] pb-3">
                             <div className="flex justify-between items-center mb-1">
                                 <h4 className="text-[#e9edef] font-medium">Gerencie Agent</h4>
                                 <span className="text-xs text-[#8696a0]">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                             <p className="text-sm text-[#8696a0] truncate">Olá! Sou seu assistente financeiro.</p>
                         </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Chat Area */}
            <div className="flex-1 flex flex-col relative bg-[#0b141a]">
                {/* Chat Header */}
                <div className="h-16 bg-[#202c33] px-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center overflow-hidden">
                             <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Gerencie" alt="Bot" />
                        </div>
                        <div>
                            <h4 className="text-[#e9edef] font-medium">Gerencie Agent</h4>
                            <p className="text-xs text-[#8696a0]">online</p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-4" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}>
                    
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div 
                                className={`max-w-[85%] md:max-w-[60%] rounded-lg p-2 relative shadow-sm text-sm ${
                                    msg.sender === 'user' 
                                    ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' 
                                    : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
                                }`}
                            >   
                                {msg.attachment && msg.attachment.type === 'image' && (
                                    <div className="mb-2 rounded-lg overflow-hidden">
                                        <img src={msg.attachment.url} alt="attachment" className="w-full max-h-64 object-cover" />
                                    </div>
                                )}
                                {msg.attachment && msg.attachment.type === 'audio' && (
                                    <div className="mb-2 flex items-center gap-3 bg-[#1e2a30] p-2 rounded-md min-w-[200px]">
                                        <div className={`p-2 rounded-full ${msg.sender === 'user' ? 'text-[#00a884]' : 'text-gray-400'}`}>
                                            <Music size={20} />
                                        </div>
                                        <audio controls src={msg.attachment.url} className="h-8 w-full max-w-[200px]" />
                                    </div>
                                )}
                                
                                {msg.text && <p className="whitespace-pre-wrap leading-relaxed px-1 pb-4 pt-1">{msg.text}</p>}
                                
                                <div className="absolute bottom-1 right-2 flex items-center gap-1">
                                    <span className="text-[10px] text-[#ffffff99]">
                                        {msg.timestamp}
                                    </span>
                                    {msg.sender === 'user' && (
                                        <span className={msg.status === 'read' ? 'text-[#53bdeb]' : 'text-[#8696a0]'}>
                                            <CheckCheck size={14} />
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isProcessing && (
                         <div className="flex justify-start">
                            <div className="bg-[#202c33] text-[#e9edef] rounded-lg rounded-tl-none p-3 shadow-sm flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin text-[#00a884]" />
                                <span className="text-xs text-[#8696a0]">Digitando...</span>
                            </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-[#202c33] p-3 flex items-end gap-3 z-20">
                    <button className="text-[#8696a0] hover:text-[#aebac1] mb-2 p-1">
                        <div className="relative">
                           <input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                onChange={handleImageUpload}
                                ref={fileInputRef}
                           />
                           <Paperclip size={24} />
                        </div>
                    </button>
                    
                    <div className="flex-1 bg-[#2a3942] rounded-lg flex items-center min-h-[42px] px-4 py-2">
                        <input 
                            type="text" 
                            placeholder={isRecording ? "Gravando áudio..." : "Mensagem"}
                            className="bg-transparent border-none outline-none text-[#d1d7db] w-full text-sm placeholder-[#8696a0]"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isRecording}
                        />
                        {isRecording && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse ml-2"></div>}
                    </div>

                    {inputText.trim() ? (
                        <button onClick={handleSendMessage} className="text-[#8696a0] hover:text-[#00a884] mb-2 p-1 transition-colors">
                            <Send size={24} />
                        </button>
                    ) : (
                        <button 
                            onClick={isRecording ? stopRecording : startRecording} 
                            className={`mb-2 p-2 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white shadow-lg shadow-red-500/50' : 'text-[#8696a0] hover:text-[#aebac1]'}`}
                        >
                            {isRecording ? <StopCircle size={24} /> : <Mic size={24} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const BotIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
)

export default Agent;