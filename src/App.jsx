import { BrowserRouter as Router } from "react-router-dom";
import "./bootstrap-lite.css";
import "./App.css";

import AuthProvider from "./Contexts/AuthContext.jsx";
import StockProvider from "./Contexts/StockContext";
import UIProvider from "./Contexts/UIContext";

import Routing from "./Routing.jsx";

function App() {
  return (
    <AuthProvider>
      <StockProvider>
        <UIProvider>
          <div className="container-fluid">
            <Router>
              <Routing />
            </Router>
          </div>
        </UIProvider>
      </StockProvider>
    </AuthProvider>
  );
}

export default App;
