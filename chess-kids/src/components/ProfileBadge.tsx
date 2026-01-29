import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProfile } from '../context/ProfileContext';

export function ProfileBadge() {
  const navigate = useNavigate();
  const { currentProfile } = useProfile();

  if (!currentProfile) return null;

  return (
    <motion.button
      className="profile-badge"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate('/profiles')}
      title="Switch player"
    >
      <span className="badge-avatar">{currentProfile.avatar}</span>
      <span className="badge-name">{currentProfile.name}</span>
    </motion.button>
  );
}
