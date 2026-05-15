import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import PropTypes from 'prop-types';

const Input = ({
  type = 'text',
  label,
  value,
  onChange,
  error,
  disabled = false,
  placeholder = '',
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasValue = value && value.length > 0;
  const isFloating = isFocused || hasValue;

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const baseClasses = `
    w-full px-4 pt-6 pb-2
    bg-white/50 backdrop-blur-sm
    border rounded-xl
    transition-all duration-300
    outline-none
    text-navy
  `;

  const stateClasses = error
    ? 'border-crimson focus:border-crimson focus:shadow-glow'
    : 'border-slate/30 focus:border-slate focus:shadow-md';

  const labelClasses = `
    absolute left-4 transition-all duration-300 pointer-events-none
    ${isFloating 
      ? 'top-2 text-xs text-slate' 
      : 'top-1/2 -translate-y-1/2 text-base text-slate/70'
    }
  `;

  return (
    <div className={`relative ${className}`}>
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        placeholder={isFloating ? placeholder : ''}
        className={`${baseClasses} ${stateClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        {...props}
      />
      <label className={labelClasses}>
        {label}
      </label>
      
      {type === 'password' && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate hover:text-navy transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}

      {error && (
        <p className="mt-1 text-sm text-crimson animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
};

Input.propTypes = {
  type: PropTypes.oneOf(['text', 'email', 'password', 'number', 'date', 'tel']),
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
};

export default Input;
