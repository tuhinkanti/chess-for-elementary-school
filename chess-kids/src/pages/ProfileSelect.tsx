import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Star } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { avatarOptions } from '../data/profiles';

export function ProfileSelect() {
  const navigate = useNavigate();
  const { profiles, selectProfile, createProfile, deleteProfile } = useProfile();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);

  const handleSelectProfile = (profileId: string) => {
    selectProfile(profileId);
    navigate('/');
  };

  const handleCreateProfile = () => {
    if (newName.trim()) {
      const profile = createProfile(newName.trim(), selectedAvatar);
      selectProfile(profile.id);
      navigate('/');
    }
  };

  const handleDeleteProfile = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    if (confirm('Delete this profile? Progress will be lost!')) {
      deleteProfile(profileId);
    }
  };

  return (
    <div className="profile-select-page">
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
      >
        ♟️ Chess Kids
      </motion.h1>
      
      <motion.p
        className="subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Who's playing today?
      </motion.p>

      {!showCreate ? (
        <>
          <div className="profiles-grid">
            {profiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                className="profile-card"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectProfile(profile.id)}
              >
                <button
                  className="delete-profile-btn"
                  onClick={(e) => handleDeleteProfile(e, profile.id)}
                >
                  <Trash2 size={16} />
                </button>
                <div className="profile-avatar">{profile.avatar}</div>
                <div className="profile-name">{profile.name}</div>
                <div className="profile-stars">
                  <Star size={14} fill="gold" color="gold" />
                  <span>0</span>
                </div>
              </motion.div>
            ))}

            <motion.div
              className="profile-card add-profile"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * profiles.length }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreate(true)}
            >
              <Plus size={48} />
              <div className="profile-name">Add Player</div>
            </motion.div>
          </div>
        </>
      ) : (
        <motion.div
          className="create-profile-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>New Player</h2>

          <div className="avatar-picker">
            <p>Pick your buddy:</p>
            <div className="avatar-grid">
              {avatarOptions.map((avatar) => (
                <motion.button
                  key={avatar}
                  className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  {avatar}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="name-input-group">
            <label>Your name:</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="form-buttons">
            <button className="cancel-btn" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <motion.button
              className="create-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateProfile}
              disabled={!newName.trim()}
            >
              Let's Play!
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
