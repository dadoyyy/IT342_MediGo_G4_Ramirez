import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Button component with variants
 * Variants:
 * - primary: Crimson background with ruby hover
 * - secondary: Glassmorphism with slate text
 * - ghost: Transparent with hover background
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props
}) => {
  const baseClasses = 'rounded-xl font-medium transition-all duration-300 inline-flex items-center justify-center gap-2';

  const variantClasses = {
    primary: `
      bg-crimson text-mist
      hover:bg-ruby hover:shadow-glow
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    secondary: `
      bg-glass-white backdrop-blur-md
      border border-glass-border
      text-navy
      hover:bg-white/80 hover:shadow-md
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    ghost: `
      bg-transparent text-navy
      hover:bg-crimson/10
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default Button;
