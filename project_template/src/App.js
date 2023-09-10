// Libraries
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { generateApiClient, ApiProvider } from "@hybris-software/use-query";
import { AuthProvider } from "@hybris-software/use-auth";

// Data
import config from "./Data/config";
import { routeComponents } from "./Data/routes";

// Views
import NotFoundView from "./Views/Generic/NotFoundView";

function App() {
  const apiClient = generateApiClient({
    baseUrl: config.API_BASE_URL,
    authorizationHeader: "Authorization",
    authorizationPrefix: "Bearer",
  });

  const authUrl = `${config.API_BASE_URL}/auth`;

  return (
    <BrowserRouter>
      <ApiProvider apiClient={apiClient}>
        <AuthProvider apiClient={apiClient} authUrl={authUrl}>
          <Routes>
            {routeComponents}
            <Route path="*" element={<NotFoundView />} />
          </Routes>
        </AuthProvider>
      </ApiProvider>
    </BrowserRouter>
  );
}

export default App;
