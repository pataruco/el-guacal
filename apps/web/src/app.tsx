import './styles/index.scss';

import MapComponent from './components/map';
import Page from './components/page';
import StoreComponent from './components/store';

export const App = () => (
  <Page className="home">
    <MapComponent />
    <StoreComponent />
  </Page>
);
