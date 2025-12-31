import { ApiError } from '../exceptions/api.error.js';
import { Token } from '../models/token.js';
import { User } from '../models/user.js';
import { validateEmail, validatePassword } from '../utils/validation.js';
import { jwtService } from '../services/jwt.service.js';
import { tokenService } from '../services/token.service.js';
import { userService } from '../services/user.service.js';
import bcrypt from 'bcrypt';

const ACTIVATED_STATUS = 'activated';

const register = async (req, res) => {
  const { name, email, password } = req.body;

  const errors = {
    name: !name ? 'Name is required' : null,
    email: validateEmail(email),
    password: validatePassword(password),
  };

  if (errors.name || errors.email || errors.password) {
    throw ApiError.badRequest('Bad request', errors);
  }

  const hashedPass = await bcrypt.hash(password, 5);

  await userService.register(name, email, hashedPass);

  res.send({ message: 'Check your email' });
};

const activate = async (req, res) => {
  const { activationToken } = req.params;
  const user = await User.findOne({ where: { activationToken } });

  if (!user) {
    throw ApiError.badRequest();
  }

  user.activationToken = ACTIVATED_STATUS;
  await user.save();

  await generateTokens(res, user);
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await userService.findByEmail(email);

  if (!user) {
    throw ApiError.badRequest('No such user');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw ApiError.badRequest('Wrong password');
  }

  await generateTokens(res, user);
};

const generateTokens = async (res, user) => {
  const normalizedUser = userService.normalize(user);

  const accessToken = jwtService.signAccessToken(normalizedUser);
  const refreshToken = jwtService.signRefreshToken(normalizedUser);

  await tokenService.save(normalizedUser.id, refreshToken);

  res.cookie('refreshToken', refreshToken, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  });

  res.send({
    user: normalizedUser,
    accessToken,
  });
};

const refresh = async (req, res) => {
  const { refreshToken } = req.cookies;

  const userData = jwtService.verifyRefreshToken(refreshToken);
  const token = await tokenService.getByToken(refreshToken);

  if (!userData || !token) {
    throw ApiError.unauthorized();
  }

  const { id, name, email } = await userService.findById(userData.id);

  await generateTokens(res, { id, name, email });
};

const logout = async (req, res) => {
  const { refreshToken } = req.cookies;

  const user = await jwtService.verifyRefreshToken(refreshToken);

  if (!user || !refreshToken) {
    throw ApiError.unauthorized();
  }

  await tokenService.remove(user.id);

  res.sendStatus(204);
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await userService.findByEmail(email);

  if (!user) {
    throw ApiError.badRequest('No such user');
  }

  await userService.forgotPassword(user, email);

  res.sendStatus(200);
};

const resetPassword = async (req, res) => {
  const { resetToken, password } = req.body;

  const tokenData = await Token.findOne({
    where: { resetToken },
    include: User,
  });

  if (!tokenData) {
    throw ApiError.badRequest('This token is invalid');
  }

  const error = validatePassword(password);

  if (error) {
    throw ApiError.badRequest(error);
  }

  const user = tokenData.user;

  if (!user) {
    throw ApiError.badRequest('No such user');
  }

  const hashedPassword = await bcrypt.hash(password, 5);
  user.password = hashedPassword;
  await user.save();

  tokenData.resetToken = null;
  await tokenData.save();

  res.sendStatus(200);
};

export const authController = {
  register,
  activate,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
