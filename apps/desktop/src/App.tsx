import { HashRouter, Routes, Route } from 'react-router-dom';
import { Providers } from './providers';
import { ErrorBoundary } from './components/error-boundary';
import { AppShell } from './components/layout/app-shell';
import { ProtectedRoute } from './components/auth/protected-route';
// 导入所有页面组件
import HomePage from './routes/home';
import LoginPage from './routes/auth/login';
import RegisterPage from './routes/auth/register';
import BuildListPage from './routes/build/list';
import BuildConsolePage from './routes/build/console';
import ConfigurePage from './routes/build/configure';
import PreviewPage from './routes/build/preview';
import DeployPage from './routes/build/deploy';
import StorePage from './routes/store/index';
import ProductDetailPage from './routes/store/product';
import CreatorPage from './routes/creator/index';
import CreatorProductsPage from './routes/creator/products';
import SettingsPage from './routes/settings/index';
import AiModelsPage from './routes/settings/ai-models';
import ProfilePage from './routes/settings/profile';
import NotificationsPage from './routes/settings/notifications';
import AboutPage from './routes/settings/about';

export default function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              {/* 公开路由 */}
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="store" element={<StorePage />} />
              <Route path="store/:productId" element={<ProductDetailPage />} />

              {/* 需登录访问的路由 */}
              <Route element={<ProtectedRoute />}>
                <Route path="build" element={<BuildListPage />} />
                <Route path="build/:sessionId" element={<BuildConsolePage />} />
                <Route path="build/:sessionId/configure" element={<ConfigurePage />} />
                <Route path="build/:sessionId/preview" element={<PreviewPage />} />
                <Route path="build/:sessionId/deploy" element={<DeployPage />} />
                <Route path="creator" element={<CreatorPage />} />
                <Route path="creator/products" element={<CreatorProductsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="settings/ai-models" element={<AiModelsPage />} />
                <Route path="settings/profile" element={<ProfilePage />} />
                <Route path="settings/notifications" element={<NotificationsPage />} />
                <Route path="settings/about" element={<AboutPage />} />
              </Route>
            </Route>
          </Routes>
        </HashRouter>
      </Providers>
    </ErrorBoundary>
  );
}
