import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <motion.div
        className="not-found-content"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <div className="error-code">404</div>
        <h1>Oops! You're off the board!</h1>
        <p>This square doesn't exist.</p>

        <motion.button
          className="home-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
        >
          <Home size={20} />
          Go Home
        </motion.button>
      </motion.div>

      <style>{`
        .not-found-page {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .not-found-content {
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          padding: 3rem;
          border-radius: 2rem;
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow);
          max-width: 400px;
          width: 90%;
        }

        .error-code {
          font-size: 6rem;
          font-weight: 800;
          color: var(--secondary);
          line-height: 1;
          margin-bottom: 1rem;
          text-shadow: 0 4px 12px rgba(255, 217, 61, 0.3);
        }

        h1 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        p {
          color: var(--text-muted);
          margin-bottom: 2rem;
        }

        .home-button {
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 1rem;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(74, 144, 217, 0.3);
        }
      `}</style>
    </div>
  );
}
