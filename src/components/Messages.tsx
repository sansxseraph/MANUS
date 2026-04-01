import React from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from '../firebase';
import { useSearchParams, Link } from 'react-router-dom';
import { User, Send, Loader2, MessageSquare, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

export const Messages: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialToId = searchParams.get('to');
  
  const [conversations, setConversations] = React.useState<any[]>([]);
  const [activeConversation, setActiveConversation] = React.useState<string | null>(initialToId);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [activePartner, setActivePartner] = React.useState<any>(null);

  // Fetch all conversations for the current user
  React.useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'messages'),
      where('fromId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const q2 = query(
      collection(db, 'messages'),
      where('toId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe1 = onSnapshot(q, (snapshot) => {
      updateConversations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)), 'sent');
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      updateConversations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)), 'received');
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [user]);

  const updateConversations = (newMsgs: any[], type: 'sent' | 'received') => {
    setConversations(prev => {
      const combined = [...prev];
      newMsgs.forEach(msg => {
        const partnerId = type === 'sent' ? msg.toId : msg.fromId;
        const partnerName = type === 'sent' ? msg.toName : msg.fromName;
        const partnerPhoto = type === 'sent' ? '' : msg.fromPhoto;
        
        const existingIdx = combined.findIndex(c => c.partnerId === partnerId);
        if (existingIdx === -1) {
          combined.push({
            partnerId,
            partnerName,
            partnerPhoto,
            lastMessage: msg.text,
            lastDate: msg.createdAt,
            unread: type === 'received' && !msg.read
          });
        } else {
          if (!combined[existingIdx].lastDate || (msg.createdAt && msg.createdAt.toMillis() > combined[existingIdx].lastDate.toMillis())) {
            combined[existingIdx].lastMessage = msg.text;
            combined[existingIdx].lastDate = msg.createdAt;
            if (type === 'received' && !msg.read) combined[existingIdx].unread = true;
          }
        }
      });
      return combined.sort((a, b) => (b.lastDate?.toMillis() || 0) - (a.lastDate?.toMillis() || 0));
    });
    setLoading(false);
  };

  // Fetch messages for active conversation
  React.useEffect(() => {
    if (!user || !activeConversation) return;

    const q = query(
      collection(db, 'messages'),
      where('fromId', 'in', [user.uid, activeConversation]),
      where('toId', 'in', [user.uid, activeConversation]),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setMessages(msgs);
      
      // Mark as read
      msgs.forEach(msg => {
        if (msg.toId === user.uid && !msg.read) {
          updateDoc(doc(db, 'messages', msg.id), { read: true });
        }
      });

      // Set partner info
      const firstMsg = msgs.find(m => m.fromId === activeConversation || m.toId === activeConversation);
      if (firstMsg) {
        setActivePartner({
          id: activeConversation,
          name: firstMsg.fromId === activeConversation ? firstMsg.fromName : firstMsg.toName,
          photo: firstMsg.fromId === activeConversation ? firstMsg.fromPhoto : ''
        });
      }
    });

    return () => unsubscribe();
  }, [user, activeConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeConversation || !newMessage.trim()) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        fromId: user.uid,
        fromName: user.displayName || 'Anonymous',
        fromPhoto: user.photoURL || '',
        toId: activeConversation,
        toName: activePartner?.name || 'Artist',
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
        read: false
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-manus-white/5 rounded-full flex items-center justify-center mb-6">
          <MessageSquare className="w-8 h-8 text-manus-white/20" />
        </div>
        <h1 className="text-2xl font-display font-black text-manus-white uppercase tracking-widest mb-4">MESSAGES</h1>
        <p className="text-manus-white/40 text-sm font-mono uppercase tracking-widest mb-8">PLEASE LOG IN TO ACCESS YOUR INBOX</p>
        <Link to="/" className="px-8 py-4 bg-manus-cyan text-manus-dark font-black text-xs uppercase tracking-[0.3em] rounded-xl hover:bg-manus-white transition-all">
          GO HOME
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-6 mb-12">
          <Link to="/profile" className="w-12 h-12 bg-manus-white/5 border border-manus-white/10 rounded-xl flex items-center justify-center hover:bg-manus-white/10 transition-all group">
            <ArrowLeft className="w-5 h-5 text-manus-white/40 group-hover:text-manus-white transition-colors" />
          </Link>
          <div>
            <h1 className="text-4xl font-display font-black text-manus-white tracking-tighter uppercase">INBOX</h1>
            <p className="text-[10px] font-mono text-manus-cyan uppercase tracking-[0.3em]">SECURE_COMMUNICATION_CHANNEL</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[70vh]">
          {/* Sidebar: Conversations */}
          <div className="lg:col-span-4 bg-manus-white/5 border border-manus-white/10 rounded-[2.5rem] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-manus-white/10">
              <div className="text-[10px] font-mono text-manus-white/40 uppercase tracking-widest">CONVERSATIONS</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 text-manus-cyan animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs font-mono text-manus-white/20 uppercase tracking-widest">NO MESSAGES YET</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.partnerId}
                    onClick={() => setActiveConversation(conv.partnerId)}
                    className={cn(
                      "w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left group",
                      activeConversation === conv.partnerId 
                        ? "bg-manus-cyan text-manus-dark" 
                        : "hover:bg-manus-white/5 text-manus-white"
                    )}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-manus-white/10 flex-shrink-0 border border-manus-white/20">
                      {conv.partnerPhoto ? (
                        <img src={conv.partnerPhoto} alt={conv.partnerName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-manus-white/40">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div className={cn(
                          "text-sm font-black uppercase tracking-wider truncate",
                          activeConversation === conv.partnerId ? "text-manus-dark" : "text-manus-white"
                        )}>
                          {conv.partnerName}
                        </div>
                        {conv.unread && activeConversation !== conv.partnerId && (
                          <div className="w-2 h-2 bg-manus-orange rounded-full" />
                        )}
                      </div>
                      <p className={cn(
                        "text-[10px] font-mono truncate",
                        activeConversation === conv.partnerId ? "text-manus-dark/60" : "text-manus-white/40"
                      )}>
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main: Chat View */}
          <div className="lg:col-span-8 bg-manus-white/5 border border-manus-white/10 rounded-[2.5rem] overflow-hidden flex flex-col">
            {activeConversation ? (
              <>
                <div className="p-6 border-b border-manus-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-manus-white/10 border border-manus-white/20">
                      {activePartner?.photo ? (
                        <img src={activePartner.photo} alt={activePartner.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-manus-white/40">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-black text-manus-white uppercase tracking-wider">{activePartner?.name || 'Artist'}</div>
                      <div className="text-[10px] font-mono text-manus-cyan uppercase tracking-widest">ONLINE_NOW</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  {messages.map((msg) => {
                    const isMe = msg.fromId === user.uid;
                    return (
                      <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                        <div className={cn(
                          "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                          isMe 
                            ? "bg-manus-white/10 text-manus-white rounded-tr-none" 
                            : "bg-manus-cyan text-manus-dark rounded-tl-none"
                        )}>
                          {msg.text}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-manus-white/20 uppercase tracking-widest">
                          {msg.createdAt ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                          {isMe && (
                            msg.read ? <CheckCheck className="w-3 h-3 text-manus-cyan" /> : <Check className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSendMessage} className="p-6 border-t border-manus-white/10">
                  <div className="relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full bg-manus-white/5 border border-manus-white/10 rounded-2xl pl-6 pr-16 py-4 text-sm text-manus-white focus:outline-none focus:border-manus-cyan transition-all"
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-manus-cyan text-manus-dark rounded-xl flex items-center justify-center hover:bg-manus-white transition-all disabled:opacity-50"
                    >
                      {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-manus-white/5 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-10 h-10 text-manus-white/10" />
                </div>
                <h3 className="text-xl font-display font-black text-manus-white uppercase tracking-widest mb-2">SELECT A CONVERSATION</h3>
                <p className="text-xs font-mono text-manus-white/40 uppercase tracking-widest">CHOOSE A PARTNER TO START CHATTING</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
