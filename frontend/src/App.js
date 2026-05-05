import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Sparkles, BookOpen, Brain, Search, Eye, X, Check, XCircle, Zap } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_API_URL}/api`;

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [viewerPdf, setViewerPdf] = useState(null);

  useEffect(() => {
    fetchPDFs();
  }, []);

  const fetchPDFs = async () => {
    try {
      const response = await fetch(`${API_URL}/pdfs`);
      const data = await response.json();
      setPdfs(data);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace('.pdf', ''));

    try {
      const response = await fetch(`${API_URL}/pdfs/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ PDF uploaded successfully!');
        fetchPDFs();
        setCurrentPage('browse');
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const viewPdfWithAI = (pdf) => {
    setSelectedPdf(pdf);
    setCurrentPage('ai-assistant');
  };

  const openPdfViewer = (pdf) => {
    setViewerPdf(pdf);
  };

  const closePdfViewer = () => {
    setViewerPdf(null);
  };

  const filteredPdfs = pdfs.filter(pdf =>
    pdf.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <style>{keyframes}</style>
      
      {/* Animated Background Circles */}
      <div style={styles.bgCircle1}></div>
      <div style={styles.bgCircle2}></div>
      
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo} onClick={() => setCurrentPage('home')}>
            <BookOpen size={32} color="#667eea" />
            <h1 style={styles.logoText}>PDF Notes Hub</h1>
          </div>
          
          <nav style={styles.nav}>
            <NavButton active={currentPage === 'home'} onClick={() => setCurrentPage('home')}>
              Home
            </NavButton>
            <NavButton active={currentPage === 'browse'} onClick={() => setCurrentPage('browse')}>
              Browse
            </NavButton>
            <NavButton active={currentPage === 'upload'} onClick={() => setCurrentPage('upload')}>
              Upload
            </NavButton>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        
        {/* PDF VIEWER MODAL */}
        {viewerPdf && <PDFViewerModal pdf={viewerPdf} onClose={closePdfViewer} />}
        
        {/* HOME PAGE */}
        {currentPage === 'home' && (
          <div style={styles.homePage}>
            <div style={styles.heroSection}>
              <h2 style={styles.homeTitle}>
                Share & Learn with <span style={styles.gradient}>AI-Powered</span> Notes
              </h2>
              <p style={styles.homeSubtitle}>
                Upload, browse, and analyze PDF notes with intelligent AI assistance
              </p>

              <div style={styles.statsRow}>
                <StatCard icon={<FileText size={24} />} value={pdfs.length} label="Total PDFs" />
                <StatCard icon={<Brain size={24} />} value="AI" label="Powered" />
                <StatCard icon={<Zap size={24} />} value="Free" label="Forever" />
              </div>

              <div style={styles.featuresGrid}>
                <FeatureCard 
                  icon={<Upload size={40} />}
                  title="Easy Upload"
                  description="Drag and drop PDF files with fast processing"
                  color="#667eea"
                />
                <FeatureCard 
                  icon={<Brain size={40} />}
                  title="AI Analysis"
                  description="Get summaries, key points, and quizzes"
                  color="#764ba2"
                />
                <FeatureCard 
                  icon={<Download size={40} />}
                  title="Free Download"
                  description="Access all notes without registration"
                  color="#4CAF50"
                />
              </div>

              <div style={styles.homeButtons}>
                <button onClick={() => setCurrentPage('upload')} style={styles.primaryBtn}>
                  <Upload size={20} /> Upload Your PDF
                </button>
                <button onClick={() => setCurrentPage('browse')} style={styles.secondaryBtn}>
                  <Search size={20} /> Browse Notes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BROWSE PAGE */}
        {currentPage === 'browse' && (
          <div style={styles.browsePage}>
            <h2 style={styles.pageTitle}>Browse PDF Notes</h2>
            <div style={styles.searchContainer}>
              <Search size={20} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by title or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.pdfGrid}>
              {filteredPdfs.map((pdf, index) => (
                <PDFCard 
                  key={pdf._id}
                  pdf={pdf}
                  index={index}
                  onViewWithAI={() => viewPdfWithAI(pdf)}
                  onViewPdf={() => openPdfViewer(pdf)}
                />
              ))}
            </div>

            {filteredPdfs.length === 0 && (
              <div style={styles.emptyState}>
                <FileText size={80} style={{ opacity: 0.3, marginBottom: '20px' }} />
                <h3 style={{ marginBottom: '10px' }}>No PDFs Found</h3>
                <p style={{ fontSize: '16px', marginBottom: '20px' }}>
                  {searchQuery ? 'Try different keywords' : 'Be the first to upload!'}
                </p>
                <button onClick={() => setCurrentPage('upload')} style={styles.primaryBtn}>
                  <Upload size={18} /> Upload PDF
                </button>
              </div>
            )}
          </div>
        )}

        {/* UPLOAD PAGE */}
        {currentPage === 'upload' && (
          <div style={styles.uploadPage}>
            <h2 style={styles.pageTitle}>Upload PDF Notes</h2>
            <p style={styles.uploadSubtitle}>Share your notes with the community</p>
            
            <div style={styles.uploadCard}>
              <div style={styles.uploadIconWrapper}>
                <Upload size={56} color="#667eea" style={styles.uploadIcon} />
              </div>
              <h3 style={styles.uploadCardTitle}>Drop your PDF here</h3>
              <p style={styles.uploadCardText}>
                or click to browse from your computer
              </p>
              <p style={styles.uploadCardSubtext}>
                Supports PDF files up to 20MB
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload" style={{
                ...styles.uploadBtn,
                opacity: isUploading ? 0.6 : 1,
                cursor: isUploading ? 'not-allowed' : 'pointer'
              }}>
                {isUploading ? 'Uploading...' : 'Select PDF File'}
              </label>
            </div>
          </div>
        )}

        {/* AI ASSISTANT PAGE */}
        {currentPage === 'ai-assistant' && selectedPdf && (
          <AIAssistantPage pdf={selectedPdf} onBack={() => setCurrentPage('browse')} />
        )}

      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2025 PDF Notes Hub - Empowering Education Through AI</p>
      </footer>
    </div>
  );
}

