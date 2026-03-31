import React, { useState } from 'react';
import { Eye, EyeOff, Search, ChevronDown, X } from 'lucide-react';

/**
 * Common label component used across all inputs
 */
const InputLabel = ({ label, required, error }) => {
  if (!label) return null;
  return (
    <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 transition-colors duration-300 ${error ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-indigo-500'}`}>
      {label} {required && <span className="text-rose-500 ml-0.5">·</span>}
    </label>
  );
};

/**
 * Common error/helper text component
 */
const InputHelper = ({ error, helperText }) => {
  if (error) {
    return <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-rose-500 animate-in fade-in">{error}</p>;
  }
  if (helperText) {
    return <p className="mt-2 text-[10px] font-bold text-slate-400">{helperText}</p>;
  }
  return null;
};

/**
 * FormInput - Standard text/email/number input with prefix/suffix support
 */
export const FormInput = React.forwardRef(({
  label, type = 'text', error, helperText, prefix: PrefixIcon, suffix: SuffixIcon,
  required, className = '', wrapperClassName = '', disabled, ...props
}, ref) => {
  return (
    <div className={`w-full group ${wrapperClassName}`}>
      <InputLabel label={label} required={required} error={error} />
      <div className="relative">
        {PrefixIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-[50%] text-slate-400 group-focus-within:text-indigo-500 transition-all duration-300 pointer-events-none group-focus-within:scale-110 flex items-center justify-center">
            <PrefixIcon size={18} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={`
            w-full bg-slate-50/50 border rounded-2xl px-5 py-4 text-sm font-bold text-slate-800
            placeholder:text-slate-400/60 transition-all duration-500 outline-none
            disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100
            ${PrefixIcon ? 'pl-12' : ''}
            ${SuffixIcon ? 'pr-12' : ''}
            ${error 
              ? 'border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' 
              : 'border-slate-200 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 shadow-sm focus:shadow-indigo-500/5 hover:border-slate-300'
            }
            ${className}
          `}
          {...props}
        />
        {SuffixIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-[50%] text-slate-400 group-focus-within:text-indigo-500 transition-all duration-300 pointer-events-none group-focus-within:scale-110 flex items-center justify-center">
            <SuffixIcon size={18} />
          </div>
        )}
      </div>
      <InputHelper error={error} helperText={helperText} />
    </div>
  );
});
FormInput.displayName = 'FormInput';

/**
 * PasswordInput - Text input with built-in show/hide toggle
 */
export const PasswordInput = React.forwardRef(({
  label, error, helperText, required, prefix: PrefixIcon, className = '', ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full group">
      <InputLabel label={label} required={required} error={error} />
      <div className="relative">
        {PrefixIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-[50%] text-slate-400 group-focus-within:text-indigo-500 transition-all duration-300 pointer-events-none group-focus-within:scale-110 flex items-center justify-center">
            <PrefixIcon size={18} />
          </div>
        )}
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={`
            w-full bg-slate-50/50 border rounded-2xl py-4 text-sm font-bold text-slate-800
            placeholder:text-slate-400/60 transition-all duration-500 outline-none
            ${PrefixIcon ? 'pl-12' : 'pl-5'}
            ${error 
              ? 'border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' 
              : 'border-slate-200 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 shadow-sm hover:border-slate-300'
            }
            ${className}
          `}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-[50%] text-slate-400 hover:text-indigo-500 focus:outline-none transition-all duration-400 hover:scale-115 active:scale-90 flex items-center justify-center"
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <InputHelper error={error} helperText={helperText} />
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

/**
 * SearchInput - Slightly taller, very clear focus state for dashboards
 */
export const SearchInput = React.forwardRef(({
  className = '', onClear, value, ...props
}, ref) => {
  return (
    <div className={`relative group w-full ${className}`}>
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-all duration-300 pointer-events-none group-focus-within:scale-110">
        <Search size={18} />
      </div>
      <input
        ref={ref}
        type="text"
        value={value}
        className={`
          w-full bg-slate-50/50 border border-slate-200 rounded-2xl ${onClear ? 'pl-14 pr-12' : 'pl-14 pr-5'} py-4 text-sm font-bold text-slate-800
          placeholder:text-slate-300 transition-all duration-300 outline-none
          hover:bg-white hover:border-slate-300 hover:shadow-md
          focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 shadow-sm
        `}
        {...props}
      />
      {onClear && value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 focus:outline-none transition-all duration-300 hover:scale-110 active:scale-90"
          tabIndex={-1}
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
});
SearchInput.displayName = 'SearchInput';

/**
 * SelectInput - Styled dropdown matching FormInput
 */
export const SelectInput = React.forwardRef(({
  label, options = [], error, helperText, required, className = '', prefix: PrefixIcon, ...props
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      <InputLabel label={label} required={required} error={error} />
      <div className="relative group">
        {PrefixIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none z-10">
            <PrefixIcon size={18} />
          </div>
        )}
        <select
          ref={ref}
          className={`
            w-full bg-slate-50 border rounded-xl pr-11 py-3 text-sm font-semibold text-slate-800
            transition-all duration-300 outline-none appearance-none cursor-pointer
            ${PrefixIcon ? 'pl-11' : 'pl-4'}
            ${error 
              ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 box-shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]' 
              : 'border-slate-200 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:border-slate-300'
            }
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
          <ChevronDown size={18} />
        </div>
      </div>
      <InputHelper error={error} helperText={helperText} />
    </div>
  );
});
SelectInput.displayName = 'SelectInput';
