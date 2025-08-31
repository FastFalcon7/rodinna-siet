const fs = require('fs');
const path = require('path');

const components = [
  'Feed/PostCard',
  'Feed/CreatePost',
  'Chat/MessageList',
  'Chat/MessageInput',
  'Calendar/EventCard',
  'Albums/AlbumCard',
  'Settings/ProfileSettings',
  'Shared/Header',
  'Shared/Sidebar',
  'Shared/MobileNav',
  'Shared/LoadingScreen',
  'Auth/LoginScreen'
];

components.forEach(comp => {
  const [folder, name] = comp.split('/');
  const dir = path.join('src', 'components', folder);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const componentContent = `import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function ${name}() {
  const { darkMode } = useTheme();
  
  return (
    <div className={\`\${darkMode ? 'dark' : ''}\`}>
      <h2>${name} Component</h2>
      {/* TODO: Implement ${name} */}
    </div>
  );
}

export default ${name};
`;

  fs.writeFileSync(
    path.join(dir, `${name}.jsx`),
    componentContent
  );
  
  console.log(`✅ Created ${folder}/${name}.jsx`);
});

console.log('🎉 All components created!');