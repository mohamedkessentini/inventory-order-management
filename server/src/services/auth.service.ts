import bcrypt from 'bcryptjs';
import { User, UserDocument } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { signToken } from '../middleware/auth';
import { RegisterInput, LoginInput } from '../validators/auth.validators';

const SALT_ROUNDS = 10;

export interface AuthResult {
  token: string;
  user: Pick<UserDocument, '_id' | 'name' | 'email'>;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await User.create({ name: input.name, email: input.email, passwordHash });

  return buildAuthResult(user);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return buildAuthResult(user);
}

function buildAuthResult(user: UserDocument): AuthResult {
  const token = signToken({ sub: user._id.toString(), email: user.email });
  return { token, user: { _id: user._id, name: user.name, email: user.email } };
}
