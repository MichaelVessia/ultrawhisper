// Embedded SVG icons as base64 for different tray states
export const TrayIcons = {
  idle: `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" fill="none" stroke="#666" stroke-width="2"/>
      <circle cx="8" cy="8" r="3" fill="#666"/>
    </svg>
  `).toString('base64')}`,

  recording: `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" fill="#ff4444"/>
      <circle cx="8" cy="8" r="3" fill="#ffffff"/>
    </svg>
  `).toString('base64')}`,

  processing: `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" fill="none" stroke="#4488ff" stroke-width="2"/>
      <circle cx="8" cy="8" r="2" fill="#4488ff"/>
      <circle cx="8" cy="4" r="1" fill="#4488ff" opacity="0.5"/>
      <circle cx="8" cy="12" r="1" fill="#4488ff" opacity="0.5"/>
    </svg>
  `).toString('base64')}`,
}
