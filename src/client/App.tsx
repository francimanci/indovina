import { Route, Switch } from "wouter";
import { Layout } from "@client/components/Layout";
import { Landing } from "@client/pages/Landing";
import { Intake } from "@client/pages/Intake";
import { Plan } from "@client/pages/Plan";
import { NotFound } from "@client/pages/NotFound";

export default function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/intake" component={Intake} />
        <Route path="/plan/:profileId" component={Plan} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}
