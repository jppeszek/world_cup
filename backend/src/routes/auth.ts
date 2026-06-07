import { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { hashPassword, comparePassword, generateRandomToken } from '../utils/hash.js';
import { RegisterRequest, LoginRequest } from '../types/index.js';

const router = Router();

// POST /api/auth/register - Register with invite token
router.post('/register', async (req: Request, res: Response) => {
  const { token, email, nickname, password } = req.body as RegisterRequest;

  if (!token || !email || !nickname || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Verify invite token
    const inviteResult = await query(
      `SELECT * FROM invites
       WHERE token = $1 AND status = 'sent' AND expires_at > NOW()`,
      [token],
    );

    if (inviteResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invite token' });
    }

    const invite = inviteResult.rows[0];

    if (invite.email !== email) {
      return res.status(400).json({ error: 'Email does not match invite' });
    }

    // Check if email already registered
    const existingEmail = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if nickname already taken
    const existingNickname = await query('SELECT id FROM users WHERE nickname = $1', [nickname]);
    if (existingNickname.rows.length > 0) {
      return res.status(400).json({ error: 'Nickname already taken' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userResult = await query(
      `INSERT INTO users (nickname, email, password_hash, is_admin, notify_reminders)
       VALUES ($1, $2, $3, false, true)
       RETURNING id, nickname, email, is_admin`,
      [nickname, email, passwordHash],
    );

    const user = userResult.rows[0];

    // Mark invite as accepted
    await query(
      `UPDATE invites SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
      [invite.id],
    );

    // Set session
    req.session.userId = user.id;

    res.status(201).json({ user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login - Login with email and password
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginRequest;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Get user
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Compare password
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Set session
    req.session.userId = user.id;

    res.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        is_admin: user.is_admin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout - Logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out' });
  });
});

// GET /api/auth/me - Get current user
router.get('/me', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const result = await query('SELECT id, nickname, email, is_admin FROM users WHERE id = $1', [
      req.session.userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    // Check if user exists
    const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists for security
      return res.json({ message: 'If email exists, reset link will be sent' });
    }

    const user = userResult.rows[0];
    const resetToken = generateRandomToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Store reset token (we could use a separate table, but for MVP we'll use a simple approach)
    // In production, store in a reset_tokens table
    // For now, we'll skip email sending in Phase 1

    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({ message: 'If email exists, reset link will be sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // TODO: Implement token verification and password reset
  res.json({ message: 'Password reset not yet implemented' });
});

export default router;
