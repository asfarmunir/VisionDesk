import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// VisionDesk Brand Colors
  			vision: {
  				primary: '#3D256A', // Primary brand color
  				accent: '#3AC49D',  // Accent color
  				purple: {
  					50: '#f0ebff',
  					100: '#d4c1ff',
  					200: '#b197ff',
  					300: '#8e6dff',
  					400: '#6b43ff',
  					500: '#3D256A',
  					600: '#341f5a',
  					700: '#2b194a',
  					800: '#22133a',
  					900: '#190d2a'
  				},
  				green: {
  					50: '#ecfdf5',
  					100: '#d1fae5',
  					200: '#a7f3d0',
  					300: '#6ee7b7',
  					400: '#34d399',
  					500: '#3AC49D',
  					600: '#059669',
  					700: '#047857',
  					800: '#065f46',
  					900: '#064e3b'
  				}
  			},
  			// Futuristic glass & neon effects
  			glass: {
  				light: 'rgba(255, 255, 255, 0.1)',
  				medium: 'rgba(255, 255, 255, 0.2)',
  				heavy: 'rgba(255, 255, 255, 0.3)'
  			},
  			neon: {
  				purple: '#9d4edd',
  				cyan: '#06ffa5',
  				pink: '#ff006e',
  				blue: '#8ecae6'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
  			mono: ['var(--font-geist-mono)', 'Consolas', 'monospace']
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.5s ease-in-out',
  			'slide-in': 'slideIn 0.3s ease-out',
  			'scale-in': 'scaleIn 0.2s ease-out',
  			'glow': 'glow 2s ease-in-out infinite alternate',
  			'float': 'float 3s ease-in-out infinite',
  			'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'shimmer': 'shimmer 2s linear infinite',
  			'bounce-subtle': 'bounceSubtle 2s infinite'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' }
  			},
  			slideIn: {
  				'0%': { transform: 'translateY(10px)', opacity: '0' },
  				'100%': { transform: 'translateY(0)', opacity: '1' }
  			},
  			scaleIn: {
  				'0%': { transform: 'scale(0.9)', opacity: '0' },
  				'100%': { transform: 'scale(1)', opacity: '1' }
  			},
  			glow: {
  				'0%': { boxShadow: '0 0 5px #3AC49D' },
  				'100%': { boxShadow: '0 0 20px #3AC49D, 0 0 30px #3AC49D' }
  			},
  			float: {
  				'0%, 100%': { transform: 'translateY(0px)' },
  				'50%': { transform: 'translateY(-10px)' }
  			},
  			shimmer: {
  				'0%': { transform: 'translateX(-100%)' },
  				'100%': { transform: 'translateX(100%)' }
  			},
  			bounceSubtle: {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-5px)' }
  			}
  		},
  		backdropBlur: {
  			xs: '2px'
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
  			'cyber-grid': 'linear-gradient(rgba(61, 37, 106, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(61, 37, 106, 0.1) 1px, transparent 1px)'
  		}
  	}
  },
  plugins: [],
} satisfies Config;
