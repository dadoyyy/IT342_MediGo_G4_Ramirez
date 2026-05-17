import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Card component with glassmorphism styling
 * Features:
 * - Glassmorphism background with backdrop blur
 * - Rounded-xl border radius
 * - Soft shadow for depth
 * - Optional hover lift animation
 * - Thin elegant borders
 */
const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  onClick,
  ...props 
}) => {
  const baseClasses = `
    bg-glass-white backdrop-blur-md
    rounded-xl
    shadow-md
    border border-glass-border
    p-lg
    transition-all duration-300
  `;

  const hoverClasses = hover ? 'hover:-translate-y-1 hover:shadow-lg cursor-pointer' : '';

  const Component = hover || onClick ? motion.div : 'div';

  const motionProps = hover || onClick ? {
    whileHover: { y: -4, transition: { duration: 0.3 } },
    whileTap: onClick ? { scale: 0.98 } : undefined,
  } : {};

  return (
    <Component
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hover: PropTypes.bool,
  onClick: PropTypes.func,
};

export default Card;
