// Mascote original: um tigrinho de óculos, desenhado em SVG.
// O prefixo evita ids de gradiente repetidos quando o SVG aparece mais de uma vez.
function tigerSVG(p) {
  const ink = "#2b1000";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400">
  <defs>
    <radialGradient id="${p}h" cx="50%" cy="38%" r="68%">
      <stop offset="0" stop-color="#ffc85a"/><stop offset=".7" stop-color="#f08a16"/><stop offset="1" stop-color="#d9600a"/>
    </radialGradient>
    <linearGradient id="${p}g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff5b0"/><stop offset=".5" stop-color="#ffcf3f"/><stop offset="1" stop-color="#c98510"/>
    </linearGradient>
  </defs>
  <circle cx="44" cy="50" r="28" fill="#e8770f" stroke="#5a1d00" stroke-width="4"/>
  <circle cx="44" cy="53" r="14" fill="#ffd9b0"/>
  <circle cx="156" cy="50" r="28" fill="#e8770f" stroke="#5a1d00" stroke-width="4"/>
  <circle cx="156" cy="53" r="14" fill="#ffd9b0"/>
  <ellipse cx="100" cy="112" rx="82" ry="74" fill="url(#${p}h)" stroke="#5a1d00" stroke-width="4"/>
  <path d="M100 40 L91 62 L100 72 L109 62 Z" fill="${ink}"/>
  <path d="M77 45 Q84 58 79 72 Q71 61 69 49 Z" fill="${ink}"/>
  <path d="M123 45 Q116 58 121 72 Q129 61 131 49 Z" fill="${ink}"/>
  <path d="M20 98 Q36 100 47 108 Q34 110 21 112 Z" fill="${ink}"/>
  <path d="M22 124 Q37 121 47 126 Q35 131 27 138 Z" fill="${ink}"/>
  <path d="M180 98 Q164 100 153 108 Q166 110 179 112 Z" fill="${ink}"/>
  <path d="M178 124 Q163 121 153 126 Q165 131 173 138 Z" fill="${ink}"/>
  <ellipse cx="80" cy="146" rx="27" ry="23" fill="#fff4e2"/>
  <ellipse cx="120" cy="146" rx="27" ry="23" fill="#fff4e2"/>
  <ellipse cx="52" cy="132" rx="10" ry="6" fill="#ff6b7d" opacity=".45"/>
  <ellipse cx="148" cy="132" rx="10" ry="6" fill="#ff6b7d" opacity=".45"/>
  <path d="M100 160 Q90 172 100 176 Q110 172 100 160 Z" fill="#ff7d93"/>
  <path d="M86 124 Q100 117 114 124 Q107 137 100 139 Q93 137 86 124 Z" fill="#e2546f" stroke="#5a1d00" stroke-width="2.5"/>
  <path d="M100 139 V150 M100 150 Q91 160 80 153 M100 150 Q109 160 120 153" stroke="#5a1d00" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="72" cy="150" r="2.2" fill="#c98a5a"/><circle cx="64" cy="144" r="2.2" fill="#c98a5a"/>
  <circle cx="128" cy="150" r="2.2" fill="#c98a5a"/><circle cx="136" cy="144" r="2.2" fill="#c98a5a"/>
  <circle cx="70" cy="98" r="21" fill="#fffaf0"/>
  <circle cx="130" cy="98" r="21" fill="#fffaf0"/>
  <circle cx="73" cy="100" r="9.5" fill="${ink}"/><circle cx="77" cy="95.5" r="3.6" fill="#fff"/>
  <circle cx="127" cy="100" r="9.5" fill="${ink}"/><circle cx="131" cy="95.5" r="3.6" fill="#fff"/>
  <circle cx="70" cy="98" r="22" fill="none" stroke="url(#${p}g)" stroke-width="6"/>
  <circle cx="130" cy="98" r="22" fill="none" stroke="url(#${p}g)" stroke-width="6"/>
  <path d="M91 94 Q100 87 109 94" stroke="url(#${p}g)" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M48 93 L24 86 M152 93 L176 86" stroke="url(#${p}g)" stroke-width="5" stroke-linecap="round"/>
</svg>`;
}
