import { Route, Switch } from "wouter";
import { Layout } from "@client/components/Layout";
import { ProtectedRoute } from "@client/components/ProtectedRoute";
import { Landing } from "@client/pages/Landing";
import { Intake } from "@client/pages/Intake";
import { Plan } from "@client/pages/Plan";
import { Login } from "@client/pages/Login";
import { Signup } from "@client/pages/Signup";
import { Dashboard } from "@client/pages/Dashboard";
import { NotFound } from "@client/pages/NotFound";

export default function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/intake">
          <ProtectedRoute>
            <Intake />
          </ProtectedRoute>
        </Route>
        <Route path="/plan/:profileId">
          <ProtectedRoute>
            <Plan />
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}
