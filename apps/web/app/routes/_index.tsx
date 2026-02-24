import MapComponent from '../components/map';
import Page from '../components/page';
import StoreComponent from '../components/store';

export default function Home() {
  return (
    <Page className="home">
      <MapComponent />
      <StoreComponent />
    </Page>
  );
}
