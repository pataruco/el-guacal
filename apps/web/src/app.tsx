import './styles/index.scss';

import MapComponent from './components/map';
import Page from './components/page';

export const App = () => (
  <Page className="home">
    <MapComponent />
  </Page>
);
