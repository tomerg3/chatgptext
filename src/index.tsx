import "@wix/dashboard-sdk";
import { createRoot } from 'react-dom/client';
import './globals.st.css';
import { BlogAppsExtension } from './blogApp';

createRoot(document.body.appendChild(document.createElement('div'))).render(
        <BlogAppsExtension/>
);
