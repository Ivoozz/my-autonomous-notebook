import os

path = '/root/my-autonomous-app/frontend/src/App.css'
with open(path, 'r') as f:
    content = f.read()

# Update accent-glow
content = content.replace('--accent-glow: rgba(139, 92, 246, 0.4);', '--accent-glow: color-mix(in srgb, var(--accent-color) 40%, transparent);')

# Add mobile-only rule
if '.mobile-only' not in content:
    mobile_only_rule = """
/* Desktop-only hiding for mobile elements */
@media (min-width: 769px) {
  .mobile-only { display: none !important; }
}
"""
    content += mobile_only_rule

# Refine icon colors
icon_fixes = """
/* Icon & SVG Refinements */
svg {
  transition: color 0.3s ease, fill 0.3s ease;
}

body:not(.light-mode) svg {
  color: #ffffff;
}

body.light-mode svg {
  color: #1a1a1a !important;
}

.btn-icon.active svg, .login-btn svg {
  color: #ffffff !important;
}
"""
if 'Icon & SVG Refinements' not in content:
    content += icon_fixes

with open(path, 'w') as f:
    f.write(content)
