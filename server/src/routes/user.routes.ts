import { Router } from 'express';
import { db } from '../db/firestore.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Search users
router.get('/search', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const q = (req.query.q as string) || '';
    const currentUserId = req.user!.id;
    const users = await db.searchUsers(q, currentUserId);
    res.json({ users });
  } catch (err) {
    console.error('User search error:', err);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user's public key (essential for ECDH browser key agreement)
router.get('/:id/public-key', authMiddleware, async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await db.getUserById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      id: user.id,
      username: user.username,
      publicKey: user.publicKey,
    });
  } catch (err) {
    console.error('Public key retrieval error:', err);
    res.status(500).json({ error: 'Failed to retrieve public key' });
  }
});

export default router;
