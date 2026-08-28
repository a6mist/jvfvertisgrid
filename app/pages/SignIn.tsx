import { motion } from 'motion/react';
import { colors } from '../config/design-tokens';
import { Link } from 'react-router';
import { Github, Mail } from 'lucide-react';

export const SignIn = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-8" style={{ background: colors.bg, color: colors.text }}>
      {/* Background Grid */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 90%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md z-10"
      >
        {/* Card */}
        <div
          className="p-12 rounded-3xl border"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          {/* Header */}
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider mb-4 px-3 py-1.5 rounded-full border"
              style={{
                color: colors.teal,
                background: `rgba(47, 211, 232, 0.08)`,
                borderColor: `rgba(47, 211, 232, 0.25)`,
              }}
            >
              SECURE SIGN IN
            </div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Welcome back
            </h1>
            <p style={{ color: colors.textDim, fontSize: '14px' }}>
              Sign in to your JVF account
            </p>
          </div>

          {/* Form */}
          <form className="mb-8">
            {/* Email */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2.5">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:border-opacity-100"
                style={{
                  background: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:border-opacity-100"
                style={{
                  background: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between mb-8 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span>Remember me</span>
              </label>
              <Link to="#" style={{ color: colors.teal }} className="hover:opacity-80 transition">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-semibold text-black transition-all hover:shadow-lg"
              style={{ background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})` }}
            >
              Sign in
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div style={{ flex: 1, height: '1px', background: colors.border }} />
            <span style={{ color: colors.textFaint, fontSize: '12px' }}>OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: '1px', background: colors.border }} />
          </div>

          {/* Social */}
          <div className="flex gap-3 mb-8">
            <button
              className="flex-1 py-3 rounded-xl border font-medium transition-all hover:bg-opacity-100"
              style={{
                borderColor: colors.border,
                background: colors.bg,
                color: colors.text,
              }}
            >
              <Github size={18} className="inline mr-2" />
              GitHub
            </button>
            <button
              className="flex-1 py-3 rounded-xl border font-medium transition-all hover:bg-opacity-100"
              style={{
                borderColor: colors.border,
                background: colors.bg,
                color: colors.text,
              }}
            >
              <Mail size={18} className="inline mr-2" />
              Google
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm">
            Don't have an account?{' '}
            <Link to="#" style={{ color: colors.teal }} className="font-medium hover:opacity-80 transition">
              Create one
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link
            to="/"
            style={{ color: colors.textDim }}
            className="text-sm hover:text-white transition"
          >
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
