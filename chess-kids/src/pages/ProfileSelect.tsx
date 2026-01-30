import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Star } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
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
                style={{ cursor: 'default' }}
              >
                <button
                  className="profile-content-btn"
                  onClick={() => handleSelectProfile(profile.id)}
                  aria-label={`Select profile ${profile.name}`}
                >
                  <div className="profile-avatar">{profile.avatar}</div>
                  <div className="profile-name">{profile.name}</div>
                  <div className="profile-stars">
                    <Star size={14} fill="gold" color="gold" />
                    <span>0</span>
                  </div>
                </button>
                <button
                  className="delete-profile-btn"
                  onClick={(e) => handleDeleteProfile(e, profile.id)}
                  aria-label={`Delete profile ${profile.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}

            <motion.button
              className="profile-card add-profile"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * profiles.length }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreate(true)}
              aria-label="Add new player"
            >
              <Plus size={48} />
              <div className="profile-name">Add Player</div>
            </motion.button>
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
            <p id="avatar-picker-label">Pick your buddy:</p>
            <div className="avatar-grid" role="group" aria-labelledby="avatar-picker-label">
              {avatarOptions.map((avatar) => (
                <motion.button
                  key={avatar}
                  className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedAvatar(avatar)}
                  aria-label={selectedAvatar === avatar ? `Avatar ${avatar} selected` : `Select avatar ${avatar}`}
                  aria-pressed={selectedAvatar === avatar}
                >
                  {avatar}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="name-input-group">
            <label htmlFor="profile-name">Your name:</label>
            <input
              id="profile-name"
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