function NavButton({ active, onClick, children }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...styles.navBtn,
        background: active ? 'linear-gradient(135deg, #667eea, #764ba2)' : isHovered ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
        color: active ? 'white' : '#333',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: active ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      style={{
        ...styles.featureCard,
        transform: isHovered ? 'translateY(-10px) scale(1.02)' : 'translateY(0)',
        boxShadow: isHovered ? '0 20px 40px rgba(0,0,0,0.2)' : '0 10px 30px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{...styles.featureIcon, background: color}}>
        {icon}
      </div>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDesc}>{description}</p>
    </div>
  );
}

function PDFCard({ pdf, index, onViewWithAI, onViewPdf }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleDownload = async () => {
    try {
      const response = await fetch(`${API_URL}/pdfs/download/${pdf._id}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Download failed');
    }
  };

  return (
    <div 
      style={{
        ...styles.pdfCard,
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 12px 24px rgba(102, 126, 234, 0.2)' : '0 4px 12px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.pdfCardHeader}>
        <FileText size={40} color="#667eea" />
        <div style={styles.pdfBadge}>{pdf.pages || 1}p</div>
      </div>
      
      <h3 style={styles.pdfTitle}>{pdf.title}</h3>
      <p style={styles.pdfMeta}>
        {pdf.subject} • {(pdf.fileSize / 1024).toFixed(0)}KB
      </p>
      
      <div style={styles.pdfActions}>
        <button onClick={onViewPdf} style={{...styles.actionBtn, background: '#2196F3'}}>
          <Eye size={16} /> View
        </button>
        <button onClick={onViewWithAI} style={{...styles.actionBtn, background: '#667eea'}}>
          <Sparkles size={16} /> AI
        </button>
        <button onClick={handleDownload} style={{...styles.actionBtn, background: '#4CAF50'}}>
          <Download size={16} />
        </button>
      </div>
    </div>
  );
}

function PDFViewerModal({ pdf, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{pdf.title}</h2>
          <button onClick={onClose} style={styles.modalClose}>
            <X size={20} /> Close
          </button>
        </div>
        <iframe
          src={`${API_URL}/pdfs/view/${pdf._id}`}
          style={styles.iframe}
          title={pdf.title}
        />
      </div>
    </div>
  );
}

function AIAssistantPage({ pdf, onBack }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    checkExistingAnalysis();
  }, [pdf._id]);

  const checkExistingAnalysis = async () => {
    try {
      const response = await fetch(`${API_URL}/ai/analysis/${pdf._id}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.log('No analysis');
    }
  };

  const analyzeDocument = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/ai/analyze/${pdf._id}`, { method: 'POST' });
      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/ai/quiz/${pdf._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numberOfQuestions: 5 })
      });
      if (!response.ok) throw new Error('Quiz failed');
      const data = await response.json();
      setQuiz(data.quiz);
      setUserAnswers([]);
      setShowResults(false);
      setActiveTab('quiz');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (qIdx, aIdx) => {
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = aIdx;
    setUserAnswers(newAnswers);
  };

  const checkAnswers = () => setShowResults(true);

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput };
    setChatMessages([...chatMessages, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const response = await fetch(`${API_URL}/ai/chat/${pdf._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: chatInput, conversationHistory: chatMessages })
      });
      if (!response.ok) throw new Error('Chat failed');
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      setError(error.message);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div style={styles.aiPage}>
      <button onClick={onBack} style={styles.backBtn}>← Back</button>
      <h2 style={styles.aiTitle}>
        <Sparkles size={28} /> AI Assistant
      </h2>
      <p style={styles.aiSubtitle}>{pdf.title}</p>

      {error && <div style={styles.errorBox}>⚠️ {error}</div>}

      {!analysis ? (
        <div style={styles.analyzeCard}>
          <Brain size={64} color="#667eea" />
          <h3>Analyze with AI</h3>
          <p style={styles.analyzeDesc}>Get summary, key points, and quiz</p>
          {loading && <div style={styles.spinner} />}
          <button onClick={analyzeDocument} disabled={loading} style={styles.primaryBtn}>
            {loading ? 'Analyzing...' : 'Analyze PDF'}
          </button>
        </div>
      ) : (
        <>
          <div style={styles.tabsContainer}>
            <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>📝 Summary</TabButton>
            <TabButton active={activeTab === 'keypoints'} onClick={() => setActiveTab('keypoints')}>🎯 Key Points</TabButton>
            <TabButton active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')}>📚 Quiz</TabButton>
            <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>💬 Chat</TabButton>
          </div>

          <div style={styles.tabContent}>
            {activeTab === 'summary' && (
              <div style={styles.contentBox}>
                <h3>📝 Summary</h3>
                <p style={styles.contentText}>{analysis.summary}</p>
              </div>
            )}

            {activeTab === 'keypoints' && (
              <div style={styles.contentBox}>
                <h3>🎯 Key Points</h3>
                <p style={styles.contentText}>{analysis.keyPoints}</p>
              </div>
            )}

            {activeTab === 'quiz' && (
              <div>
                {!quiz ? (
                  <div style={styles.quizPrompt}>
                    <p>Test your understanding!</p>
                    <button onClick={generateQuiz} disabled={loading} style={styles.primaryBtn}>
                      {loading ? 'Generating...' : 'Generate Quiz'}
                    </button>
                  </div>
                ) : (
                  <div>
                    {quiz.map((q, qIdx) => (
                      <div key={qIdx} style={styles.quizQuestion}>
                        <h4>Q{qIdx + 1}: {q.question}</h4>
                        {q.options.map((opt, oIdx) => {
                          const isSelected = userAnswers[qIdx] === oIdx;
                          const isCorrect = q.correctAnswer === oIdx;
                          const showCorrect = showResults && isCorrect;
                          const showWrong = showResults && isSelected && !isCorrect;
                          return (
                            <button
                              key={oIdx}
                              onClick={() => !showResults && handleAnswerSelect(qIdx, oIdx)}
                              disabled={showResults}
                              style={{
                                ...styles.optionBtn,
                                background: showCorrect ? '#4CAF50' : showWrong ? '#f44336' : isSelected ? '#e3f2fd' : 'white',
                                color: showCorrect || showWrong ? 'white' : '#333',
                              }}
                            >
                              {opt}
                              {showCorrect && <Check size={18} />}
                              {showWrong && <XCircle size={18} />}
                            </button>
                          );
                        })}
                        {showResults && q.explanation && (
                          <div style={styles.explanation}>💡 {q.explanation}</div>
                        )}
                      </div>
                    ))}
                    {!showResults ? (
                      <button onClick={checkAnswers} style={styles.submitBtn}>Submit</button>
                    ) : (
                      <div style={styles.quizResults}>
                        <h3>Score: {userAnswers.filter((a, i) => a === quiz[i].correctAnswer).length}/{quiz.length}</h3>
                        <button onClick={() => { setShowResults(false); setUserAnswers([]); }} style={styles.retryBtn}>
                          Try Again
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chat' && (
              <div>
                <div style={styles.chatContainer}>
                  {chatMessages.length === 0 ? (
                    <p style={styles.chatEmpty}>Ask me anything!</p>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} style={{
                        ...styles.chatMessage,
                        background: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                      }}>
                        <strong>{msg.role === 'user' ? '👤' : '🤖'}:</strong> {msg.content}
                      </div>
                    ))
                  )}
                </div>
                <div style={styles.chatInputContainer}>
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Ask a question..."
                    style={styles.chatInput}
                  />
                  <button onClick={sendChatMessage} disabled={chatLoading} style={styles.chatSendBtn}>
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.tabBtn,
        background: active ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
        color: active ? 'white' : '#666',
      }}
    >
      {children}
    </button>
  );
}

const keyframes = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
`;

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', position: 'relative', overflow: 'hidden' },
  bgCircle1: { position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', top: '-200px', left: '-200px', animation: 'float 6s ease-in-out infinite' },
  bgCircle2: { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', bottom: '-150px', right: '-150px', animation: 'float 8s ease-in-out infinite' },
  header: { background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 },
  headerContent: { maxWidth: '1200px', margin: '0 auto', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
  logo: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' },
  logoText: { margin: 0, fontSize: '20px', background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  nav: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  navBtn: { border: 'none', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', borderRadius: '8px', transition: 'all 0.3s' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '20px', position: 'relative', zIndex: 1 },
  homePage: { color: 'white', padding: '20px' },
  heroSection: { textAlign: 'center' },
  homeTitle: { fontSize: 'clamp(28px, 5vw, 48px)', marginBottom: '15px', fontWeight: 'bold' },
  gradient: { background: 'linear-gradient(135deg, #fff, #ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  homeSubtitle: { fontSize: 'clamp(16px, 3vw, 20px)', marginBottom: '30px', opacity: 0.9 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', margin: '30px auto', maxWidth: '600px' },
  statCard: { background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '20px', textAlign: 'center' },
  statIcon: { color: 'white', marginBottom: '10px' },
  statValue: { fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' },
  statLabel: { fontSize: '14px', opacity: 0.9 },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', margin: '40px 0' },
  featureCard: { background: 'rgba(255, 255, 255, 0.95)', padding: '30px 20px', borderRadius: '16px', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' },
  featureIcon: { width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', color: 'white' },
  featureTitle: { marginBottom: '10px', color: '#333', fontSize: '18px' },
  featureDesc: { color: '#666', lineHeight: '1.6', fontSize: '14px', margin: 0 },
  homeButtons: { display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '30px' },
  primaryBtn: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)', transition: 'all 0.3s' },
  secondaryBtn: { background: 'white', color: '#667eea', border: '2px solid white', padding: '14px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' },
  browsePage: { padding: '20px 0' },
  pageTitle: { color: 'white', fontSize: '32px', marginBottom: '20px', textAlign: 'center' },
  searchContainer: { position: 'relative', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' },
  searchIcon: { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' },
  searchInput: { width: '100%', padding: '14px 14px 14px 45px', fontSize: '16px', border: 'none', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', boxSizing: 'border-box' },
  pdfGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  pdfCard: { background: 'white', borderRadius: '16px', padding: '20px', transition: 'all 0.3s', cursor: 'pointer' },
  pdfCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  pdfBadge: { background: '#e3f2fd', color: '#667eea', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' },
  pdfTitle: { fontSize: '16px', marginBottom: '8px', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  pdfMeta: { color: '#666', fontSize: '13px', marginBottom: '15px' },
  pdfActions: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' },
  actionBtn: { border: 'none', padding: '10px 8px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'white', transition: 'all 0.3s' },
  emptyState: { textAlign: 'center', color: 'white', padding: '80px 20px' },
  uploadPage: { maxWidth: '700px', margin: '0 auto' },
  uploadSubtitle: { textAlign: 'center', color: 'white', fontSize: '16px', marginBottom: '30px', opacity: 0.9 },
  uploadCard: { background: 'white', borderRadius: '20px', padding: '50px 30px', textAlign: 'center', boxShadow: '0 15px 40px rgba(0,0,0,0.15)' },
  uploadIconWrapper: { width: '100px', height: '100px', margin: '0 auto 20px', background: 'linear-gradient(135deg, #667eea15, #764ba215)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  uploadIcon: { animation: 'float 3s ease-in-out infinite' },
  uploadCardTitle: { fontSize: '24px', marginBottom: '10px', color: '#333' },
  uploadCardText: { fontSize: '16px', color: '#666', marginBottom: '8px' },
  uploadCardSubtext: { fontSize: '13px', color: '#999', marginBottom: '25px' },
  uploadBtn: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modalContainer: { background: 'white', borderRadius: '16px', width: '90%', maxWidth: '1200px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  modalHeader: { padding: '20px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap' },
  modalTitle: { margin: 0, fontSize: '18px', color: '#333' },
  modalClose: { background: '#f5f5f5', border: 'none', color: '#333', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', transition: 'all 0.3s' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  aiPage: { background: 'white', borderRadius: '20px', padding: '30px 20px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' },
  backBtn: { background: 'transparent', color: '#667eea', border: '2px solid #667eea', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginBottom: '20px', transition: 'all 0.3s' },
  aiTitle: { color: '#667eea', marginBottom: '8px', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '10px' },
  aiSubtitle: { color: '#666', marginBottom: '25px', fontSize: '16px' },
  errorBox: { padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
  analyzeCard: { textAlign: 'center', padding: '60px 20px', background: 'linear-gradient(135deg, #667eea15, #764ba215)', borderRadius: '16px' },
  analyzeDesc: { color: '#666', marginTop: '15px', marginBottom: '30px', fontSize: '15px' },
  spinner: { width: '50px', height: '50px', border: '4px solid #f3f3f3', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '20px auto' },
  tabsContainer: { display: 'flex', gap: '8px', marginBottom: '25px', borderBottom: '2px solid #e0e0e0', flexWrap: 'wrap' },
  tabBtn: { padding: '12px 20px', border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s' },
  tabContent: { minHeight: '300px' },
  contentBox: { padding: '25px', background: '#f8f9fa', borderRadius: '12px' },
  contentText: { lineHeight: '1.8', whiteSpace: 'pre-wrap', color: '#333', fontSize: '15px' },
  quizPrompt: { textAlign: 'center', padding: '50px 20px', background: '#f8f9fa', borderRadius: '12px' },
  quizQuestion: { marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '12px' },
  optionBtn: { width: '100%', padding: '14px', marginBottom: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', border: '2px solid #e0e0e0' },
  explanation: { marginTop: '15px', padding: '12px', background: '#e3f2fd', borderRadius: '8px', fontSize: '13px', color: '#1565c0' },
  submitBtn: { width: '100%', maxWidth: '300px', margin: '20px auto', display: 'block', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' },
  quizResults: { textAlign: 'center', padding: '30px', background: '#f8f9fa', borderRadius: '12px', marginTop: '20px' },
  retryBtn: { background: 'white', color: '#667eea', border: '2px solid #667eea', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginTop: '15px' },
  chatContainer: { height: '400px', overflowY: 'auto', padding: '15px', background: '#f8f9fa', borderRadius: '12px', marginBottom: '15px' },
  chatEmpty: { textAlign: 'center', color: '#999', paddingTop: '150px', fontSize: '16px' },
  chatMessage: { padding: '12px', marginBottom: '10px', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6' },
  chatInputContainer: { display: 'flex', gap: '10px' },
  chatInput: { flex: 1, padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' },
  chatSendBtn: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  footer: { textAlign: 'center', padding: '40px 20px', color: 'white', opacity: 0.8, marginTop: '60px', fontSize: '14px', position: 'relative', zIndex: 1 },
};

export default App;