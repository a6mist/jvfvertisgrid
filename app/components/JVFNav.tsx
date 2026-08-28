import { Link } from 'react-router';
import { colors } from '../config/design-tokens';

export const JVFNav = () => {
  return (
    <header
      className="sticky top-0 z-100 backdrop-blur-md border-b"
      style={{
        background: 'rgba(10, 14, 20, 0.85)',
        borderColor: colors.borderSoft,
      }}
    >
      <div
        className="max-w-[1200px] mx-auto px-8 flex items-center justify-between h-[72px]"
      >
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <div
            className="text-xl font-bold"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: colors.text }}
          >
            JVF
          </div>
          <span
            className="text-xs font-medium tracking-wider"
            style={{ color: colors.textFaint, display: 'block', lineHeight: '1.2' }}
          >
            VERTIS GRID<br />ONLINE
          </span>
        </Link>

        {/* Nav Links */}
        <nav
          className="flex gap-9 font-medium text-sm hidden md:flex"
          style={{ color: colors.textDim }}
        >
          <Link to="/markets" className="hover:text-white transition-colors">
            Markets
          </Link>
          <Link to="/platform" className="hover:text-white transition-colors">
            Platform
          </Link>
          <Link to="/security" className="hover:text-white transition-colors">
            Security
          </Link>
          <Link to="/docs" className="hover:text-white transition-colors">
            Docs
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-5">
          <Link
            to="/signin"
            className="font-medium text-sm px-5 py-2.5 rounded-lg transition-colors hover:text-white"
            style={{ color: colors.textDim }}
          >
            Sign in
          </Link>
          <Link
            to="/launch-app"
            className="font-semibold text-sm px-5 py-2.5 rounded-lg text-black"
            style={{ background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})` }}
          >
            Launch App
          </Link>
        </div>
      </div>
    </header>
  );
};
