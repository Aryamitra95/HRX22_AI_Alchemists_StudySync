import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const WebSummarizer = () => {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!url.trim()) {
      alert('Please enter a valid URL');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/web_summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: url }),
      });
      const data = await response.json();
      setSummary(data.summary);
      } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="web-summarizer-container">
      <div className="header">
        <h1 className="main-title">🌐 Web Summarizer</h1>
        <p className="subtitle">Summarize any web article with AI</p>
      </div>
      
      <div className="input-section">
        <input
          type="text"
          placeholder="Paste web article URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="url-input"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`submit-btn ${loading ? 'loading' : ''}`}
        >
          {loading ? 'Processing...' : 'Summarize Article'}
        </button>
      </div>

      {summary && (
        <div className="summary-section">
          <h3 className="summary-title">Summary</h3>
          <p className="summary-text"><ReactMarkdown>{summary}</ReactMarkdown></p>
        </div>
      )}
    </div>
  );
};

export default WebSummarizer;