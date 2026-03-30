import React, { useState, useEffect } from 'react';
import './App.css';
import { Upload, Wand2, Image as ImageIcon, CheckCircle, Clock } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentEnhancement, setCurrentEnhancement] = useState(null);
  const [currentImageAnalysis, setCurrentImageAnalysis] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [textHistory, setTextHistory] = useState([]);
  const [imageHistory, setImageHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const [textResponse, imageResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/text-enhancements`),
        fetch(`${API_BASE_URL}/image-analyses`)
      ]);

      if (textResponse.ok) {
        const textData = await textResponse.json();
        setTextHistory(textData);
      }

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        setImageHistory(imageData);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleTextEnhancement = async () => {
    if (!textInput.trim()) {
      showMessage('error', 'Please enter some text to enhance');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/enhance-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textInput }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentEnhancement(data);
        showMessage('success', 'Text enhancement started');

        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${API_BASE_URL}/text-enhancement/${data.id}`);
            const statusData = await statusResponse.json();

            if (statusData.status === 'completed') {
              setCurrentEnhancement(statusData);
              clearInterval(pollInterval);
              setLoading(false);
              fetchHistory();
              showMessage('success', 'Text enhancement completed!');
            } else if (statusData.status === 'processing') {
            }
          } catch (error) {
            console.error('Error polling status:', error);
            clearInterval(pollInterval);
            setLoading(false);
          }
        }, 1000);
      } else {
        showMessage('error', data.error || 'Failed to enhance text');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('error', 'Network error occurred');
      setLoading(false);
    }
  };

  const handleApproveAndGenerate = async () => {
    if (!currentEnhancement || !currentEnhancement.enhanced_text) {
      showMessage('error', 'No enhanced text to approve');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/approve-and-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enhancementId: currentEnhancement.id,
          enhancedText: currentEnhancement.enhanced_text
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', 'Image generation started');

        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${API_BASE_URL}/generated-image/${data.imageId}`);
            const statusData = await statusResponse.json();

            if (statusData.status === 'completed') {
              setGeneratedImage(statusData);
              clearInterval(pollInterval);
              setLoading(false);
              showMessage('success', 'Image generated successfully!');
            } else if (statusData.status === 'processing') {
            }
          } catch (error) {
            console.error('Error polling status:', error);
            clearInterval(pollInterval);
            setLoading(false);
          }
        }, 1000);
      } else {
        showMessage('error', data.error || 'Failed to generate image');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('error', 'Network error occurred');
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setLoading(true);
    setCurrentImageAnalysis(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-image`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentImageAnalysis(data);
        showMessage('success', 'Image analysis started');

        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${API_BASE_URL}/image-analysis/${data.id}`);
            const statusData = await statusResponse.json();

            if (statusData.status === 'completed') {
              setCurrentImageAnalysis(statusData);
              clearInterval(pollInterval);
              setLoading(false);
              fetchHistory();
              showMessage('success', 'Image analysis completed!');
            } else if (statusData.status === 'processing') {
            }
          } catch (error) {
            console.error('Error polling status:', error);
            clearInterval(pollInterval);
            setLoading(false);
          }
        }, 1000);
      } else {
        showMessage('error', data.error || 'Failed to analyze image');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('error', 'Network error occurred');
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = `status-badge status-${status}`;
    return <span className={statusClass}>{status}</span>;
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>AI Creative Studio</h1>
          <p>Enhance your text and generate stunning images with AI</p>
        </header>

        <div className="workflow-tabs">
          <button
            className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            <Wand2 size={20} style={{ marginRight: '8px' }} />
            Text Enhancement
          </button>
          <button
            className={`tab-button ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => setActiveTab('image')}
          >
            <ImageIcon size={20} style={{ marginRight: '8px' }} />
            Image Analysis
          </button>
        </div>

        <div className="workflow-container">
          {message.text && (
            <div className={`${message.type}-message`}>
              {message.text}
            </div>
          )}

          {activeTab === 'text' && (
            <div>
              <div className="input-section">
                <label className="input-label">Enter your text prompt:</label>
                <textarea
                  className="text-input"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter your text here and I'll enhance it for better image generation..."
                  disabled={loading}
                />
              </div>

              <div className="button-group">
                <button
                  className="btn btn-primary"
                  onClick={handleTextEnhancement}
                  disabled={loading || !textInput.trim()}
                >
                  <Wand2 size={20} />
                  {loading ? 'Enhancing...' : 'Enhance Text'}
                </button>
              </div>

              {currentEnhancement && (
                <div className="result-section">
                  <h3 className="result-title">
                    {currentEnhancement.status === 'processing' ? (
                      <>
                        <Clock size={20} style={{ marginRight: '8px' }} />
                        Enhancing your text...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} style={{ marginRight: '8px' }} />
                        Enhanced Text
                      </>
                    )}
                  </h3>

                  <div className="result-content">
                    <p><strong>Original:</strong> {currentEnhancement.original_text}</p>
                    {currentEnhancement.enhanced_text && (
                      <p><strong>Enhanced:</strong> {currentEnhancement.enhanced_text}</p>
                    )}
                  </div>

                  {currentEnhancement.status === 'completed' && (
                    <div className="button-group">
                      <button
                        className="btn btn-secondary"
                        onClick={handleApproveAndGenerate}
                        disabled={loading}
                      >
                        <ImageIcon size={20} />
                        {loading ? 'Generating...' : 'Generate Image'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {generatedImage && (
                <div className="result-section">
                  <h3 className="result-title">
                    <CheckCircle size={20} style={{ marginRight: '8px' }} />
                    Generated Image
                  </h3>
                  <img
                    src={generatedImage.image_url}
                    alt="Generated"
                    className="image-preview"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'image' && (
            <div>
              <div className="input-section">
                <label className="input-label">Upload an image for analysis:</label>
                <div className="file-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={loading}
                  />
                  <label className="file-upload-label">
                    <div className="file-upload-content">
                      <Upload className="file-upload-icon" />
                      <p className="file-upload-text">
                        {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {currentImageAnalysis && (
                <div className="result-section">
                  <h3 className="result-title">
                    {currentImageAnalysis.status === 'processing' ? (
                      <>
                        <Clock size={20} style={{ marginRight: '8px' }} />
                        Analyzing your image...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} style={{ marginRight: '8px' }} />
                        Image Analysis
                      </>
                    )}
                  </h3>

                  {currentImageAnalysis.status === 'completed' && currentImageAnalysis.analysis_result && (
                    <div>
                      <div className="result-content">
                        <p><strong>Objects detected:</strong> {currentImageAnalysis.analysis_result.objects.join(', ')}</p>
                        <p><strong>Theme:</strong> {currentImageAnalysis.analysis_result.theme}</p>
                        <p><strong>Style:</strong> {currentImageAnalysis.analysis_result.style}</p>
                        <p><strong>Description:</strong> {currentImageAnalysis.analysis_result.description}</p>
                      </div>

                      {currentImageAnalysis.variations && (
                        <div>
                          <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Generated Variations:</h4>
                          <div className="image-grid">
                            {currentImageAnalysis.variations.map((variation, index) => (
                              <div key={index} className="image-item">
                                <img src={variation} alt={`Variation ${index + 1}`} />
                                <p>Variation {index + 1}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>




              )}


            </div>
          )}

          {loading && (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          )}
        </div>

        {(textHistory.length > 0 || imageHistory.length > 0) && (
          <div className="history-section">
            <h2 className="history-title">History</h2>

            {textHistory.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3>Text Enhancements</h3>
                {textHistory.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-item-header">
                      <span>{getStatusBadge(item.status)}</span>
                      <span className="history-item-date">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="history-item-content">
                      <p><strong>Original:</strong> {item.original_text}</p>
                      {item.enhanced_text && (
                        <p><strong>Enhanced:</strong> {item.enhanced_text}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {imageHistory.length > 0 && (
              <div>
                <h3>Image Analyses</h3>
                {imageHistory.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-item-header">
                      <span>{getStatusBadge(item.status)}</span>
                      <span className="history-item-date">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="history-item-content">
                      <p><strong>File:</strong> {item.filename}</p>
                      {item.analysis_result && typeof item.analysis_result === 'object' && (
                        <p><strong>Analysis:</strong> {item.analysis_result.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
