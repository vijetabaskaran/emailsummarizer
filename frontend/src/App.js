import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import React, { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function App() {
  const [email, setEmail] = useState("");

  const [summary, setSummary] = useState("");
  const [context, setContext] = useState("");
  const [from, setFrom] = useState("");
  const [category, setCategory] = useState("");

  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [showToneBox, setShowToneBox] = useState(false);
  const [tone, setTone] = useState("Professional");

  // Custom transparent glass styling variables
  const glassCardStyle = {
    background: "rgba(30, 41, 59, 0.45)", // Semi-transparent dark slate
    backdropFilter: "blur(12px)", // Frosted glass effect
    WebkitBackdropFilter: "blur(12px)", // Safari support
    border: "1px solid rgba(255, 255, 255, 0.08)", // Subtle glowing border
    borderRadius: "16px",
    color: "#f8fafc",
  };

  const getCategoryBadgeClass = (cat) => {
    switch (cat?.toLowerCase()) {
      case "spam": return "alert alert-danger bg-danger bg-opacity-25 text-danger border-danger border-opacity-50";
      case "advertisement": case "ad": return "alert alert-warning bg-warning bg-opacity-25 text-warning border-warning border-opacity-50";
      case "professional": return "alert alert-primary bg-primary bg-opacity-25 text-info border-primary border-opacity-50";
      case "urgent": return "alert alert-light bg-light bg-opacity-10 text-white border-light border-opacity-25";
      case "casual": return "alert alert-info bg-info bg-opacity-25 text-info border-info border-opacity-50";
      default: return "alert alert-secondary bg-secondary bg-opacity-25 text-white border-secondary border-opacity-50";
    }
  };

  // ---------------------------
  // ANALYZE EMAIL
  // ---------------------------
  const analyzeEmail = async () => {
    if (!email.trim()) return alert("Please paste an email first.");
    
    setLoading(true);
    setSummary("");
    setContext("");
    setFrom("");
    setCategory("");
    setReply("");
    setShowToneBox(false);

    try {
      const res = await axios.post(`${API_URL}/analyze`, {
        email: email,
        tone: tone,
      });

      const data = res.data;

      if (data && !data.error) {
        setSummary(data.summary || "No summary provided.");
        setContext(data.context || "No context extracted.");
        setFrom(data.from || "Unknown Sender");
        setCategory(data.category || "General"); 
        setShowToneBox(true); 
      } else {
        alert("Backend Analysis Error: " + (data.error || "Malformed data object"));
      }

    } catch (err) {
      console.error("Analyze Error Details:", err);
      const serverErrorMessage = err.response?.data?.detail || err.message;
      alert(`Network or Server Error: ${serverErrorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // GENERATE REPLY USING GROQ
  // ---------------------------
  const generateReply = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(`${API_URL}/generate`, {
        email: email,
        tone: tone,
      });

      setReply(res.data.reply);
    } catch (err) {
      console.log("Generate Error:", err);
      alert("Error generating email response.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top right, #1a454d28, #395455, #020617)", // Rich cinematic dark gradient
        padding: "40px 20px",
      }}
    >
      <div className="container" style={{ maxWidth: "800px" }}>

        {/* HEADER */}
        <div className="mb-5 text-center">
          <h2 className="fw-bold text-white mb-2" style={{ letterSpacing: "-0.5px" }}>AI Email Smart Assistant</h2>
          <p className="text-white">Analyze messages and compile quick responses securely.</p>
        </div>

        {/* EMAIL INPUT CARD */}
        <div className="p-4 mb-4" style={glassCardStyle}>
          <h5 className="mb-3 text-white fw-semibold">Email Content</h5>
          <textarea
            className="form-control mb-3 text-white border-0"
            style={{ 
              background: "rgba(102, 117, 138, 0.6)", 
              borderRadius: "8px",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.4)" 
            }}
            rows="7"
            placeholder="Paste your source email text structure here..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            className="btn btn-primary w-100 fw-bold py-2 border-0"
            style={{ background: "#29282e", boxShadow: "0 4px 14px rgba(156, 155, 172, 0.4)" }}
            onClick={analyzeEmail}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Running Intelligence Analysis...
              </>
            ) : "Analyze Email"}
          </button>
        </div>

        {/* SEPARATED ANALYSIS RESULTS SECTION */}
        {(category || from || context || summary) && (
          <div className="p-4 mb-4" style={glassCardStyle}>
            <h4 className="border-bottom border-secondary pb-2 mb-3 text-white fw-bold">Analysis Profile</h4>

            {/* EMAIL CLASSIFICATION STATUS */}
            {category && (
              <div className={`${getCategoryBadgeClass(category)} d-flex justify-content-between align-items-center fw-semibold fs-5 mb-4`} role="alert">
                <span>Detected Email Type:</span>
                <span className="badge bg-white text-dark text-uppercase border-0 shadow-sm">{category}</span>
              </div>
            )}

            {/* SENDER DETAILS */}
            {from && (
              <div className="mb-3">
                <h6 style={{color: "lightsteelblue"}} className ="fw-medium"> From / Sender</h6>
                <p className="p-2 rounded border-start border-primary border-3 text-gray" style={{ background: "rgba(255,255,255,0.04)" }}>{from}</p>
              </div>
            )}

            {/* CONTEXT */}
            {context && (
              <div className="mb-3">
                <h6 style={{ color: "lightsteelblue" }} className="fw-medium">
                  Contextual Details
                </h6>               
                 <p className="p-2 rounded border-start border-primary border-3 text-gray" style={{ background: "rgba(255,255,255,0.04)" }}>{context}</p>
              </div>
            )}

            {/* SUMMARY */}
            {summary && (
              <div className="mb-2">
                <h6 style={{ color: "lightsteelblue" }} className="fw-medium">
                  Summary
                </h6>
                <p className="p-2 rounded border-start border-primary border-3 text-gray" style={{ background: "rgba(255,255,255,0.04)" }}>{summary}</p>
              </div>
            )}
          </div>
        )}

        {/* DYNAMIC RESPONSE WORKFLOW (ONLY REVEALED POST-ANALYSIS) */}
        {showToneBox && (
          <div className="p-4 mb-4" style={glassCardStyle}>
            <h5 className="fw-bold mb-3 text-white"> Generated response Template</h5>
            <div className="row g-3 align-items-end">
              <div className="col-md-7">
                <label className="form-label text-white fw-medium">Choose Response Flavor/Tone:</label>
                <select
                className="form-select text-white"
                style={{ 
                  background: "rgba(15, 23, 42, 0.8)", 
                  borderRadius: "8px",
                  border: "2px solid rgba(32, 37, 36, 0.4)", 
                  boxShadow: "0 0 8px rgba(16, 185, 129, 0.15)",
                  
                  /* FORCE THE ARROW EMBED */
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2310b981' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  backgroundSize: "14px",
                  paddingRight: "40px" // Leaves breathing room so text never overlaps the arrow
                }}
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option style={{ background: "#1e293b" }}>Professional</option>
                <option style={{ background: "#1e293b" }}>Friendly</option>
                <option style={{ background: "#1e293b" }}>Formal</option>
                <option style={{ background: "#1e293b" }}>Casual</option>
                <option style={{ background: "#1e293b" }}>Apologetic</option>
                <option style={{ background: "#1e293b" }}>Confident</option>
              </select>
              </div>
              <div className="col-md-5">
                <button
                  className="btn btn-success w-100 fw-bold py-2 border-0"
                  style={{ background: "#67747e", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)" }}
                  onClick={generateReply}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Drafting...
                    </>
                  ) : "Compile Response"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COMPLETED REPLY DISPLAY WITH THE COPY OPTION */}
        {reply && (
          <div className="p-4" style={{ ...glassCardStyle, background: "rgba(15, 23, 42, 0.6)" }}>
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-2 mb-3">
              <h4 className="text-white fw-bold mb-0">Generated Reply Draft</h4>
              
              <button
                className="btn btn-sm fw-bold border-0 px-3 py-1"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#686779",
                  borderRadius: "6px",
                  transition: "all 0.2s"
                }}
                onClick={(e) => {
                  navigator.clipboard.writeText(reply);
                  const originalText = e.target.innerText;
                  e.target.innerText = "✅ Copied!";
                  e.target.style.background = "rgba(16, 185, 129, 0.2)";
                  
                  setTimeout(() => {
                    e.target.innerText = originalText;
                    e.target.style.background = "rgba(255, 255, 255, 0.1)";
                  }, 2000);
                }}
              >
                📋 Copy Response
              </button>
            </div>

            <textarea
              className="form-control text-white border-0"
              style={{ 
                fontFamily: "monospace", 
                fontSize: "14px", 
                background: "rgba(0, 0, 0, 0.3)",
                lineHeight: "1.6"
              }}
              rows="10"
              value={reply}
              readOnly
            />
          </div>
        )}

      </div>
    </div>
  );
}

export default App;