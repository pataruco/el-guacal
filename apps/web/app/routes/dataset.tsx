import Page from '../components/page';

export default function Dataset() {
  const today = new Date().toISOString().split('T')[0];
  const downloadUrl = `https://github.com/pataruco/el-guacal/releases/download/${encodeURI(`data-export@${today}`)}/el-guacal-db-${today}.zip`;
  console.log(downloadUrl);

  return (
    <Page className="dataset">
      <h1>Dataset</h1>
      <p>
        You can download the latest version of the El Guacal dataset here. The
        dataset is updated daily and includes information about all stores and
        products.
      </p>
      <div style={{ marginTop: '2rem' }}>
        <a className="button" href={downloadUrl}>
          Download Dataset ({today})
        </a>
      </div>
      <section style={{ marginTop: '3rem' }}>
        <h2>What's included?</h2>
        <ul>
          <li>
            <strong>stores.csv</strong>: A list of all stores with their names,
            addresses, coordinates, and associated product IDs.
          </li>
          <li>
            <strong>products.csv</strong>: A list of all products with their
            names and brands.
          </li>
          <li>
            <strong>data.json</strong>: A complete JSON export of all stores and
            products.
          </li>
        </ul>
      </section>
    </Page>
  );
}
