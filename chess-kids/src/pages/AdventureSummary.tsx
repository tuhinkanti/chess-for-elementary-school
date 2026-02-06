import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, Award, Heart, PenTool, Star } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';

export function AdventureSummary() {
  const navigate = useNavigate();
  const { currentProfile } = useProfile();

  if (!currentProfile) {
      navigate('/profiles');
      return null;
  }

  return (
    <div className="summary-page">
      <header className="summary-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <h1>🎉 Chess Adventure Certificate</h1>
        <button className="print-button" onClick={() => window.print()}>
          <Printer size={24} />
        </button>
      </header>

      <main className="summary-content">
        <motion.div
            className="certificate-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
        >
            <Award size={64} className="certificate-icon" />
            <h2>Certificate of Excellence</h2>
            <p>This certifies that</p>
            <h3 className="student-name">{currentProfile.name}</h3>
            <p>Has begun their journey to become a Chess Master!</p>
            <div className="stars-earned">
                <Star size={24} fill="#f1c40f" color="#f1c40f" />
                <span>{currentProfile.stars} Stars Earned</span>
                <Star size={24} fill="#f1c40f" color="#f1c40f" />
            </div>
        </motion.div>

        <section className="info-section">
            <h2>🌟 Chess Manners for Champions</h2>
            <ul className="manners-list">
                <li><Heart size={16} /> Shake hands before and after the game 🤝</li>
                <li><Heart size={16} /> "Touch move": If you touch it, move it!</li>
                <li><Heart size={16} /> Say "I adjust" if you just want to fix a piece.</li>
                <li><Heart size={16} /> Don't brag when you win, don't cry when you lose.</li>
                <li><Heart size={16} /> Take your time—chess is not a race!</li>
            </ul>
        </section>

        <section className="info-section worksheet-section">
            <h2>🎨 CHESS WORKSHEET</h2>
            <p>Grab a paper and draw your pieces! <PenTool size={20} /></p>
            <div className="worksheet-grid">
                <div className="worksheet-item">
                    <span>King ⭐</span>
                    <small>(Weak but important)</small>
                </div>
                <div className="worksheet-item">
                    <span>Queen ⭐⭐⭐⭐⭐</span>
                    <small>(Super strong!)</small>
                </div>
                <div className="worksheet-item">
                    <span>Rook ⭐⭐⭐⭐</span>
                </div>
                <div className="worksheet-item">
                    <span>Bishop ⭐⭐⭐</span>
                </div>
                <div className="worksheet-item">
                    <span>Knight ⭐⭐⭐</span>
                </div>
                <div className="worksheet-item">
                    <span>Pawn ⭐</span>
                    <small>(Can become a Queen!)</small>
                </div>
            </div>
        </section>

        <section className="info-section next-steps">
            <h2>🚀 Next Steps</h2>
            <div className="steps-timeline">
                <div className="step">
                    <strong>Week 1:</strong> Learn how each piece moves
                </div>
                <div className="step">
                    <strong>Week 2:</strong> Learn Check and Checkmate
                </div>
                <div className="step">
                    <strong>Week 3:</strong> Play full games!
                </div>
                <div className="step">
                    <strong>Week 4:</strong> Learn special moves
                </div>
            </div>
            <p className="quote">
                "Every master was once a beginner." ♟️✨
            </p>
        </section>
      </main>

      <style>{`
        .summary-page {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
            min-height: 100vh;
        }
        .summary-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }
        .back-button, .print-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: background 0.2s;
        }
        .back-button:hover, .print-button:hover {
            background: rgba(0,0,0,0.05);
        }
        .certificate-card {
            background: white;
            padding: 2rem;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 4px solid #f1c40f;
            margin-bottom: 2rem;
        }
        .certificate-icon {
            color: #f1c40f;
            margin-bottom: 1rem;
        }
        .student-name {
            font-size: 2.5rem;
            color: #2c3e50;
            margin: 1rem 0;
            font-family: 'Comic Sans MS', cursive, sans-serif;
        }
        .stars-earned {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            font-weight: bold;
            color: #f39c12;
        }
        .info-section {
            background: white;
            padding: 1.5rem;
            border-radius: 15px;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .manners-list {
            list-style: none;
            padding: 0;
        }
        .manners-list li {
            margin: 10px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .worksheet-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        .worksheet-item {
            border: 2px dashed #bdc3c7;
            padding: 1rem;
            border-radius: 10px;
            text-align: center;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .steps-timeline {
            margin-top: 1rem;
        }
        .step {
            padding: 10px;
            border-left: 3px solid #3498db;
            margin-bottom: 10px;
            background: #f0f8ff;
            border-radius: 0 5px 5px 0;
        }
        .quote {
            text-align: center;
            font-style: italic;
            margin-top: 1.5rem;
            color: #7f8c8d;
        }
        @media print {
            .back-button, .print-button {
                display: none;
            }
            .summary-page {
                background: white;
            }
        }
      `}</style>
    </div>
  );
}
