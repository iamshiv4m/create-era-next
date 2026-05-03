import { createHashRouter } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { HomePage } from './features/home/HomePage'
import { PostsPage } from './features/posts/PostsPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { AboutPage } from './features/about/AboutPage'
import { ErrorPage } from './components/ErrorPage'

/**
 * HashRouter is used because Electron serves `file://` URLs in production;
 * BrowserRouter would 404 on refresh/navigation.
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'posts', element: <PostsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'about', element: <AboutPage /> },
    ],
  },
])
