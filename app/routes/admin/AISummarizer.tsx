import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface SummaryHistory {
    id: string;
    url: string;
    title: string;
    summary: string;
    timestamp: Date;
}

const AiSummarizer = () => {
    const [url, setUrl] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [urlValidation, setUrlValidation] = useState({ isValid: false, message: '' });
    const [summaryHistory, setSummaryHistory] = useState<SummaryHistory[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [processingStep, setProcessingStep] = useState('');

    const validateUrl = (url: string) => {
        try {
            new URL(url);
            return { isValid: true, message: '' };
        } catch {
            return { isValid: false, message: 'Please enter a valid URL' };
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setUrl(newUrl);
        if (newUrl.trim()) {
            setUrlValidation(validateUrl(newUrl));
        } else {
            setUrlValidation({ isValid: false, message: '' });
        }
    };

    const getFavicon = (url: string) => {
        try {
            const urlObj = new URL(url);
            return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
        } catch {
            return '';
        }
    };

    const getDomain = (url: string) => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return '';
        }
    };

    const handleSubmit = async () => {
        if (!url.trim()) {
            setUrlValidation({ isValid: false, message: 'Please enter a URL' });
            return;
        }

        if (!urlValidation.isValid) {
            return;
        }
        
        setLoading(true);
        setProcessingStep('Analyzing content...');
        
        try {
            const response = await fetch('http://localhost:5000/web_summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ link: url }),
            });
            
            setProcessingStep('Generating summary...');
            const data = await response.json();
            setSummary(data.summary);
            
            // Add to history
            const newSummary: SummaryHistory = {
                id: Date.now().toString(),
                url: url,
                title: getDomain(url),
                summary: data.summary,
                timestamp: new Date()
            };
            setSummaryHistory(prev => [newSummary, ...prev.slice(0, 9)]); // Keep last 10
            
        } catch (error) {
            console.error(error);
            alert('Something went wrong while summarizing the article.');
        } finally {
            setLoading(false);
            setProcessingStep('');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here
    };

    const estimateReadingTime = (text: string) => {
        const wordsPerMinute = 200;
        const wordCount = text.split(/\s+/).length;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return minutes;
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">🌐 AI Summarizer</h1>
                            <p className="text-gray-600 mt-1">Transform any web article into concise summaries</p>
                        </div>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            History
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Smart Input Section */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Article URL</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Paste web article URL here..."
                                        value={url}
                                        onChange={handleUrlChange}
                                        className={`w-full p-4 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                            urlValidation.isValid ? 'border-green-300 bg-green-50' : 
                                            urlValidation.message ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                        }`}
                                    />
                                    {urlValidation.message && (
                                        <p className="text-red-600 text-sm mt-2">{urlValidation.message}</p>
                                    )}
                                </div>

                                {url && urlValidation.isValid && (
                                    <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <img 
                                            src={getFavicon(url)} 
                                            alt="Site favicon" 
                                            className="w-6 h-6 mr-3"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                        <div>
                                            <p className="font-medium text-blue-900">{getDomain(url)}</p>
                                            <p className="text-sm text-blue-700">Ready to summarize</p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !urlValidation.isValid}
                                    className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                                        loading || !urlValidation.isValid
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                                    }`}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                            {processingStep}
                                        </div>
                                    ) : (
                                        'Summarize Article'
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Summary Display */}
                        {summary && (
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Summary</h2>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-sm text-gray-500">
                                            📖 {estimateReadingTime(summary)} min read
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(summary)}
                                            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Copy
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="prose max-w-none">
                                    <ReactMarkdown>{summary}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button className="w-full flex items-center justify-center p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Save to Notes
                                </button>
                                <button className="w-full flex items-center justify-center p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Create Quiz
                                </button>
                                <button className="w-full flex items-center justify-center p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                    </svg>
                                    Share Summary
                                </button>
                            </div>
                        </div>

                        {/* Summary History */}
                        {showHistory && summaryHistory.length > 0 && (
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Summaries</h3>
                                <div className="space-y-3">
                                    {summaryHistory.map((item) => (
                                        <div key={item.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                            <div className="flex items-center mb-2">
                                                <img 
                                                    src={getFavicon(item.url)} 
                                                    alt="Site favicon" 
                                                    className="w-4 h-4 mr-2"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {item.timestamp.toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default AiSummarizer;
