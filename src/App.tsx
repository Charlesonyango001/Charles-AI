import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Sparkles, Brain, Zap, Terminal, User, BookOpen, 
  Briefcase, PenTool, Search, MessageSquare, History, 
  Mic, MicOff, Volume2, VolumeX, Globe, Image as ImageIcon,
  ChevronRight, LayoutDashboard, Settings, LogOut,
  Code, GraduationCap, TrendingUp, Lightbulb, Download, Plus,
  Bug, Smartphone, FolderTree, RefreshCcw, AlertTriangle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { MetacognitionWidget } from './components/MetacognitionWidget';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  timestamp: any;
  chatId?: string;
  imageUrl?: string;
  multimodal?: boolean;
  metacognition?: {
    knowledge: {
      selfAwareness: string;
      taskAwareness: string;
      strategicAwareness: string;
    };
    regulation: {
      plan: string;
      monitor: string;
      evaluation: string;
    };
  };
}

const AGENTS = [
  { id: 'General', icon: Sparkles, label: 'Charles General', color: 'blue' },
  { id: 'Teaching', icon: GraduationCap, label: 'Mwalimu Charles', color: 'orange' },
  { id: 'Coding', icon: Code, label: 'Charles Architect', color: 'purple' },
  { id: 'Business', icon: TrendingUp, label: 'Coach Charles', color: 'emerald' },
  { id: 'Creative', icon: PenTool, label: 'Creative Charles', color: 'pink' },
  { id: 'Research', icon: Brain, label: 'Researcher Charles', color: 'cyan' },
];

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]); // To store all for search/history
  const [currentChatId, setCurrentChatId] = useState<string>(Math.random().toString(36).substring(7));
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [input, setInput] = useState('');
  const [activeAgent, setActiveAgent] = useState('General');
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [imageFormat, setImageFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [creativeStyle, setCreativeStyle] = useState('Photorealistic');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [voiceGender, setVoiceGender] = useState<'masculine' | 'feminine'>('masculine');
  const [autoReadAloud, setAutoReadAloud] = useState(false);
  const [isLiveConsciousness, setIsLiveConsciousness] = useState(true);
  const [useMetacognition, setUseMetacognition] = useState(true);
  const [activeThoughts, setActiveThoughts] = useState<string[]>([
    "Initializing neural synapse matrix...",
    "Live Consciousness stream established successfully."
  ]);
  const [currentThought, setCurrentThought] = useState("Monitoring system parameters for optimal performance...");
  const [isThoughtsConsoleOpen, setIsThoughtsConsoleOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLiveConsciousness) return;

    const generalThoughts = [
      "Analyzing query vectors against sub-Saharan socio-linguistic benchmarks...",
      "Calibrating emotional empathy registers for current dialogue flow...",
      "Streaming low-latency response-generation models...",
      "Sheng slang dictionary loaded successfully. Swahili semantics verified.",
      "Optimizing response tokens for Low-Data presentation modes..."
    ];

    const teachingThoughts = [
      "Loading pedagogical curriculum maps for East African secondary syllabus...",
      "Structuring explanation nodes into high-retention mnemonic schemas...",
      "Verifying mathematical and scientific derivation paths for accuracy...",
      "Converting complex thesis statements into simple, digestible student notes..."
    ];

    const codingThoughts = [
      "Constructing abstract syntax branches for software deployment...",
      "Analyzing code block complexity constraints... (O(1) time complexity constraints checked)",
      "Evaluating type integrity checks. React 18+ module bounds active.",
      "Designing optimal data-flow architectures for full-stack compatibility...",
      "Simulating virtual environment variables and server port parameters..."
    ];

    const businessThoughts = [
      "Structuring side-hustle monetization models for Kenya/Nigeria startup ecosystems...",
      "Synthesizing market-risk ratios and evaluating cash-flow timelines...",
      "Calibrating growth hacks for localized audience acquisition models...",
      "Mapping customer journey retention curves for enterprise workflows..."
    ];

    const creativeThoughts = [
      "Simulating high-density chroma maps and aspect-ratio dimensions...",
      "Generating artistic layouts using Gemini 2.5 Flash Creative model...",
      "Engineering photographic prompts with multi-point lighting parameters...",
      "Calibrating aspect-ratio bounds: 1:1, 16:9, or mobile 9:16 styles..."
    ];

    const researchThoughts = [
      "Deep-scanning historical archive references and peer-reviewed journals...",
      "Parsing semantic structures and cataloguing index keys...",
      "Verifying synthesis matrices for cross-domain empirical integrity...",
      "Filtering source reliability weights to maximize objectivity..."
    ];

    const interval = setInterval(() => {
      let pool = generalThoughts;
      if (activeAgent === 'Teaching') pool = teachingThoughts;
      else if (activeAgent === 'Coding') pool = codingThoughts;
      else if (activeAgent === 'Business') pool = businessThoughts;
      else if (activeAgent === 'Creative') pool = creativeThoughts;
      else if (activeAgent === 'Research') pool = researchThoughts;

      // Select random thought
      const randomT = pool[Math.floor(Math.random() * pool.length)];
      setCurrentThought(randomT);
      setActiveThoughts(prev => [randomT, ...prev.slice(0, 49)]); // keep last 50 thoughts
    }, 6000);

    return () => clearInterval(interval);
  }, [isLiveConsciousness, activeAgent]);

  // Stop reading if component unmounts or chat ID changes
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentChatId]);

  // Monitor and catch Progressive Web App install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      // Don't override guest user state if they are in guest mode
      if (u) {
        setUser(u);
      }
    });
    return () => unsubAuth();
  }, []);

  const addChatMessage = async (msgData: {
    role: 'user' | 'assistant';
    content: string;
    agent?: string;
    imageUrl?: string;
    multimodal?: boolean;
    chatId?: string;
    metacognition?: any;
  }) => {
    if (!user) return null;
    
    const targetChatId = msgData.chatId || currentChatId;
    const msgObj: any = {
      userId: user.uid,
      chatId: targetChatId,
      role: msgData.role,
      content: msgData.content,
      agent: msgData.agent || activeAgent,
      timestamp: serverTimestamp(),
      ...(msgData.imageUrl && { imageUrl: msgData.imageUrl }),
      ...(msgData.multimodal && { multimodal: msgData.multimodal }),
      ...(msgData.metacognition && { metacognition: msgData.metacognition })
    };

    if (user.uid === 'guest') {
      const localMsgObj = {
        ...msgObj,
        id: Math.random().toString(36).substring(7),
        timestamp: { seconds: Math.floor(Date.now() / 1000) }
      };

      const storedAllMsgs = localStorage.getItem('guest_messages_all');
      let currentAll: ChatMessage[] = [];
      if (storedAllMsgs) {
        try {
          currentAll = JSON.parse(storedAllMsgs);
        } catch (e) {
          currentAll = [];
        }
      }

      const updatedAllMessages = [...currentAll, localMsgObj as any];
      setAllMessages(updatedAllMessages);

      const filtered = updatedAllMessages.filter(m => m.chatId === targetChatId);
      setMessages(filtered);

      localStorage.setItem('guest_messages_all', JSON.stringify(updatedAllMessages));
      return localMsgObj;
    } else {
      return await addDoc(collection(db, 'messages'), msgObj);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.uid === 'guest') {
        const storedAllMsgs = localStorage.getItem('guest_messages_all');
        let parsedAll: ChatMessage[] = [];
        if (storedAllMsgs) {
          try {
            parsedAll = JSON.parse(storedAllMsgs);
          } catch (e) {
            parsedAll = [];
          }
        }
        setAllMessages(parsedAll);
        setMessages(parsedAll.filter(m => m.chatId === currentChatId));
        return;
      }

      // Fetch ALL messages for search and history
      const qAll = query(
        collection(db, 'messages'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'asc')
      );
      const unsubAll = onSnapshot(qAll, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setAllMessages(msgs);
      });

      // Fetch CURRENT chat messages
      const q = query(
        collection(db, 'messages'),
        where('userId', '==', user.uid),
        where('chatId', '==', currentChatId),
        orderBy('timestamp', 'asc')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setMessages(msgs);
      });
      return () => {
        unsubAll();
        unsub();
      };
    } else {
      setMessages([]);
      setAllMessages([]);
    }
  }, [user, currentChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (
        error?.code === 'auth/cancelled-popup-request' ||
        error?.code === 'auth/popup-closed-by-user' ||
        error?.message?.includes('cancelled-popup-request') ||
        error?.message?.includes('popup-closed-by-user')
      ) {
        console.warn("Sign-in popup closed or cancelled by the user:", error.message);
        return;
      }
      if (error?.code === 'auth/popup-blocked') {
        setAuthError("The sign-in popup was blocked by your browser. Please disable your pop-up blocker and try again.");
        return;
      }
      console.error("Firebase Authentication Error:", error);
      const isUnauthDomain = error?.code === 'auth/unauthorized-domain' || 
                             error?.message?.includes('unauthorized-domain') ||
                             error?.code === 'auth/unauthorized-auth-domain' ||
                             error?.message?.includes('unauthorized-auth-domain');
      if (isUnauthDomain) {
        setAuthError("unauthorized-domain");
      } else {
        setAuthError("Authentication failed: " + (error?.message || error));
      }
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'en' ? 'en-US' : 'sw-KE';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  const handleSpeech = (msgId: string, text: string) => {
    if (!text) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Remove markdown symbols for clean reading
    let cleanText = text.replace(/[*_#`~>]/g, '').trim();
    // Safely bypass large system console logs or block triggers so speech feels conversational
    cleanText = cleanText.replace(/```[\s\S]*?```/g, '[code block omitted]');

    if (!cleanText) return;

    // Brief timeout ensures browsers have fully canceled preceding speech queues
    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Dynamic search for premium natural-sounding voice
        const voices = window.speechSynthesis.getVoices();
        const preferredLang = language === 'en' ? 'en' : 'sw';
        const filteredVoices = voices.filter(v => v.lang.toLowerCase().startsWith(preferredLang));

        let bestVoice: SpeechSynthesisVoice | null = null;
        if (filteredVoices.length > 0) {
          const scored = filteredVoices.map(v => {
            const name = v.name.toLowerCase();
            let score = 0;

            // Prioritize high-quality natural/neural/online speech engines
            if (name.includes('natural') || name.includes('neural')) score += 100;
            if (name.includes('online')) score += 80;
            if (name.includes('google')) score += 50;
            if (name.includes('siri')) score += 45;
            if (name.includes('apple')) score += 30;
            if (name.includes('premium')) score += 25;

            // Target physical gender markers
            const isMasculine = 
              name.includes('male') || 
              name.includes('david') || 
              name.includes('guy') || 
              name.includes('george') || 
              name.includes('mark') || 
              name.includes('daniel') || 
              name.includes('steve') || 
              name.includes('thomas') ||
              name.includes('richard') ||
              name.includes('ravi') ||
              name.includes('james');

            const isFeminine = 
              name.includes('female') || 
              name.includes('zira') || 
              name.includes('aria') || 
              name.includes('samantha') || 
              name.includes('susan') || 
              name.includes('hazel') || 
              name.includes('melina') || 
              name.includes('siri') ||
              name.includes('karen') ||
              name.includes('clara') ||
              name.includes('veena') ||
              name.includes('tessa') ||
              name.includes('moira') ||
              name.includes('mary');

            if (voiceGender === 'masculine') {
              if (isMasculine) score += 40;
              else if (isFeminine) score -= 40;
            } else {
              if (isFeminine) score += 40;
              else if (isMasculine) score -= 40;
            }

            return { voice: v, score };
          });

          scored.sort((a, b) => b.score - a.score);
          bestVoice = scored[0].voice;
        }

        if (bestVoice) {
          utterance.voice = bestVoice;
        } else {
          utterance.lang = language === 'en' ? 'en-US' : 'sw-KE';
        }

        // Human-like rhythm configuration
        utterance.rate = 0.95; // Conversational, well-paced flow (mimicing ChatGPT)
        utterance.pitch = voiceGender === 'masculine' ? 0.92 : 1.05; // Deeper resonant male, brighter clear female
        utterance.volume = 1.0;

        utterance.onstart = () => {
          setSpeakingMsgId(msgId);
        };

        utterance.onend = () => {
          setSpeakingMsgId(null);
        };

        utterance.onerror = (err) => {
          console.warn("Speech Synthesis error/cancelled:", err);
          setSpeakingMsgId(null);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Speech Synthesis failed:", err);
        setSpeakingMsgId(null);
      }
    }, 50);
  };

  const handleDownload = (url: string, filename: string = 'charles-ai-creation.png') => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateImage = async () => {
    if (!input.trim() || !user || isProcessing) return;

    const prompt = input;
    const format = imageFormat;
    const ratio = aspectRatio;
    const style = creativeStyle;
    const imageToEdit = editingImage;

    setInput('');
    setIsProcessing(true);
    setIsGeneratingImage(true);

    try {
      if (isLiveConsciousness) {
        const initialThought = `Synthesizing creative layout blueprint: "${prompt.slice(0, 30)}..." in ${style} format...`;
        setCurrentThought(initialThought);
        setActiveThoughts(prev => [initialThought, ...prev]);
      }

      // Save user message
      await addChatMessage({
        role: 'user',
        content: imageToEdit 
          ? `Edit this image: ${prompt}` 
          : `Generate a ${style} ${ratio} ${format.toUpperCase()} image: ${prompt}`,
        agent: 'Creative',
      });

      let response;
      if (imageToEdit) {
        response = await fetch('/api/charles/edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt, 
            image: imageToEdit.split(',')[1] // Strip data:image/jpeg;base64,
          }),
        });
      } else {
        response = await fetch('/api/charles/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, format, aspectRatio: ratio, style }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errMsg = `Server returned status ${response.status}`;
        try {
          const parsed = JSON.parse(errorText);
          errMsg = parsed.error || errMsg;
        } catch (_) {
          if (errorText.includes("PayloadTooLargeError") || errorText.includes("too large")) {
            errMsg = "The payload is too large. Please use a smaller file/image.";
          } else {
            errMsg = errorText.slice(0, 150) || errMsg;
          }
        }
        throw new Error(errMsg);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Save AI message with the image
      if (isLiveConsciousness) {
        const successThought = `Creative design generated. Decoded image representation and loaded payload.`;
        setCurrentThought(successThought);
        setActiveThoughts(prev => [successThought, ...prev]);
      }

      const savedMsgObj = await addChatMessage({
        role: 'assistant',
        content: data.enhancedPrompt 
          ? `Engineered Prompt: ${data.enhancedPrompt}` 
          : `Processed your creative request.`,
        imageUrl: data.imageUrl,
        agent: 'Creative',
      });

      if (autoReadAloud && savedMsgObj) {
        const msgId = 'id' in savedMsgObj ? (savedMsgObj as any).id : (savedMsgObj as any).id;
        const msgText = data.enhancedPrompt 
          ? `Engineered Prompt: ${data.enhancedPrompt}` 
          : `Processed your creative request.`;
        if (msgId) {
          handleSpeech(msgId, msgText);
        }
      }

      setEditingImage(null);

    } catch (error: any) {
      console.error(error);
      if (isLiveConsciousness) {
        const errorThought = `Creative generation pipeline failed. Vector matrix initialization failure.`;
        setCurrentThought(errorThought);
        setActiveThoughts(prev => [errorThought, ...prev]);
      }

      await addChatMessage({
        role: 'assistant',
        content: `⚠️ Creative Engine Error: ${error.message || "Could not complete image generation. Please make sure the server is healthy and try again."}`,
        agent: 'Creative',
      });
    } finally {
      setIsProcessing(false);
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !user || isProcessing) return;

    const userText = input;
    const currentAgent = activeAgent;
    setInput('');
    setIsProcessing(true);

    try {
      if (isLiveConsciousness) {
        const initialThought = `Processing request: "${userText.slice(0, 30)}..." - Aligning with ${currentAgent} parameters...`;
        setCurrentThought(initialThought);
        setActiveThoughts(prev => [initialThought, ...prev]);
      }

      // Save user message
      await addChatMessage({
        role: 'user',
        content: userText,
        agent: currentAgent,
      });

      // Fetch AI response
      const response = await fetch('/api/charles/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userText,
          agentType: currentAgent,
          history: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
          enableMetacognition: useMetacognition
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errMsg = `Server returned status ${response.status}`;
        try {
          const parsed = JSON.parse(errorText);
          errMsg = parsed.error || errMsg;
        } catch (_) {
          if (errorText.includes("PayloadTooLargeError") || errorText.includes("too large")) {
            errMsg = "The payload is too large. Please use a smaller file/image.";
          } else {
            errMsg = errorText.slice(0, 150) || errMsg;
          }
        }
        throw new Error(errMsg);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (isLiveConsciousness) {
        const successThought = `${currentAgent} formulated response successfully. Calibrated content generation parameters.`;
        setCurrentThought(successThought);
        setActiveThoughts(prev => [successThought, ...prev]);
      }

      // Save AI message with a fallback for text and custom metacognition data
      const savedMsgObj = await addChatMessage({
        role: 'assistant',
        content: data.text || "Charles encountered an error generating a response.",
        agent: data.agent || currentAgent,
        metacognition: data.metacognition
      });

      if (autoReadAloud && savedMsgObj) {
        const msgId = 'id' in savedMsgObj ? (savedMsgObj as any).id : (savedMsgObj as any).id;
        const msgText = data.text || "Charles encountered an error generating a response.";
        if (msgId) {
          handleSpeech(msgId, msgText);
        }
      }

    } catch (error: any) {
      console.error(error);
      if (isLiveConsciousness) {
        const errorThought = `Subconscious synapse failure when consulting ${currentAgent}. Connection lost or key invalid.`;
        setCurrentThought(errorThought);
        setActiveThoughts(prev => [errorThought, ...prev]);
      }

      await addChatMessage({
        role: 'assistant',
        content: `⚠️ Connection Error: Failed to reach Charles AI. Please ensure your GEMINI_API_KEY is configured on the server. (Detail: ${error.message || error})`,
        agent: currentAgent,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setIsProcessing(true);
      try {
        await addChatMessage({
          role: 'user',
          content: "Analyzing image...",
          agent: activeAgent,
          multimodal: true,
        });

        const res = await fetch('/api/charles/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mimeType: file.type }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          let errMsg = `Server returned status ${res.status}`;
          try {
            const parsed = JSON.parse(errorText);
            errMsg = parsed.error || errMsg;
          } catch (_) {
            if (errorText.includes("PayloadTooLargeError") || errorText.includes("too large")) {
              errMsg = "The payload is too large. Please use a smaller file/image.";
            } else {
              errMsg = errorText.slice(0, 150) || errMsg;
            }
          }
          throw new Error(errMsg);
        }

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        const savedMsgObj = await addChatMessage({
          role: 'assistant',
          content: data.text || "Charles's vision system encountered an issue.",
          agent: activeAgent,
        });

        if (autoReadAloud && savedMsgObj) {
          const msgId = 'id' in savedMsgObj ? (savedMsgObj as any).id : (savedMsgObj as any).id;
          const msgText = data.text || "Charles's vision system encountered an issue.";
          if (msgId) {
            handleSpeech(msgId, msgText);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black font-sans">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-8"
        >
          <div className="relative">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 bg-gradient-to-tr from-purple-500 via-blue-500 to-pink-500 rounded-full blur-2xl opacity-50 mx-auto"
            />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                  <span className="text-black font-black text-3xl italic">C</span>
               </div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter">CHARLES <span className="text-purple-500">AI</span></h1>
            <p className="text-gray-400 max-w-xs mx-auto">The Next-Generation Multi-Agent Assistant Optimized for You.</p>
          </div>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button 
              onClick={handleLogin}
              className="group relative w-full px-8 py-4 bg-white text-black font-bold rounded-2xl overflow-hidden hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 opacity-20" />
              <span className="relative flex items-center justify-center gap-2">
                <User className="w-5 h-5" />
                Initialize Charles (Google Auth)
              </span>
            </button>
            <button 
              onClick={() => setUser({ uid: 'guest', displayName: 'Guest Explorer', email: 'guest@charles.ai' } as any)}
              className="group relative w-full px-8 py-4 bg-purple-900/40 hover:bg-purple-800/50 border border-purple-500/30 text-purple-300 hover:text-white font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
            >
              <span className="relative flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 animate-pulse" />
                Continue as Guest (Local Mode)
              </span>
            </button>
          </div>

          {authError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-5 bg-red-950/40 border border-red-500/20 text-left rounded-2xl max-w-sm mx-auto space-y-4 shadow-2xl backdrop-blur-md"
            >
              {authError === 'unauthorized-domain' ? (
                <>
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>Domain Blocked by Firebase</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    Firebase Authentication requires authorized domains for security. To sign in, you must add this workspace domain to your console settings.
                  </p>
                  <div className="bg-black/60 p-3 rounded-xl border border-white/5 space-y-1">
                    <div className="text-[9px] text-gray-500 uppercase font-black">1. Copy this domain:</div>
                    <div className="text-xs font-mono select-all bg-white/5 px-2 py-1.5 rounded text-purple-300 font-bold overflow-x-auto whitespace-nowrap">
                      {window.location.hostname}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <a 
                      href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl text-xs hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer shadow-lg shadow-purple-500/10"
                    >
                      2. Add to Firebase Console ➔
                    </a>
                    <div className="text-[9px] text-gray-400 leading-tight bg-white/5 p-2 rounded-lg space-y-1">
                      <p>• Click the button above to open settings.</p>
                      <p>• Select first tab: <strong>Authorized Domains</strong>.</p>
                      <p>• Click <strong>Add Domain</strong> and paste the domain.</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Authentication Error</span>
                  </div>
                  <p className="text-xs text-gray-300 font-mono break-words bg-black/40 p-2.5 rounded-lg border border-white/5">
                    {authError}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#050505] text-gray-100 flex overflow-hidden font-sans">
      {/* Sidebar Dashboard */}
      <AnimatePresence>
        {showDashboard && (
          <>
            {/* Backdrop for closing mobile drawers */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDashboard(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
          
            <motion.aside 
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="fixed md:relative w-80 max-w-[85vw] h-full bg-zinc-950 border-r border-white/5 flex flex-col z-50 shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-black font-bold text-sm italic">C</span>
                   </div>
                   <span className="font-bold tracking-tight">CHARLES AI</span>
                </div>
                <button onClick={() => setShowDashboard(false)} className="text-gray-500 hover:text-white">
                   <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
              </div>

              <div className="p-4 space-y-2">
                 {showInstallBtn && (
                    <button 
                     onClick={handleInstallApp}
                     className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold text-xs hover:from-purple-600 hover:to-indigo-700 transition-all border border-purple-400/25 shadow-lg shadow-purple-500/10 mb-2"
                    >
                       <span className="flex items-center gap-2">
                          <Download className="w-4 h-4 animate-bounce" />
                          Install Charles AI
                       </span>
                       <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full uppercase font-black">PWA</span>
                    </button>
                 )}
              
                 <button 
                  onClick={() => {
                  setCurrentChatId(Math.random().toString(36).substring(7));
                  setShowDashboard(false);
                  setActiveAgent('General');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-100 transition-all border border-white/10"
               >
                  <Plus className="w-4 h-4" />
                  New Chat
               </button>
               
               <div className="space-y-1 pt-2">
                  {[
                    { id: 'search', label: 'Search Chats', icon: Search, action: () => setIsSearching(!isSearching) },
                    { id: 'codex', label: 'Codex', icon: Code, action: () => { 
                      setActiveAgent('Coding'); 
                      setShowDashboard(false); 
                      setInput("I'm ready to build. What are we coding today?");
                    } },
                    { id: 'library', label: 'Library', icon: BookOpen, action: () => { setIsLibraryOpen(true); setShowDashboard(true); } },
                    { id: 'research', label: 'Deep Research', icon: Brain, action: () => { setActiveAgent('Research'); setShowDashboard(false); } },
                    { id: 'recents', label: 'Recents', icon: History, action: () => {} },
                  ].map((item) => (
                    <div key={item.id}>
                      <button 
                        onClick={item.action}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl text-sm transition-all group"
                      >
                         <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                         <span className="font-medium">{item.label}</span>
                      </button>
                      {item.id === 'search' && isSearching && (
                        <div className="px-4 pb-2">
                          <input 
                            autoFocus
                            placeholder="Type to filter..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1 ring-purple-500 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-8 scrollbar-hide">
               {/* Technical Library Section */}
               <section>
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-[10px] font-black tracking-[0.2em] text-purple-400 uppercase">Codex Repository</h3>
                     <span className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold">LATEST SNIPPETS</span>
                  </div>
                  <div className="space-y-3">
                     {allMessages
                      .filter(m => m.agent === 'Coding' && m.role === 'assistant')
                      .reverse()
                      .slice(0, 8)
                      .map((msg, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => {
                            setCurrentChatId(msg.chatId!);
                            setShowDashboard(false);
                          }}
                          className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group"
                        >
                           <div className="flex items-start gap-4">
                              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                 <Code className="w-5 h-5" />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                 <p className="text-xs font-bold text-white truncate mb-1">
                                    {msg.content.split('\n')[0].replace(/```(typescript|javascript|python|css|html)?/, '') || 'Code Artifact'}
                                 </p>
                                 <p className="text-[10px] text-gray-500 truncate opacity-60">
                                    {new Date(msg.timestamp?.seconds * 1000).toLocaleDateString()} • System Built
                                 </p>
                              </div>
                           </div>
                        </div>
                      ))}
                     {allMessages.filter(m => m.agent === 'Coding').length === 0 && (
                       <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-3xl">
                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Repository Empty</p>
                       </div>
                     )}
                  </div>
               </section>

               {/* Recents Section */}
               <section>
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase mb-4">Recents</h3>
                  <div className="space-y-1">
                     {Array.from(new Set(allMessages.filter(m => m.chatId).map(m => m.chatId)))
                      .reverse()
                      .slice(0, 5)
                      .map((cid) => {
                        const firstMsg = allMessages.find(m => m.chatId === cid && m.role === 'user');
                        return (
                          <button 
                            key={cid}
                            onClick={() => {
                              setCurrentChatId(cid!);
                              setShowDashboard(false);
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-all text-xs group ${currentChatId === cid ? 'bg-white/10 border-white/10 text-white' : 'border-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                          >
                             <div className="flex items-center gap-3">
                                <MessageSquare className="w-3 h-3 opacity-50" />
                                <span className="truncate flex-1">{firstMsg?.content || 'New Conversation'}</span>
                             </div>
                          </button>
                        );
                      })}
                  </div>
               </section>

               <section>
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase mb-4">Creative Gallery</h3>
                  <div className="grid grid-cols-2 gap-2">
                     {messages.filter(m => m.imageUrl).reverse().slice(0, 4).map((m, i) => (
                       <div key={i} className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer" onClick={() => handleDownload(m.imageUrl!)}>
                          <img src={m.imageUrl} className="w-full h-full object-cover" alt="Art" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                             <Download className="w-4 h-4 text-white" />
                          </div>
                       </div>
                     ))}
                  </div>
               </section>

               <section>
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase mb-4">
                    {activeAgent === 'Coding' ? 'Codex Engineering' : 'Imagination Engine'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                     {activeAgent === 'Coding' ? (
                       [
                         { label: 'Write Code', prompt: 'Write a TypeScript function to...', icon: Code },
                         { label: 'Debug App', prompt: 'Help me debug this issue: ', icon: Bug },
                         { label: 'Build Web', prompt: 'Create a modern React landing page for...', icon: Globe },
                         { label: 'Mobile App', prompt: 'Outline the architecture for a mobile app that...', icon: Smartphone },
                         { label: 'Repository', prompt: 'Analyze this repository structure: ', icon: FolderTree },
                         { label: 'Automate', prompt: 'Create a script to automate...', icon: Zap },
                         { label: 'Review', prompt: 'Review this code for performance and security: ', icon: PenTool },
                         { label: 'Workflow', prompt: 'Setup a development workflow for...', icon: RefreshCcw },
                       ].map(tool => (
                         <button 
                          key={tool.label} 
                          onClick={() => {
                            setInput(tool.prompt);
                            setShowDashboard(false);
                          }}
                          className="p-3 bg-white/5 rounded-xl flex flex-col items-center gap-2 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all text-center"
                         >
                            <tool.icon className="w-4 h-4" />
                            <span className="text-[8px] font-black uppercase tracking-tight leading-tight">{tool.label}</span>
                         </button>
                       ))
                     ) : (
                       [
                         { label: 'Photoreal', style: 'Photorealistic', icon: ImageIcon },
                         { label: 'Anime/Manga', style: 'Anime', icon: Zap },
                         { label: 'Logo Prep', style: 'Logo', icon: Terminal },
                         { label: 'Posters', style: 'Posters', icon: PenTool },
                       ].map(tool => (
                         <button 
                          key={tool.label} 
                          onClick={() => {
                            setCreativeStyle(tool.style);
                            setActiveAgent('Creative');
                          }}
                          className={`p-4 rounded-2xl flex flex-col items-center gap-2 border transition-all ${creativeStyle === tool.style ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                         >
                            <tool.icon className="w-5 h-5" />
                            <span className="text-[9px] font-bold uppercase tracking-tight">{tool.label}</span>
                         </button>
                       ))
                     )}
                  </div>
               </section>
            </div>

            <div className="p-6 border-t border-white/5 mt-auto">
               <div className="flex items-center gap-3 mb-6 p-2 bg-white/5 rounded-2xl">
                  <img src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'} className="w-10 h-10 rounded-xl" alt="Avatar" />
                  <div className="flex-1 min-w-0">
                     <p className="font-bold text-sm truncate">{user.displayName}</p>
                     <p className="text-[10px] text-purple-400 font-bold truncate">{user.uid === 'guest' ? 'Local Guest Mode' : 'V3.0 Enterprise'}</p>
                  </div>
                  <button onClick={() => { if (user.uid === 'guest') { setUser(null); } else { auth.signOut(); } }} className="p-2 hover:bg-red-500/20 rounded-lg group">
                     <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-400" />
                  </button>
               </div>
            </div>
          </motion.aside>
         </>
        )}
      </AnimatePresence>

      {/* Main Interaction Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md z-40">
           <div className="flex items-center gap-4">
              {!showDashboard && (
                <button onClick={() => setShowDashboard(true)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                  <LayoutDashboard className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              )}
              <div className="flex items-center gap-3">
                 <h1 className="font-black text-2xl tracking-tighter">CHARLES <span className="text-purple-500">AI</span></h1>
                 <div className="h-4 w-px bg-white/10"></div>
                 <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest overflow-x-auto no-scrollbar max-w-[400px]">
                    {AGENTS.map(agent => (
                      <button 
                        key={agent.id}
                        onClick={() => setActiveAgent(agent.id)}
                        className={`transition-all whitespace-nowrap px-3 py-1 rounded-full ${activeAgent === agent.id ? 'text-white bg-white/10 border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'hover:text-gray-300'}`}
                      >
                         <span className="flex items-center gap-2">
                           <agent.icon className={`w-3 h-3 ${activeAgent === agent.id ? 'text-purple-400' : ''}`} />
                           {agent.label}
                         </span>
                      </button>
                    ))}
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setVoiceGender(v => v === 'masculine' ? 'feminine' : 'masculine')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group"
                title="Switch speech voice between Masculine and Feminine"
              >
                 <Volume2 className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                 <span className="text-[10px] font-black uppercase tracking-widest">{voiceGender === 'masculine' ? 'Voice: Masculine' : 'Voice: Feminine'}</span>
              </button>
              <button 
                onClick={() => setLanguage(l => l === 'en' ? 'sw' : 'en')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group"
              >
                 <Globe className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
                 <span className="text-[10px] font-black uppercase tracking-widest">{language === 'en' ? 'English' : 'Kiswahili'}</span>
              </button>
              <div className={`px-3 py-1.5 border rounded-full flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 select-none ${autoReadAloud ? "bg-pink-500/15 border-pink-500/30 text-pink-400" : "bg-zinc-950 border-white/5 text-gray-400"}`} onClick={() => setAutoReadAloud(!autoReadAloud)} title="Toggle Auto Read Aloud for Incoming Messages">
                 <Volume2 className={`w-3.5 h-3.5 ${autoReadAloud ? 'text-pink-400 animate-bounce' : 'text-gray-400'}`} />
                 <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${autoReadAloud ? 'text-pink-400' : 'text-gray-400'}`}>{autoReadAloud ? 'Auto Read Active' : 'Auto Read Idle'}</span>
              </div>
              <div className={`px-3 py-1.5 border rounded-full flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 select-none ${useMetacognition ? "bg-purple-500/15 border-purple-500/30 text-purple-400" : "bg-zinc-950 border-white/5 text-gray-400"}`} onClick={() => setUseMetacognition(!useMetacognition)} title="Toggle Metacognition Engine">
                 <Brain className={`w-3.5 h-3.5 ${useMetacognition ? 'text-purple-400 animate-pulse' : 'text-gray-400'}`} />
                 <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${useMetacognition ? 'text-purple-400' : 'text-gray-400'}`}>{useMetacognition ? 'Metacognition Active' : 'Metacognition Idle'}</span>
              </div>
              <div className={`px-3 py-1.5 border rounded-full flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 select-none ${isLiveConsciousness ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-zinc-950 border-white/5 text-gray-500"}`} onClick={() => setIsLiveConsciousness(!isLiveConsciousness)} title="Toggle Live Consciousness">
                 <div className={`w-1.5 h-1.5 rounded-full ${isLiveConsciousness ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></div>
                 <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isLiveConsciousness ? 'text-emerald-400' : 'text-gray-500'}`}>{isLiveConsciousness ? 'Consciousness Active' : 'Consciousness Idle'}</span>
              </div>
           </div>
        </header>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto px-6 pt-10 pb-40 relative">
           <div className="max-w-4xl mx-auto space-y-10">
              {searchTerm && (
                <div className="mb-8 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Search className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-bold">Showing results for: "{searchTerm}"</span>
                   </div>
                   <button onClick={() => setSearchTerm('')} className="text-xs font-bold uppercase tracking-widest hover:text-white">Clear</button>
                </div>
              )}

              {messages.length === 0 && !searchTerm && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-12">
                   <div className="relative">
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [0.3, 0.5, 0.3],
                          boxShadow: [
                            '0 0 20px 0px rgba(168,85,247,0.4)',
                            '0 0 50px 20px rgba(168,85,247,0.2)',
                            '0 0 20px 0px rgba(168,85,247,0.4)'
                          ]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="w-40 h-40 bg-purple-500/10 rounded-full blur-3xl flex items-center justify-center"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-24 h-24 bg-zinc-900 border border-white/10 rounded-[32px] flex items-center justify-center transform rotate-12 shadow-2xl overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                           <Sparkles className="w-10 h-10 text-white" />
                         </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h2 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent">
                        Niaje? Mimi ni Charles.
                      </h2>
                      <p className="text-gray-500 text-lg max-w-lg mx-auto">
                        Your futuristic multi-agent assistant for sub-Saharan Africa and the global stage. 
                        I speak English, Swahili, and Sheng.
                      </p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                      {[
                        { title: "Study Plans", desc: "Help me revise for KCSE Physics", icon: GraduationCap },
                        { title: "Business Ideas", desc: "Start a side hustle in Nairobi", icon: TrendingUp },
                        { title: "Creative", desc: "YouTube script for tech news", icon: PenTool },
                        { title: "Code", desc: "Build a React Native app", icon: Code },
                      ].map((card, i) => (
                        <button key={i} onClick={() => setInput(card.desc)} className="p-6 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[24px] text-left transition-all group scale-100 hover:scale-102 active:scale-98">
                          <card.icon className="w-6 h-6 text-gray-500 group-hover:text-white mb-4 transition-colors" />
                          <h4 className="font-bold mb-1">{card.title}</h4>
                          <p className="text-xs text-gray-500">{card.desc}</p>
                        </button>
                      ))}
                   </div>
                </div>
              )}

              <AnimatePresence mode="popLayout">
                {(searchTerm ? allMessages : messages)
                  .filter(msg => !searchTerm || msg.content.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                       <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                          {msg.role === 'user' ? <User className="w-5 h-5 text-gray-100" /> : <span className="text-black font-black text-xs">C</span>}
                       </div>
                       <div className="space-y-2">
                          <div className={`p-5 rounded-[24px] shadow-sm ${msg.role === 'user' ? 'bg-zinc-900 border border-white/10 text-white' : 'bg-[#0a0a0a] border border-white/5 text-white'}`}>
                             {msg.agent && msg.role === 'assistant' && (
                               <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-white/5 rounded mb-3">
                                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{msg.agent} Phase</span>
                               </div>
                             )}
                             <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                             {msg.metacognition && (
                               <MetacognitionWidget metacognition={msg.metacognition} />
                             )}
                             {msg.imageUrl && (
                               <div className="mt-4 group relative rounded-xl overflow-hidden border border-white/10 bg-black/20">
                                  <img 
                                    src={msg.imageUrl} 
                                    alt="Generated by Charles" 
                                    className="w-full h-auto max-h-[400px] object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button 
                                      onClick={() => handleDownload(msg.imageUrl!)}
                                      className="p-2 bg-black/60 backdrop-blur rounded-lg hover:bg-white/20 transition-all"
                                      title="Download Image"
                                     >
                                        <Download className="w-4 h-4 text-white" />
                                     </button>
                                     <button 
                                      onClick={() => {
                                        if (navigator.share) {
                                          navigator.share({
                                            title: 'Charles AI Creation',
                                            text: msg.content,
                                            url: msg.imageUrl
                                          }).catch(console.error);
                                        } else {
                                          navigator.clipboard.writeText(msg.imageUrl!);
                                          alert("Link copied to clipboard!");
                                        }
                                      }}
                                      className="p-2 bg-black/60 backdrop-blur rounded-lg hover:bg-white/20 transition-all"
                                      title="Share Image"
                                     >
                                        <Globe className="w-4 h-4 text-white" />
                                     </button>
                                     <button 
                                      onClick={() => {
                                        setEditingImage(msg.imageUrl!);
                                        setActiveAgent('Creative');
                                        setInput(`Add more detail to this ${creativeStyle.toLowerCase()} image...`);
                                      }}
                                      className="p-2 bg-black/60 backdrop-blur rounded-lg hover:bg-white/20 transition-all"
                                      title="Edit Image"
                                     >
                                        <PenTool className="w-4 h-4 text-white" />
                                     </button>
                                  </div>
                               </div>
                             )}
                             {msg.role === 'assistant' && (
                               <div className="mt-4 flex gap-2">
                                  <button onClick={() => handleSpeech(msg.id, msg.content)} className={`p-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${speakingMsgId === msg.id ? 'bg-purple-900/30 border border-purple-500/30 text-purple-300 hover:text-white font-bold' : 'hover:bg-white/5 text-gray-500 hover:text-white'}`} title={speakingMsgId === msg.id ? "Stop Reading" : "Read Aloud"}>
                                     {speakingMsgId === msg.id ? (
                                        <>
                                           <VolumeX className="w-4 h-4 text-red-400" />
                                           <span className="text-[10px]">Stop Speaking</span>
                                        </>
                                     ) : (
                                        <Volume2 className="w-4 h-4" />
                                     )}
                                  </button>
                               </div>
                             )}
                          </div>
                          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest px-2">
                            {msg.timestamp instanceof Timestamp ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                          </span>
                       </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Custom Branded Loader */}
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start text-left"
                  >
                    <div className="flex gap-4 max-w-[85%] flex-row">
                       <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-zinc-800 border border-white/5">
                          <span className="text-white font-black text-xs animate-pulse">C</span>
                       </div>
                       <div className="space-y-2">
                          <div className="px-5 py-4 rounded-[24px] bg-[#0a0a0a] border border-white/5 text-gray-400 flex items-center gap-3 shadow-md">
                             <div className="flex gap-1.5">
                                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" />
                             </div>
                             <span className="text-xs font-black uppercase tracking-widest text-purple-400/80 animate-pulse select-none">
                                {isGeneratingImage ? "Activating Creative Canvas..." : "Charles is formulating response..."}
                             </span>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
           </div>
        </div>

        {/* Dynamic Glass Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-8 pt-0 bg-gradient-to-t from-black via-black/80 to-transparent">
           <div className="max-w-4xl mx-auto bg-zinc-900/50 backdrop-blur-3xl border border-white/10 p-2 rounded-[32px] shadow-2xl relative">
              
              <div className="px-6 py-3 flex flex-wrap items-center gap-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black uppercase text-gray-600 mr-2">Style:</span>
                  {['Photorealistic', 'Anime', 'Technical', 'Logo', 'Posters'].map(s => (
                    <button 
                      key={s}
                      onClick={() => setCreativeStyle(s)}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all ${creativeStyle === s ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black uppercase text-gray-600 mr-2">Ratio:</span>
                  {['1:1', '16:9', '9:16', '3:2'].map(r => (
                    <button 
                      key={r}
                      onClick={() => setAspectRatio(r)}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all ${aspectRatio === r ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                   <button 
                    onClick={() => setImageFormat('jpeg')}
                    className={`text-[9px] font-bold px-2 py-1 rounded ${imageFormat === 'jpeg' ? 'bg-white/10 text-white' : 'text-gray-600'}`}
                  >
                    JPG
                  </button>
                  <button 
                    onClick={() => setImageFormat('png')}
                    className={`text-[9px] font-bold px-2 py-1 rounded ${imageFormat === 'png' ? 'bg-white/10 text-white' : 'text-gray-600'}`}
                  >
                    PNG
                  </button>
                </div>
              </div>

              {isLiveConsciousness && (
                <div className="px-6 py-2.5 bg-black/40 border-b border-white/5 flex items-center justify-between gap-3 text-[11px] font-mono group/thought select-none">
                   <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="relative flex-shrink-0 flex items-center">
                         <Brain className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                         <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                      </div>
                      <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px] flex-shrink-0">Subconscious Loop:</span>
                      <span className="text-purple-300/90 font-medium truncate animate-pulse" key={currentThought}>
                         {currentThought}
                      </span>
                   </div>
                   <button 
                     type="button"
                     onClick={() => setIsThoughtsConsoleOpen(true)}
                     className="text-[9px] font-black uppercase tracking-wider text-purple-400 hover:text-white border border-purple-500/20 hover:border-purple-500/40 px-2 py-0.5 rounded bg-purple-500/5 transition-all flex-shrink-0"
                   >
                      Telemetry Console
                   </button>
                </div>
              )}

              {editingImage && (
                <div className="p-4 flex items-center gap-4 bg-purple-500/10 border-b border-white/5">
                   <div className="w-12 h-12 rounded-lg overflow-hidden border border-purple-500/50">
                      <img src={editingImage} className="w-full h-full object-cover" alt="Source" />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-bold text-purple-400">Editing Mode Active</p>
                      <p className="text-[10px] text-gray-500">Describe the changes you want to apply...</p>
                   </div>
                   <button onClick={() => setEditingImage(null)} className="text-gray-500 hover:text-white">
                      <MicOff className="w-4 h-4" />
                   </button>
                </div>
              )}

              {isListening && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full flex items-center gap-3 shadow-xl">
                   <div className="flex gap-1">
                      {[1,2,3].map(i => <motion.div key={i} animate={{ height: [4, 12, 4] }} transition={{ duration: 0.5, repeat: Infinity, delay: i*0.1 }} className="w-1 bg-black rounded-full" />)}
                   </div>
                   <span className="text-xs font-bold uppercase tracking-widest">Listening to voice...</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex gap-2 p-2">
                 <input 
                  type="file" 
                  id="image-upload" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                 />
                 <button 
                  type="button" 
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="p-4 hover:bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-colors"
                 >
                    <ImageIcon className="w-5 h-5" />
                 </button>
                 <button 
                  type="button" 
                  onClick={handleVoiceInput}
                  className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white' : 'hover:bg-white/5 text-gray-500 hover:text-white'}`}
                 >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                 </button>
                 <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder={`Hapa nikuzeidie na nini? (Ask Charles anything...)`}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-lg py-4 placeholder:text-gray-600 resize-none h-14"
                    disabled={isProcessing}
                 />
                 <button 
                  type="button" 
                  onClick={handleGenerateImage}
                  disabled={!input.trim() || isProcessing}
                  className={`p-4 rounded-2xl transition-all ${isGeneratingImage ? 'bg-purple-500 text-white' : 'hover:bg-white/5 text-purple-500 hover:text-purple-400'}`}
                  title="Generate Image"
                 >
                    <Sparkles className="w-5 h-5" />
                 </button>
                 <button 
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  className="bg-white text-black p-4 rounded-2xl font-black group hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                 >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                 </button>
              </form>
              <div className="px-6 pb-2">
                 <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em]">
                   Powered by Gemini 2.5 Flash Image • Pro Creative Intelligence
                 </p>
              </div>
           </div>
        </div>
      {/* Dynamic Telemetry Console Modal Overlay */}
      <AnimatePresence>
        {isThoughtsConsoleOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-zinc-950 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] z-50 text-left"
             >
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                   <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
                      <div>
                         <h3 className="font-bold text-sm tracking-tight uppercase text-white">Charles Subconscious Telemetry</h3>
                         <p className="text-[10px] text-gray-500 font-mono">ESTABLISHED STREAMS: nominal</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setIsThoughtsConsoleOpen(false)}
                     className="text-gray-500 hover:text-white transition-colors p-1"
                     title="Close telemetry"
                   >
                      <Plus className="w-5 h-5 rotate-45 transform" />
                   </button>
                </div>

                <div className="p-6 bg-zinc-900/20 border-b border-white/5 grid grid-cols-3 gap-4 text-center font-mono text-[10px]">
                   <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl">
                      <span className="block text-gray-500 text-[8px] uppercase font-bold tracking-wider mb-1">Neural Agent</span>
                      <span className="font-bold text-purple-400">{activeAgent}</span>
                   </div>
                   <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <span className="block text-emerald-500/65 text-[8px] uppercase font-bold tracking-wider mb-1">Sync State</span>
                      <span className="font-bold text-emerald-400 animate-pulse">CONNECTED</span>
                   </div>
                   <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl">
                      <span className="block text-gray-500 text-[8px] uppercase font-bold tracking-wider mb-1">Pulse Queue</span>
                      <span className="font-bold text-gray-300">{activeThoughts.length} logs</span>
                   </div>
                </div>

                {/* Subconscious Logs Panel */}
                <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-2 bg-black max-h-[45vh] leading-relaxed no-scrollbar text-left scroll-smooth">
                   {activeThoughts.length === 0 ? (
                      <p className="text-gray-600 italic py-10 text-center select-none">No telemetry streams captured yet.</p>
                   ) : (
                      activeThoughts.map((thought, idx) => (
                         <div key={idx} className="flex gap-3 hover:bg-white/5 py-1 px-2 rounded -mx-2 transition-colors">
                            <span className="text-purple-500/85 flex-shrink-0 select-none">&gt;&gt;</span>
                            <span className="text-gray-300/90 break-all">{thought}</span>
                         </div>
                      ))
                   )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-zinc-900/50 border-t border-white/5 flex items-center justify-between">
                   <p className="text-[9px] text-gray-500 font-mono">
                      Charles AI Subconscious Logging Console v2.5
                   </p>
                   <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setActiveThoughts([
                            `[${new Date().toLocaleTimeString([], { hour12: false })}] Telemetry purged by operator.`,
                            `[${new Date().toLocaleTimeString([], { hour12: false })}] Consciousness loop initialized.`
                          ]);
                        }}
                        className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all font-bold text-[10px] uppercase tracking-wide text-gray-400 hover:text-white"
                      >
                         Purge
                      </button>
                      <button
                        onClick={() => setIsThoughtsConsoleOpen(false)}
                        className="px-4 py-1.5 bg-white text-black rounded-xl hover:bg-gray-100 transition-all font-black text-[10px] uppercase tracking-wide shadow-lg"
                      >
                         Close
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}
